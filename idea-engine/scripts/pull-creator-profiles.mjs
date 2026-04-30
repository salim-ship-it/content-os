#!/usr/bin/env node

/**
 * pull-creator-profiles.mjs — fetch profile pictures for watchlist creators
 *
 * For each enabled LinkedIn creator in watchlist.json, pulls 1 post via Apify
 * and extracts the author profile image URL. Saves everything to a JSON cache
 * that the Content OS app reads to display profile pictures on creator dashboards.
 *
 * Idempotent: safe to re-run. Cache file lives at content-os/foundation/creator-profiles.json.
 *
 * Usage:
 *   node content-os/idea-engine/scripts/pull-creator-profiles.mjs
 *   node content-os/idea-engine/scripts/pull-creator-profiles.mjs --only "Othmane Khadri"
 */

import { promises as fs } from 'node:fs';
import { resolve } from 'node:path';
import { loadEnv, loadWatchlist, parseArgs, REPO_ROOT } from './lib/content-automation.mjs';

const APIFY_ACTOR = 'harvestapi~linkedin-profile-posts';
const CACHE_PATH = resolve(REPO_ROOT, 'content-os/foundation/creator-profiles.json');

function pickImage(rawPost) {
  // The author object can live at different nesting levels.
  const candidates = [];
  const push = (v) => {
    if (!v) return;
    if (typeof v === 'string' && /^https?:\/\//.test(v)) candidates.push(v);
    else if (typeof v === 'object') {
      if (v.url) push(v.url);
      if (v.src) push(v.src);
      if (v.imageUrl) push(v.imageUrl);
      if (v.profilePictureUrl) push(v.profilePictureUrl);
      if (v.pictureUrl) push(v.pictureUrl);
    }
  };
  const author = rawPost.author || {};
  push(author.avatar);
  push(author.profilePictureUrl);
  push(author.profileImageUrl);
  push(author.pictureUrl);
  push(author.picture);
  push(author.image);
  push(author.imageUrl);
  push(author.photoUrl);
  push(author.photo);
  push(author.profilePicture);
  push(rawPost.authorProfileImageUrl);
  push(rawPost.authorProfilePicture);
  push(rawPost.profilePictureUrl);
  push(rawPost.profileImageUrl);
  push(rawPost.userImage);
  return candidates[0] || '';
}

function pickHeadline(rawPost) {
  const author = rawPost.author || {};
  return (
    author.headline ||
    author.title ||
    author.bio ||
    rawPost.authorHeadline ||
    ''
  );
}

async function pullOnePost(profileUrl, token) {
  const url = `https://api.apify.com/v2/acts/${APIFY_ACTOR}/run-sync-get-dataset-items?token=${token}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      profileUrls: [profileUrl],
      maxPosts: 1,
      includeComments: false,
      includeReactions: false,
    }),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Apify failed: ${response.status} ${text.slice(0, 200)}`);
  }
  const data = await response.json();
  return Array.isArray(data) && data.length > 0 ? data[0] : null;
}

async function readCache() {
  try {
    const raw = await fs.readFile(CACHE_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function writeCache(cache) {
  await fs.mkdir(resolve(REPO_ROOT, 'content-os/foundation'), { recursive: true });
  await fs.writeFile(CACHE_PATH, JSON.stringify(cache, null, 2) + '\n');
}

function slugify(name) {
  return (name || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

async function main() {
  const args = parseArgs();
  await loadEnv();

  const token = process.env.APIFY_API_TOKEN;
  if (!token) throw new Error('Missing APIFY_API_TOKEN');

  const all = await loadWatchlist({ kind: 'linkedin' });
  const creators = args.only
    ? all.filter((c) => c.name.toLowerCase() === String(args.only).toLowerCase())
    : all;

  if (creators.length === 0) {
    console.log('No creators matched. Aborting.');
    return;
  }

  const cache = await readCache();

  for (const creator of creators) {
    process.stdout.write(`  ${creator.name.padEnd(24)} `);
    try {
      const post = await pullOnePost(creator.url, token);
      if (!post) {
        console.log('❌ No posts returned');
        continue;
      }
      const imageUrl = pickImage(post);
      const headline = pickHeadline(post);
      if (!imageUrl) {
        // Debug: log the author object keys so we can refine
        const authorKeys = post.author ? Object.keys(post.author).join(',') : 'no-author-object';
        console.log(`⚠️  No image found. author keys: ${authorKeys}`);
      } else {
        console.log('✓ got image');
      }
      cache[slugify(creator.name)] = {
        name: creator.name,
        slug: slugify(creator.name),
        profile_url: creator.url,
        image_url: imageUrl,
        headline,
        updated_at: new Date().toISOString(),
      };
      // Small delay to be nice to Apify
      await new Promise((r) => setTimeout(r, 500));
    } catch (error) {
      console.log(`❌ ${error.message}`);
    }
  }

  await writeCache(cache);
  console.log(`\n📦 Saved ${Object.keys(cache).length} creator profile(s) to ${CACHE_PATH}`);
}

main().catch((error) => {
  console.error(`\n❌ Fatal: ${error.message}\n`);
  process.exitCode = 1;
});
