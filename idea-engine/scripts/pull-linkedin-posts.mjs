#!/usr/bin/env node

import { resolve } from 'node:path';
import {
  RAW_DIR,
  ensureAutomationDirs,
  loadEnv,
  loadWatchlist,
  normalizeWhitespace,
  parseArgs,
  slugify,
  todayString,
  writeJson,
} from './lib/content-automation.mjs';

const APIFY_ACTOR = 'harvestapi~linkedin-profile-posts';

export async function pullLinkedinPosts(options = {}) {
  await ensureAutomationDirs();
  await loadEnv();

  const token = process.env.APIFY_API_TOKEN;
  if (!token) {
    throw new Error('Missing APIFY_API_TOKEN in .env.local or environment.');
  }

  const watchlist = options.profileUrl
    ? [{ creator: options.creator || 'Manual profile', profileUrl: options.profileUrl, maxPosts: Number(options.maxPosts || 50) }]
    : await loadWatchlist();

  const results = [];

  for (const entry of watchlist) {
    const payload = {
      profileUrls: [entry.profileUrl],
      maxPosts: Number(options.maxPosts || entry.maxPosts || 50),
      includeComments: false,
      includeReactions: false,
    };

    const url = `https://api.apify.com/v2/acts/${APIFY_ACTOR}/run-sync-get-dataset-items?token=${token}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Apify request failed for ${entry.creator}: ${response.status} ${normalizeWhitespace(errorText)}`);
    }

    const posts = await response.json();
    const dateStamp = todayString();
    const filePath = resolve(RAW_DIR, `${slugify(entry.creator)}-${dateStamp}.json`);
    await writeJson(filePath, posts);

    results.push({
      creator: entry.creator,
      profileUrl: entry.profileUrl,
      outputPath: filePath,
      postCount: Array.isArray(posts) ? posts.length : 0,
    });
  }

  return results;
}

async function main() {
  const args = parseArgs();
  const results = await pullLinkedinPosts(args);

  for (const result of results) {
    console.log(`${result.creator}: ${result.postCount} posts -> ${result.outputPath}`);
  }
}

const isDirectRun = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;

if (isDirectRun) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}