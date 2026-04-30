#!/usr/bin/env node

/**
 * scrape-my-posts.mjs — Pulls YOUR LinkedIn posts and populates the
 * published_posts table in Supabase (the Analytics page).
 *
 * Uses the same Apify actor as scrape-creators.mjs but writes to a
 * different table (published_posts instead of content_posts).
 *
 * Idempotent: dedupes by post_url.
 *
 * Usage:
 *   node scrape-my-posts.mjs                  # pull latest 50 posts
 *   node scrape-my-posts.mjs --max-posts 10   # smaller pull for testing
 */

import { resolve } from 'node:path';
import {
  RAW_DIR,
  classifyPost,
  ensureAutomationDirs,
  loadEnv,
  loadWatchlist,
  normalizePost,
  normalizeWhitespace,
  parseArgs,
  slugify,
  todayString,
  trimSmart,
  writeJson,
} from './lib/content-automation.mjs';

const APIFY_ACTOR = 'harvestapi~linkedin-profile-posts';

async function pullProfile(profileUrl, maxPosts, token) {
  const payload = {
    profileUrls: [profileUrl],
    maxPosts,
    includeComments: false,
    includeReactions: false,
  };

  const url = `https://api.apify.com/v2/acts/${APIFY_ACTOR}/run-sync-get-dataset-items?token=${token}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Apify ${response.status}: ${normalizeWhitespace(errorText).slice(0, 200)}`);
  }

  return response.json();
}

async function upsertToAnalytics(rows) {
  await loadEnv();
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_JWT;
  if (!supabaseUrl || !supabaseKey) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_JWT');

  // Dedupe within batch
  const seen = new Set();
  const deduped = rows.filter((r) => {
    if (!r.post_url || seen.has(r.post_url)) return false;
    seen.add(r.post_url);
    return true;
  });

  if (deduped.length === 0) return 0;

  const BATCH = 50;
  let written = 0;
  for (let i = 0; i < deduped.length; i += BATCH) {
    const batch = deduped.slice(i, i + BATCH);
    const response = await fetch(
      `${supabaseUrl}/rest/v1/published_posts?on_conflict=post_url`,
      {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal,resolution=merge-duplicates',
        },
        body: JSON.stringify(batch),
      },
    );
    if (!response.ok) {
      const text = await response.text();
      // If on_conflict fails because no unique constraint, try insert and skip dupes
      if (text.includes('unique')) {
        // Insert one by one, skip dupes
        for (const row of batch) {
          const r = await fetch(`${supabaseUrl}/rest/v1/published_posts`, {
            method: 'POST',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal',
            },
            body: JSON.stringify(row),
          });
          if (r.ok) written++;
        }
      } else {
        throw new Error(`Supabase upsert failed: ${response.status} ${text.slice(0, 200)}`);
      }
    } else {
      written += batch.length;
    }
  }
  return written;
}

async function main() {
  const args = parseArgs();
  await ensureAutomationDirs();
  await loadEnv();

  const token = process.env.APIFY_API_TOKEN;
  if (!token) throw new Error('Missing APIFY_API_TOKEN in .env.local');

  // Find your profile in the watchlist
  const watchlist = await loadWatchlist({ kind: 'my-posts' });
  if (watchlist.length === 0) {
    throw new Error('No "my-posts" entry in watchlist.json. Add your LinkedIn profile with kind: "my-posts".');
  }

  const me = watchlist[0];
  const maxPosts = Number(args.maxPosts || 50);

  console.log(`\n📡 Scraping your LinkedIn posts: ${me.name} (${maxPosts} posts)\n`);

  const rawPosts = await pullProfile(me.url, maxPosts, token);
  const rawCount = Array.isArray(rawPosts) ? rawPosts.length : 0;
  console.log(`  Pulled ${rawCount} posts from Apify`);

  // Save raw for audit
  const dateStamp = todayString();
  const rawPath = resolve(RAW_DIR, `my-posts-${dateStamp}.json`);
  await writeJson(rawPath, rawPosts);

  // Build rows for published_posts table
  const rows = [];
  for (const rp of rawPosts) {
    const np = normalizePost(rp, { creator: me.name });
    if (!np.linkedinUrl) continue;

    const category = classifyPost(np);

    rows.push({
      title: trimSmart(np.firstLine, 500),
      content: np.content || null,
      published_date: np.date || dateStamp,
      post_url: np.linkedinUrl,
      post_type: category,
      impressions: 0, // Not available from scraping — manual entry
      likes: np.likes || 0,
      comments: np.comments || 0,
      reposts: np.shares || 0,
      saves: 0,
      new_followers: 0,
      profile_visits: 0,
      score: null,
      notes: null,
    });
  }

  console.log(`  ${rows.length} posts to upsert to Analytics`);

  const written = await upsertToAnalytics(rows);
  console.log(`  📦 Upserted ${written} rows to published_posts`);

  console.log(`\n✅ Done. Your posts are now in the Analytics page.\n`);
  console.log(`  Note: impressions, saves, new_followers, and profile_visits are set to 0.`);
  console.log(`  Update them manually in the Analytics tab from your LinkedIn dashboard.\n`);
}

const isDirectRun = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;

if (isDirectRun) {
  main().catch((error) => {
    console.error(`\n❌ Fatal: ${error.message}\n`);
    process.exitCode = 1;
  });
}
