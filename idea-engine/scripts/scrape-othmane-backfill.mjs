#!/usr/bin/env node

/**
 * scrape-othmane-backfill.mjs — one-shot backfill for Othmane Khadri
 *
 * Pulls up to 150 posts from his LinkedIn profile via Apify,
 * filters to the last 120 days, extracts image/video assets,
 * dedupes against existing Supabase rows, and upserts new ones
 * into content_posts.
 *
 * Usage:
 *   node content-os/idea-engine/scripts/scrape-othmane-backfill.mjs
 */

import {
  classifyPost,
  loadEnv,
  normalizePost,
  trimSmart,
} from './lib/content-automation.mjs';
import { upsertPosts } from './lib/supabase-client.mjs';

const PROFILE_URL = 'https://www.linkedin.com/in/othmane-khadri-b48162236/';
const CREATOR_NAME = 'Othmane Khadri';
const MAX_POSTS = 150;
const DAYS_WINDOW = 120;
const APIFY_ACTOR = 'harvestapi~linkedin-profile-posts';

function extractAssets(rawPost) {
  // The harvestapi actor can nest media in several places — try them all.
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
    } else if (val && typeof val === 'object') {
      if (val.url) candidates.push(val.url);
      else if (val.imageUrl) candidates.push(val.imageUrl);
    }
  };

  push(rawPost.postImages);
  push(rawPost.images);
  push(rawPost.imageUrls);
  push(rawPost.image);
  push(rawPost.imageUrl);
  push(rawPost.media);
  push(rawPost.thumbnail);
  push(rawPost.thumbnails);
  push(rawPost.attachments);
  push(rawPost.postVideos);
  push(rawPost.videos);
  if (rawPost.post && typeof rawPost.post === 'object') push(rawPost.post.images);

  // Deduplicate and keep only http URLs
  const unique = Array.from(new Set(candidates)).filter((u) => /^https?:\/\//.test(u));
  return unique;
}

async function runApify(token) {
  const payload = {
    profileUrls: [PROFILE_URL],
    maxPosts: MAX_POSTS,
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
    const text = await response.text();
    throw new Error(`Apify failed: ${response.status} ${text.slice(0, 300)}`);
  }
  return response.json();
}

async function fetchExistingLinks() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_JWT;
  if (!url || !key) throw new Error('Missing SUPABASE_URL / SUPABASE_SERVICE_JWT');

  const endpoint = `${url}/rest/v1/content_posts?select=link&creator=eq.${encodeURIComponent(CREATOR_NAME)}&limit=2000`;
  const response = await fetch(endpoint, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase read failed: ${response.status} ${text.slice(0, 300)}`);
  }
  const data = await response.json();
  return new Set((data || []).map((r) => r.link).filter(Boolean));
}

async function main() {
  await loadEnv();

  const token = process.env.APIFY_API_TOKEN;
  if (!token) throw new Error('Missing APIFY_API_TOKEN in .env.local');

  console.log(`\n📡 Pulling up to ${MAX_POSTS} posts from ${CREATOR_NAME}...`);
  const rawPosts = await runApify(token);
  console.log(`  ✓ Apify returned ${rawPosts.length} posts`);

  if (rawPosts.length === 0) {
    console.log('Nothing came back. Aborting.');
    return;
  }

  // Debug: show what asset fields exist on the first post so we can refine.
  const first = rawPosts[0];
  const assetHints = Object.keys(first).filter((k) =>
    /image|media|thumb|attach|asset|photo|video/i.test(k),
  );
  console.log(`  ℹ️  Asset-like fields on first post: ${assetHints.join(', ') || '(none found)'}`);

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - DAYS_WINDOW);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  console.log(`  📅 Keeping posts dated >= ${cutoffStr}`);

  const existingLinks = await fetchExistingLinks();
  console.log(`  📚 Othmane already has ${existingLinks.size} rows in content_posts`);

  let inWindow = 0;
  let outsideWindow = 0;
  let alreadyExists = 0;
  let withAssets = 0;
  const rows = [];

  for (const rp of rawPosts) {
    const np = normalizePost(rp, { creator: CREATOR_NAME });
    if (!np.linkedinUrl) continue;
    if (!np.date) continue;

    if (np.date < cutoffStr) {
      outsideWindow += 1;
      continue;
    }
    inWindow += 1;

    if (existingLinks.has(np.linkedinUrl)) {
      alreadyExists += 1;
      // Don't skip — let the upsert refresh image_url / stats for existing rows.
    }

    const assets = extractAssets(rp);
    if (assets.length > 0) withAssets += 1;

    const category = classifyPost(np);
    rows.push({
      source: 'linkedin',
      type: category,
      title: trimSmart(np.firstLine, 500),
      creator: CREATOR_NAME,
      date: np.date,
      likes: np.likes,
      comments: np.comments,
      reposts: np.shares,
      topic: '',
      why_it_worked: '',
      link: np.linkedinUrl,
      content: np.content || '',
      image_url: assets[0] || '',
    });
  }

  console.log(`\n📊 Breakdown:`);
  console.log(`  Pulled:            ${rawPosts.length}`);
  console.log(`  Within 120 days:   ${inWindow}`);
  console.log(`  Outside window:    ${outsideWindow}`);
  console.log(`  Already in DB:     ${alreadyExists}`);
  console.log(`  New to upsert:     ${rows.length}`);
  console.log(`  New w/ asset:      ${withAssets}`);

  if (rows.length === 0) {
    console.log('\nNothing new to insert.');
    return;
  }

  const inserted = await upsertPosts(rows);
  console.log(`\n✅ Upserted ${inserted} rows to content_posts.`);
}

main().catch((error) => {
  console.error(`\n❌ Fatal: ${error.message}\n`);
  process.exitCode = 1;
});
