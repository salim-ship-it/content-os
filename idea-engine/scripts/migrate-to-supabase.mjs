#!/usr/bin/env node

/**
 * migrate-to-supabase.mjs — One-time migration of winning-posts/*.md → Supabase
 *
 * Reads all winning posts markdown files, parses them using the same logic
 * as the app's parser, and inserts them into the content_posts table.
 *
 * Uses upsert on the `link` field to avoid duplicates (safe to re-run).
 *
 * Usage:
 *   node migrate-to-supabase.mjs
 *   node migrate-to-supabase.mjs --dry-run   # just count, don't insert
 */

import { promises as fs } from 'node:fs';
import { resolve } from 'node:path';
import {
  WINNING_POSTS_DIR,
  ensureAutomationDirs,
  loadEnv,
  parseArgs,
  trimSmart,
} from './lib/content-automation.mjs';

const SOURCE_FILES = [
  { file: 'hot-takes.md', source: 'linkedin', type: 'hot take' },
  { file: 'stories.md', source: 'linkedin', type: 'story' },
  { file: 'case-studies.md', source: 'linkedin', type: 'case study' },
  { file: 'educational.md', source: 'linkedin', type: 'educational' },
  { file: 'insightful.md', source: 'linkedin', type: 'insightful' },
  { file: 'transparency.md', source: 'linkedin', type: 'transparency' },
  { file: 'announcements.md', source: 'linkedin', type: 'announcement' },
  { file: 'engagement.md', source: 'linkedin', type: 'engagement' },
  { file: 'reddit.md', source: 'reddit', type: 'reddit' },
  { file: 'newsletters.md', source: 'newsletter', type: 'newsletter' },
  { file: 'youtube.md', source: 'youtube', type: 'youtube' },
];

function parseFile(filePath, defaultSource, defaultType, content) {
  const posts = [];
  const blocks = content.split(/^### /m).slice(1);

  for (const block of blocks) {
    const lines = block.split('\n');
    const title = lines[0].trim();
    if (!title) continue;

    const post = {
      source: defaultSource,
      type: defaultType,
      title: trimSmart(title, 500),
      creator: '',
      date: null,
      likes: 0,
      comments: 0,
      reposts: 0,
      topic: '',
      why_it_worked: '',
      link: '',
    };

    for (const line of lines) {
      const m = line.match(/^- \*\*(.+?):\*\*\s*(.+)$/);
      if (!m) continue;
      const key = m[1].toLowerCase();
      const value = m[2].trim();

      if (key === 'creator') post.creator = value;
      else if (key === 'date') post.date = value || null;
      else if (key === 'type') post.type = value;
      else if (key === 'topic') post.topic = trimSmart(value, 1000);
      else if (key === 'why it worked') post.why_it_worked = trimSmart(value, 1000);
      else if (key === 'link') post.link = value;
      else if (value.includes('|')) {
        const numbers = value.match(/\d+/g);
        if (numbers && numbers.length >= 3) {
          post.likes = parseInt(numbers[0]) || 0;
          post.comments = parseInt(numbers[1]) || 0;
          post.reposts = parseInt(numbers[2]) || 0;
        }
      }
    }

    // Only add if we have a link (dedup key) or at least a title
    if (post.link || post.title) {
      posts.push(post);
    }
  }

  return posts;
}

async function insertBatch(posts, supabaseUrl, serviceKey) {
  // Supabase upsert on link: if link exists, update all fields. Otherwise insert.
  const response = await fetch(
    `${supabaseUrl}/rest/v1/content_posts?on_conflict=link`,
    {
      method: 'POST',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal,resolution=merge-duplicates',
      },
      body: JSON.stringify(posts),
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase insert failed: ${response.status} ${text.slice(0, 300)}`);
  }
}

async function main() {
  const args = parseArgs();
  await loadEnv();

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_JWT;

  if (!supabaseUrl || !serviceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_JWT in .env.local');
  }

  const dryRun = args.dryRun === true || args.dryRun === 'true';

  console.log(`\n📦 Migrating winning posts to Supabase${dryRun ? ' [DRY RUN]' : ''}\n`);

  const allPosts = [];

  for (const { file, source, type } of SOURCE_FILES) {
    const filePath = resolve(WINNING_POSTS_DIR, file);
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const posts = parseFile(filePath, source, type, content);
      allPosts.push(...posts);
      console.log(`  ${file.padEnd(22)} ${posts.length.toString().padStart(4)} posts`);
    } catch {
      console.log(`  ${file.padEnd(22)}    — (file not found)`);
    }
  }

  // Remove posts with no link (can't dedup without it)
  const withLinks = allPosts.filter((p) => p.link);
  const noLinks = allPosts.length - withLinks.length;
  if (noLinks > 0) {
    console.log(`\n  ⚠️  Skipping ${noLinks} posts with no link (can't dedup)`);
  }

  // Dedupe by link — keep the first occurrence (file order matters)
  const seen = new Set();
  const deduped = [];
  for (const post of withLinks) {
    if (seen.has(post.link)) continue;
    seen.add(post.link);
    deduped.push(post);
  }
  const dupeCount = withLinks.length - deduped.length;
  if (dupeCount > 0) {
    console.log(`  ⚠️  Removed ${dupeCount} duplicate links across files`);
  }

  console.log(`\n  Total: ${deduped.length} unique posts to migrate\n`);

  if (dryRun) {
    console.log('  [DRY RUN] No data written.\n');
    return;
  }

  // Insert in batches of 50
  const BATCH = 50;
  let inserted = 0;
  for (let i = 0; i < deduped.length; i += BATCH) {
    const batch = deduped.slice(i, i + BATCH);
    process.stdout.write(`  Inserting ${i + 1}-${Math.min(i + BATCH, deduped.length)}...`);
    await insertBatch(batch, supabaseUrl, serviceKey);
    inserted += batch.length;
    console.log(` ✅`);
  }

  console.log(`\n✅ Done. ${inserted} posts migrated to Supabase.\n`);
}

const isDirectRun = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;

if (isDirectRun) {
  main().catch((error) => {
    console.error(`\n❌ Fatal: ${error.message}\n`);
    process.exitCode = 1;
  });
}
