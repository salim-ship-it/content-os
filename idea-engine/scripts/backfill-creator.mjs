#!/usr/bin/env node

/**
 * backfill-creator.mjs — pull N posts for a specific creator and upsert to Supabase
 *
 * Usage:
 *   node content-os/idea-engine/scripts/backfill-creator.mjs --creator "Lara Acosta" --max-posts 50
 *   node content-os/idea-engine/scripts/backfill-creator.mjs --creator "Othmane Khadri" --max-posts 150 --days 120
 */

import {
  classifyPost,
  loadEnv,
  loadWatchlist,
  normalizePost,
  parseArgs,
  trimSmart,
} from './lib/content-automation.mjs';
import { upsertPosts } from './lib/supabase-client.mjs';

const APIFY_ACTOR = 'harvestapi~linkedin-profile-posts';

async function runApify(profileUrl, maxPosts, token) {
  const url = `https://api.apify.com/v2/acts/${APIFY_ACTOR}/run-sync-get-dataset-items?token=${token}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      profileUrls: [profileUrl],
      maxPosts,
      includeComments: false,
      includeReactions: false,
    }),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Apify failed: ${response.status} ${text.slice(0, 300)}`);
  }
  return response.json();
}

function extractImageUrl(rawPost) {
  const candidates = [];
  const push = (val) => {
    if (!val) return;
    if (Array.isArray(val)) {
      for (const item of val) {
        if (typeof item === 'string') candidates.push(item);
        else if (item && typeof item === 'object') {
          if (item.url) candidates.push(item.url);
          else if (item.imageUrl) candidates.push(item.imageUrl);
          else if (item.src) candidates.push(item.src);
        }
      }
    } else if (typeof val === 'string') {
      candidates.push(val);
    }
  };
  push(rawPost.postImages);
  push(rawPost.images);
  push(rawPost.imageUrls);
  push(rawPost.image);
  push(rawPost.imageUrl);
  push(rawPost.media);
  push(rawPost.thumbnail);
  push(rawPost.postVideos);
  push(rawPost.videos);
  return candidates.find((u) => typeof u === 'string' && /^https?:\/\//.test(u)) || '';
}

async function fetchExistingLinks(creatorName) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_JWT;
  const endpoint = `${url}/rest/v1/content_posts?select=link&creator=eq.${encodeURIComponent(creatorName)}&limit=2000`;
  const response = await fetch(endpoint, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!response.ok) throw new Error(`Supabase read failed: ${response.status}`);
  const data = await response.json();
  return new Set((data || []).map((r) => r.link).filter(Boolean));
}

async function main() {
  const args = parseArgs();
  await loadEnv();

  const creatorName = String(args.creator || '');
  if (!creatorName) {
    console.error('Usage: --creator "Creator Name" [--max-posts N] [--days N]');
    process.exitCode = 1;
    return;
  }

  const token = process.env.APIFY_API_TOKEN;
  if (!token) throw new Error('Missing APIFY_API_TOKEN');

  const watchlist = await loadWatchlist({ kind: 'linkedin' });
  const entry = watchlist.find((c) => c.name.toLowerCase() === creatorName.toLowerCase());
  if (!entry) {
    console.error(`"${creatorName}" not found in watchlist.json`);
    process.exitCode = 1;
    return;
  }

  const maxPosts = Number(args.maxPosts || 50);
  const daysWindow = Number(args.days || 0);
  const cutoff = daysWindow > 0
    ? new Date(Date.now() - daysWindow * 86400000).toISOString().slice(0, 10)
    : null;

  console.log(`\n📡 Pulling up to ${maxPosts} posts from ${entry.name}...`);
  const rawPosts = await runApify(entry.url, maxPosts, token);
  console.log(`  ✓ Apify returned ${rawPosts.length} posts`);

  if (rawPosts.length === 0) { console.log('Nothing came back.'); return; }

  const existingLinks = await fetchExistingLinks(entry.name);
  console.log(`  📚 ${entry.name} already has ${existingLinks.size} rows in content_posts`);
  if (cutoff) console.log(`  📅 Keeping posts dated >= ${cutoff}`);

  let inWindow = 0, outsideWindow = 0, alreadyExists = 0, withAssets = 0;
  const rows = [];

  for (const rp of rawPosts) {
    const np = normalizePost(rp, { creator: entry.name });
    if (!np.linkedinUrl) continue;

    if (cutoff && np.date && np.date < cutoff) { outsideWindow += 1; continue; }
    inWindow += 1;

    if (existingLinks.has(np.linkedinUrl)) alreadyExists += 1;

    const assets = extractImageUrl(rp);
    if (assets) withAssets += 1;

    const category = classifyPost(np);
    rows.push({
      source: 'linkedin',
      type: category,
      title: trimSmart(np.firstLine, 500),
      creator: entry.name,
      date: np.date,
      likes: np.likes,
      comments: np.comments,
      reposts: np.shares,
      topic: '',
      why_it_worked: '',
      link: np.linkedinUrl,
      content: np.content || '',
      image_url: assets || '',
    });
  }

  console.log(`\n📊 Breakdown:`);
  console.log(`  Pulled:          ${rawPosts.length}`);
  if (cutoff) {
    console.log(`  Within window:   ${inWindow}`);
    console.log(`  Outside window:  ${outsideWindow}`);
  }
  console.log(`  Already in DB:   ${alreadyExists}`);
  console.log(`  To upsert:       ${rows.length}`);
  console.log(`  With image:      ${withAssets}`);

  if (rows.length === 0) { console.log('\nNothing new to insert.'); return; }

  const inserted = await upsertPosts(rows);
  console.log(`\n✅ Upserted ${inserted} rows to content_posts.`);
}

main().catch((error) => {
  console.error(`\n❌ Fatal: ${error.message}\n`);
  process.exitCode = 1;
});
