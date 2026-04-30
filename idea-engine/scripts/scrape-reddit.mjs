#!/usr/bin/env node

/**
 * scrape-reddit.mjs — Step 2 of the Content OS scrape pipeline
 *
 * Reads watchlist.json (Reddit subreddits only), pulls top posts via the
 * free Reddit JSON API (no auth needed), filters for winners (≥50 comments
 * OR ≥200 upvotes), and appends them to:
 *   content-os/post-database/winning-posts/reddit.md
 *
 * Idempotent: safe to run multiple times — dedupes by Reddit permalink.
 *
 * Reddit threshold: ≥50 comments OR ≥200 upvotes.
 * Comments are weighted higher because discussion = real signal.
 *
 * Usage:
 *   node scrape-reddit.mjs                        # default: top of last week
 *   node scrape-reddit.mjs --time month           # top of last month
 *   node scrape-reddit.mjs --limit 50             # pull 50 posts per subreddit
 */

import { resolve } from 'node:path';
import {
  RAW_DIR,
  classifyPost,
  ensureAutomationDirs,
  loadEnv,
  loadWatchlist,
  parseArgs,
  slugify,
  todayString,
  trimSmart,
  writeJson,
} from './lib/content-automation.mjs';
import { filterByRelevance } from './lib/relevance-filter.mjs';
import { upsertPosts, linkExists } from './lib/supabase-client.mjs';

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';
const WINNER_COMMENTS = 50;
const WINNER_UPVOTES = 200;

async function fetchSubreddit(sub, time, limit) {
  // Strip the leading "r/" if present
  const name = sub.replace(/^r\//i, '');
  const url = `https://www.reddit.com/r/${name}/top.json?t=${time}&limit=${limit}`;

  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  return json?.data?.children?.map((c) => c.data) || [];
}

function isWinner(post, threshold) {
  const comments = threshold?.comments ?? WINNER_COMMENTS;
  const upvotes = threshold?.upvotes ?? WINNER_UPVOTES;
  return post.num_comments >= comments || post.score >= upvotes;
}

function inferTopic(post) {
  const flair = post.link_flair_text;
  if (flair) return flair;
  // Fall back to first 60 chars of selftext or title
  const text = (post.selftext || '').trim();
  if (text) return trimSmart(text, 80);
  return 'Reddit discussion';
}

function inferWhyItWorked(post) {
  const ratio =
    post.num_comments > 0 && post.score > 0
      ? (post.num_comments / post.score).toFixed(2)
      : '0';
  if (post.num_comments >= 100) {
    return `Very high comment count (${post.num_comments}) means this struck a nerve — community had strong opinions or shared experiences.`;
  }
  if (post.num_comments >= WINNER_COMMENTS) {
    return `Strong discussion (${post.num_comments} comments, ${post.score} upvotes, ratio ${ratio}). The topic is real and unresolved.`;
  }
  return `High upvotes (${post.score}) signal mass agreement. Less debate, but the headline alone resonated.`;
}

function buildRow(post, subreddit) {
  const title = trimSmart(post.title, 500);
  const date = new Date(post.created_utc * 1000).toISOString().slice(0, 10);
  const link = `https://www.reddit.com${post.permalink}`;
  const author = post.author ? `u/${post.author}` : 'unknown';

  const normalized = {
    content: `${post.title}\n${post.selftext || ''}`,
    firstLine: trimSmart(post.title, 160),
  };
  const postType = classifyPost(normalized);

  return {
    source: 'reddit',
    type: postType,
    title,
    creator: `${subreddit} (${author})`,
    date,
    likes: post.score || 0,
    comments: post.num_comments || 0,
    reposts: 0,
    topic: inferTopic(post),
    why_it_worked: inferWhyItWorked(post),
    link,
  };
}

async function main() {
  const args = parseArgs();
  await ensureAutomationDirs();
  await loadEnv();

  const skipFilter = args.skipFilter === true || args.skipFilter === 'true';

  const subs = await loadWatchlist({ kind: 'reddit' });
  if (subs.length === 0) {
    console.log('No enabled subreddits in watchlist.json. Nothing to do.');
    return;
  }

  const time = String(args.time || 'week');
  const limit = Number(args.limit || 25);

  console.log(`\n📡 Scraping ${subs.length} subreddits (top of ${time}, ${limit} posts each)\n`);

  const dateStamp = todayString();
  let totalPulled = 0;
  let totalWinners = 0;
  let totalCandidates = 0;
  let totalInserted = 0;

  // Phase 1: Pull and dedupe — collect candidates per subreddit
  const candidates = [];

  for (const sub of subs) {
    process.stdout.write(`  ${sub.name.padEnd(22)} `);
    try {
      const posts = await fetchSubreddit(sub.name, time, limit);
      totalPulled += posts.length;

      // Save raw for audit
      const rawPath = resolve(RAW_DIR, `reddit-${slugify(sub.name)}-${dateStamp}.json`);
      await writeJson(rawPath, posts);

      const winners = posts.filter((p) => isWinner(p, sub.winnerThreshold));
      totalWinners += winners.length;

      let candidatesHere = 0;
      for (const post of winners) {
        const link = `https://www.reddit.com${post.permalink}`;
        candidates.push({ subName: sub.name, post, link, row: buildRow(post, sub.name) });
        candidatesHere += 1;
      }

      totalCandidates += candidatesHere;
      console.log(
        `pulled ${posts.length.toString().padStart(3)}, ${winners.length} winners, ${candidatesHere} candidates`,
      );

      await new Promise((r) => setTimeout(r, 1500));
    } catch (error) {
      console.log(`❌ ${error.message}`);
    }
  }

  // Phase 2: AI relevance filter
  let kept = candidates;

  if (!skipFilter && candidates.length > 0) {
    console.log(`\n🧠 Running AI relevance filter on ${candidates.length} candidates...`);
    try {
      const verdicts = await filterByRelevance(
        candidates.map((c) => ({
          title: c.post.title,
          source: 'reddit',
          creator: c.subName,
          topic: c.post.link_flair_text || (c.post.selftext || '').slice(0, 100),
        })),
      );
      kept = candidates.filter((_, i) => verdicts[i]?.relevant);
      const dropped = candidates.length - kept.length;
      console.log(`  ✅ ${kept.length} relevant · ❌ ${dropped} dropped`);
    } catch (error) {
      console.log(`  ⚠️  Filter failed: ${error.message} — keeping all candidates`);
    }
  }

  // Phase 3: Write to Supabase
  if (kept.length > 0) {
    const rows = kept.map((c) => c.row);
    totalInserted = await upsertPosts(rows);
    console.log(`  📦 Upserted ${totalInserted} rows to Supabase`);
  }

  console.log(
    `\n✅ Done. ${totalPulled} pulled · ${totalWinners} winners · ${totalCandidates} candidates · ${kept.length} added to DB\n`,
  );
}

const isDirectRun = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;

if (isDirectRun) {
  main().catch((error) => {
    console.error(`\n❌ Fatal: ${error.message}\n`);
    process.exitCode = 1;
  });
}
