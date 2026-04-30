#!/usr/bin/env node

/**
 * clean-database.mjs — One-time cleanup of existing winning posts
 *
 * Reads existing winning-posts/*.md files, runs every post through the
 * relevance filter, and moves irrelevant ones to an archive file you can review.
 *
 * Usage:
 *   node clean-database.mjs --source reddit         # clean reddit only
 *   node clean-database.mjs --source linkedin       # clean linkedin only
 *   node clean-database.mjs                         # clean all
 *   node clean-database.mjs --dry-run               # show what would be dropped, no writes
 */

import { resolve } from 'node:path';
import {
  WINNING_POSTS_DIR,
  loadEnv,
  parseArgs,
  readText,
  writeText,
  fileExists,
} from './lib/content-automation.mjs';
import { filterByRelevance } from './lib/relevance-filter.mjs';

const REDDIT_FILE = resolve(WINNING_POSTS_DIR, 'reddit.md');
const LINKEDIN_FILES = [
  'hot-takes.md',
  'stories.md',
  'case-studies.md',
  'educational.md',
  'insightful.md',
  'transparency.md',
  'announcements.md',
  'engagement.md',
].map((f) => resolve(WINNING_POSTS_DIR, f));

/**
 * Parse a winning-posts markdown file into an array of {block, title, creator, topic}.
 * Each block is the full text from "### " to the next "### " or EOF.
 */
function parseFile(content) {
  const blocks = [];
  // Split by lines starting with "### "
  const segments = content.split(/^### /m);
  const header = segments[0]; // everything before the first ### (file header)

  for (let i = 1; i < segments.length; i += 1) {
    const segment = segments[i];
    const lines = segment.split('\n');
    const title = lines[0].trim();

    let creator = '';
    let topic = '';
    for (const line of lines) {
      const m = line.match(/^- \*\*(.+?):\*\*\s*(.+)$/);
      if (!m) continue;
      const key = m[1].toLowerCase();
      const value = m[2].trim();
      if (key === 'creator') creator = value;
      else if (key === 'topic') topic = value;
    }

    blocks.push({
      title,
      creator,
      topic,
      raw: '### ' + segment,
    });
  }

  return { header, blocks };
}

async function cleanFile(filePath, source) {
  if (!(await fileExists(filePath))) {
    return null;
  }

  const content = await readText(filePath);
  const { header, blocks } = parseFile(content);

  if (blocks.length === 0) {
    return { kept: 0, dropped: 0, total: 0 };
  }

  console.log(`\n📋 ${filePath.split('/').pop()} — ${blocks.length} posts to filter`);

  const verdicts = await filterByRelevance(
    blocks.map((b) => ({
      title: b.title,
      source,
      creator: b.creator,
      topic: b.topic,
    })),
  );

  const kept = [];
  const dropped = [];
  blocks.forEach((b, i) => {
    const v = verdicts[i] || { relevant: true, reason: 'no verdict' };
    if (v.relevant) {
      kept.push(b);
    } else {
      dropped.push({ ...b, reason: v.reason });
    }
  });

  return { kept, dropped, header };
}

async function main() {
  const args = parseArgs();
  await loadEnv();

  const sourceFilter = args.source; // 'reddit', 'linkedin', or undefined for all
  const dryRun = args.dryRun === true || args.dryRun === 'true';

  console.log(
    `\n🧹 Cleaning database${sourceFilter ? ` (${sourceFilter} only)` : ' (all sources)'}${dryRun ? ' [DRY RUN]' : ''}\n`,
  );

  const archiveBlocks = [];
  let totalKept = 0;
  let totalDropped = 0;

  // Reddit
  if (!sourceFilter || sourceFilter === 'reddit') {
    const result = await cleanFile(REDDIT_FILE, 'reddit');
    if (result) {
      console.log(`  ✅ Kept ${result.kept.length}, ❌ Dropped ${result.dropped.length}`);
      totalKept += result.kept.length;
      totalDropped += result.dropped.length;

      if (!dryRun && result.dropped.length > 0) {
        // Rebuild reddit.md with only the kept blocks
        const newContent =
          result.header + result.kept.map((b) => b.raw).join('\n');
        await writeText(REDDIT_FILE, newContent);
      }

      archiveBlocks.push(...result.dropped.map((b) => ({ ...b, sourceFile: 'reddit.md' })));
    }
  }

  // LinkedIn (8 type files)
  if (!sourceFilter || sourceFilter === 'linkedin') {
    for (const filePath of LINKEDIN_FILES) {
      const result = await cleanFile(filePath, 'linkedin');
      if (!result) continue;
      console.log(`  ✅ Kept ${result.kept.length}, ❌ Dropped ${result.dropped.length}`);
      totalKept += result.kept.length;
      totalDropped += result.dropped.length;

      if (!dryRun && result.dropped.length > 0) {
        const newContent =
          result.header + result.kept.map((b) => b.raw).join('\n');
        await writeText(filePath, newContent);
      }

      const fileName = filePath.split('/').pop();
      archiveBlocks.push(...result.dropped.map((b) => ({ ...b, sourceFile: fileName })));
    }
  }

  // Write archive
  if (!dryRun && archiveBlocks.length > 0) {
    const archivePath = resolve(WINNING_POSTS_DIR, 'archive-irrelevant.md');
    const existingArchive = (await fileExists(archivePath))
      ? await readText(archivePath)
      : '# Archive — Irrelevant Posts\n\nPosts dropped by the AI relevance filter. Review and delete if you agree, or restore if Claude was wrong.\n\n---\n';

    const newSection = [
      '',
      `## Archived ${new Date().toISOString().slice(0, 10)}`,
      '',
      ...archiveBlocks.map(
        (b) =>
          `### [from ${b.sourceFile}] ${b.title}\n- **Filter reason:** ${b.reason}\n- **Creator:** ${b.creator}\n- **Topic:** ${b.topic}\n`,
      ),
    ].join('\n');

    await writeText(archivePath, existingArchive + newSection);
    console.log(`\n📦 Archived ${archiveBlocks.length} dropped posts → archive-irrelevant.md`);
  }

  console.log(
    `\n✅ Done. Total kept: ${totalKept} · Total dropped: ${totalDropped}${dryRun ? ' (dry run, no files written)' : ''}\n`,
  );
}

const isDirectRun = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;

if (isDirectRun) {
  main().catch((error) => {
    console.error(`\n❌ Fatal: ${error.message}\n`);
    process.exitCode = 1;
  });
}
