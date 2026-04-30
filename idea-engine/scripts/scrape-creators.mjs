#!/usr/bin/env node

/**
 * scrape-creators.mjs — Step 1 of the Content OS scrape pipeline
 *
 * Reads watchlist.json (LinkedIn creators only), pulls posts via Apify,
 * filters for winners (≥100 likes OR ≥70 comments), classifies them,
 * and writes directly to Supabase.
 *
 * Idempotent: safe to run multiple times — Supabase upserts on link.
 *
 * Usage:
 *   node scrape-creators.mjs                    # all enabled LinkedIn creators
 *   node scrape-creators.mjs --max-posts 10     # smaller pull for testing
 *   node scrape-creators.mjs --skip-filter      # skip AI relevance filter
 */

import { resolve } from 'node:path';
import {
  RAW_DIR,
  classifyPost,
  ensureAutomationDirs,
  inferTopic,
  inferWhyItWorked,
  isWinningPost,
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
import { filterByRelevance } from './lib/relevance-filter.mjs';
import { upsertPosts } from './lib/supabase-client.mjs';

const APIFY_ACTOR = 'harvestapi~linkedin-profile-posts';

async function pullCreator(creator, maxPosts, token) {
  const payload = {
    profileUrls: [creator.url],
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
    throw new Error(
      `Apify request failed for ${creator.name}: ${response.status} ${normalizeWhitespace(errorText)}`,
    );
  }

  return response.json();
}

function buildRow(post, category) {
  return {
    source: 'linkedin',
    type: category,
    title: trimSmart(post.firstLine, 500),
    creator: post.creator,
    date: post.date || null,
    likes: post.likes || 0,
    comments: post.comments || 0,
    reposts: post.shares || 0,
    topic: inferTopic(post, category),
    why_it_worked: inferWhyItWorked(post, category),
    link: post.linkedinUrl,
    content: post.content || '',
    image_url: post.imageUrl || '',
  };
}

async function main() {
  const args = parseArgs();
  await ensureAutomationDirs();
  await loadEnv();

  const token = process.env.APIFY_API_TOKEN;
  if (!token) {
    throw new Error('Missing APIFY_API_TOKEN in .env.local');
  }

  const creators = await loadWatchlist({ kind: 'linkedin' });
  if (creators.length === 0) {
    console.log('No enabled LinkedIn creators in watchlist.json. Nothing to do.');
    return;
  }

  const maxPosts = Number(args.maxPosts || 30);
  const skipFilter = args.skipFilter === true || args.skipFilter === 'true';
  console.log(`\n📡 Scraping ${creators.length} LinkedIn creators (${maxPosts} posts each)\n`);

  const dateStamp = todayString();
  const allRows = [];

  for (const creator of creators) {
    process.stdout.write(`  ${creator.name.padEnd(22)} `);
    try {
      const rawPosts = await pullCreator(creator, maxPosts, token);
      const rawCount = Array.isArray(rawPosts) ? rawPosts.length : 0;

      // Save raw for audit
      const rawPath = resolve(RAW_DIR, `${slugify(creator.name)}-${dateStamp}.json`);
      await writeJson(rawPath, rawPosts);

      // Normalize and filter winners
      const winners = [];
      for (const rp of rawPosts) {
        const np = normalizePost(rp, { creator: creator.name });
        if (isWinningPost(np) && np.linkedinUrl) {
          winners.push(np);
        }
      }

      // AI relevance filter
      let kept = winners;
      let droppedByFilter = 0;

      if (!skipFilter && winners.length > 0) {
        try {
          const verdicts = await filterByRelevance(
            winners.map((w) => ({
              title: w.firstLine,
              source: 'linkedin',
              creator: creator.name,
              topic: '',
            })),
          );
          kept = winners.filter((_, i) => verdicts[i]?.relevant);
          droppedByFilter = winners.length - kept.length;
        } catch (error) {
          console.log(`⚠️  filter error, keeping all (${error.message})`);
        }
      }

      // Build Supabase rows
      const rows = kept.map((np) => {
        const category = classifyPost(np);
        return buildRow(np, category);
      });

      allRows.push(...rows);

      const dropMsg = droppedByFilter > 0 ? `, ${droppedByFilter} filtered` : '';
      console.log(
        `pulled ${rawCount.toString().padStart(3)}, ${winners.length} winners${dropMsg}, ${rows.length} to save`,
      );
    } catch (error) {
      console.log(`❌ ${error.message}`);
    }
  }

  // Write all rows to Supabase in one batch
  if (allRows.length > 0) {
    const written = await upsertPosts(allRows);
    console.log(`\n  📦 Upserted ${written} rows to Supabase`);
  }

  console.log(`\n✅ Done. ${allRows.length} posts saved to Supabase.\n`);
}

const isDirectRun = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;

if (isDirectRun) {
  main().catch((error) => {
    console.error(`\n❌ Fatal: ${error.message}\n`);
    process.exitCode = 1;
  });
}
