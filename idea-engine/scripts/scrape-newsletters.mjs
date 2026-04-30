#!/usr/bin/env node

/**
 * scrape-newsletters.mjs — Step 3 of the Content OS scrape pipeline
 *
 * Reads watchlist.json (newsletters), tries to fetch each one's RSS feed
 * (Substack convention: <url>/feed), parses titles + summaries, runs the
 * AI relevance filter, and appends new entries to:
 *   content-os/post-database/winning-posts/newsletters.md
 *
 * Idempotent: safe to run multiple times — dedupes by article link.
 *
 * Newsletters don't have engagement metrics, so:
 * - No "winner threshold" — every recent article is a candidate
 * - The AI relevance filter does all the quality work
 * - We keep the latest N articles per newsletter (default 10)
 *
 * Usage:
 *   node scrape-newsletters.mjs                  # default: 10 articles per newsletter
 *   node scrape-newsletters.mjs --limit 5        # 5 articles per newsletter
 *   node scrape-newsletters.mjs --skip-filter    # debug: skip the AI filter
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
import { upsertPosts } from './lib/supabase-client.mjs';
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

/**
 * Build the list of RSS URLs to try for a given newsletter URL.
 * Substack uses /feed, others may differ. We try common patterns.
 */
function feedCandidates(url) {
  const clean = url.replace(/\/$/, '');
  return [
    `${clean}/feed`,
    `${clean}/rss`,
    `${clean}/feed.xml`,
    `${clean}/rss.xml`,
    `${clean}/atom.xml`,
    `${clean}/index.xml`,
  ];
}

async function fetchFeed(url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, accept: 'application/rss+xml, application/xml, text/xml' },
    redirect: 'follow',
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.text();
}

/**
 * Minimal RSS/Atom parser. Extracts: title, link, pubDate, description.
 * No external deps — uses regex against well-formed feed XML.
 * Good enough for Substack and most newsletter platforms.
 */
function parseFeed(xml) {
  const items = [];

  // Try RSS <item> first
  const rssMatches = xml.match(/<item[\s\S]*?<\/item>/g) || [];
  for (const item of rssMatches) {
    const title = (item.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/) || [])[1] || '';
    const link = (item.match(/<link>([\s\S]*?)<\/link>/) || [])[1] || '';
    const pubDate = (item.match(/<pubDate>([\s\S]*?)<\/pubDate>/) || [])[1] || '';
    const desc =
      (item.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/) || [])[1] || '';
    if (title.trim() && link.trim()) {
      items.push({
        title: stripHtml(title).trim(),
        link: link.trim(),
        date: pubDate ? new Date(pubDate).toISOString().slice(0, 10) : '',
        description: trimSmart(stripHtml(desc), 280),
      });
    }
  }

  if (items.length > 0) return items;

  // Fall back to Atom <entry>
  const atomMatches = xml.match(/<entry[\s\S]*?<\/entry>/g) || [];
  for (const entry of atomMatches) {
    const title = (entry.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/) || [])[1] || '';
    const link = (entry.match(/<link[^>]*href="([^"]+)"/) || [])[1] || '';
    const updated = (entry.match(/<updated>([\s\S]*?)<\/updated>/) || [])[1] || '';
    const summary =
      (entry.match(/<summary[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/summary>/) || [])[1] || '';
    if (title.trim() && link.trim()) {
      items.push({
        title: stripHtml(title).trim(),
        link: link.trim(),
        date: updated ? updated.slice(0, 10) : '',
        description: trimSmart(stripHtml(summary), 280),
      });
    }
  }

  return items;
}

function stripHtml(s) {
  return String(s)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ');
}

function buildRow(item, newsletter) {
  const normalized = {
    content: `${item.title}\n${item.description || ''}`,
    firstLine: trimSmart(item.title, 160),
  };
  const postType = classifyPost(normalized);

  return {
    source: 'newsletter',
    type: postType,
    title: trimSmart(item.title, 500),
    creator: newsletter,
    date: item.date || todayString(),
    likes: 0,
    comments: 0,
    reposts: 0,
    topic: trimSmart(item.description || 'Newsletter article', 1000),
    why_it_worked: 'Newsletter signal — published recently and survived the relevance filter.',
    link: item.link,
  };
}

async function tryFetchFeed(url) {
  for (const candidate of feedCandidates(url)) {
    try {
      const xml = await fetchFeed(candidate);
      // Sanity check — must look like a feed
      if (xml.includes('<item') || xml.includes('<entry')) {
        return { feedUrl: candidate, xml };
      }
    } catch {
      // try next candidate
    }
  }
  return null;
}

async function main() {
  const args = parseArgs();
  await ensureAutomationDirs();
  await loadEnv();

  const newsletters = await loadWatchlist({ kind: 'newsletter' });
  if (newsletters.length === 0) {
    console.log('No enabled newsletters in watchlist.json. Nothing to do.');
    return;
  }

  const limit = Number(args.limit || 10);
  const skipFilter = args.skipFilter === true || args.skipFilter === 'true';

  console.log(`\n📡 Scraping ${newsletters.length} newsletters (latest ${limit} articles each)\n`);

  const dateStamp = todayString();
  let totalFetched = 0;
  let totalCandidates = 0;

  const candidates = [];

  for (const nl of newsletters) {
    process.stdout.write(`  ${nl.name.padEnd(28)} `);
    try {
      const result = await tryFetchFeed(nl.url);
      if (!result) {
        console.log(`⚠️  no feed found`);
        continue;
      }

      const items = parseFeed(result.xml).slice(0, limit);
      totalFetched += items.length;

      const rawPath = resolve(RAW_DIR, `newsletter-${slugify(nl.name)}-${dateStamp}.json`);
      await writeJson(rawPath, items);

      let candidatesHere = 0;
      for (const item of items) {
        candidates.push({
          newsletterName: nl.name,
          item,
          row: buildRow(item, nl.name),
        });
        candidatesHere += 1;
      }

      totalCandidates += candidatesHere;
      console.log(`fetched ${items.length.toString().padStart(2)}, ${candidatesHere} candidates`);

      await new Promise((r) => setTimeout(r, 1000));
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
          title: c.item.title,
          source: 'newsletter',
          creator: c.newsletterName,
          topic: c.item.description,
        })),
      );
      kept = candidates.filter((_, i) => verdicts[i]?.relevant);
      const dropped = candidates.length - kept.length;
      console.log(`  ✅ ${kept.length} relevant · ❌ ${dropped} dropped`);
    } catch (error) {
      console.log(`  ⚠️  Filter failed: ${error.message} — keeping all`);
    }
  }

  // Phase 3: Write to Supabase
  if (kept.length > 0) {
    const rows = kept.map((c) => c.row);
    const written = await upsertPosts(rows);
    console.log(`  📦 Upserted ${written} rows to Supabase`);
  }

  console.log(
    `\n✅ Done. ${totalFetched} articles fetched · ${totalCandidates} candidates · ${kept.length} added to DB\n`,
  );
}

const isDirectRun = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;

if (isDirectRun) {
  main().catch((error) => {
    console.error(`\n❌ Fatal: ${error.message}\n`);
    process.exitCode = 1;
  });
}
