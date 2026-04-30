#!/usr/bin/env node

/**
 * scrape-my-comments.mjs — pull posts Salim commented on, qualify as lead magnets, save
 *
 * Uses scraping_solutions~linkedin-profile-comments-reactions-scraper-no-cookies
 * which returns full post text + metadata for each comment. No cookies needed.
 *
 * Flow:
 *   1. Pull recent comments via Apify
 *   2. Dedupe against existing lead-magnet rows in Supabase
 *   3. Qualify each post as lead magnet (2+ keyword matches)
 *   4. Upsert qualifying posts into content_posts with source='lead-magnet'
 *
 * Usage:
 *   node content-os/idea-engine/scripts/scrape-my-comments.mjs
 *   node content-os/idea-engine/scripts/scrape-my-comments.mjs --max-items 100
 *   node content-os/idea-engine/scripts/scrape-my-comments.mjs --skip-filter   # save ALL commented posts
 */

import {
  loadEnv,
  parseArgs,
  trimSmart,
} from './lib/content-automation.mjs';

const COMMENTS_ACTOR = 'scraping_solutions~linkedin-profile-comments-reactions-scraper-no-cookies';
const MY_USERNAME = 'ghostwritingforceos';

const LEAD_MAGNET_KEYWORDS = [
  'comment', 'dm me', 'send me', 'download', 'free', 'vault', 'template',
  'playbook', 'swipe file', 'cheat sheet', 'checklist', 'guide', 'resource',
  'toolkit', 'framework', 'doc', 'sheet', 'notion', 'pdf', 'deck',
  'access', 'link in', 'grab', 'steal', 'copy', 'blueprint', 'system',
  'masterclass', 'workshop', 'webinar', 'course', 'bonus', 'i\'ll send',
  'drop a', 'type', 'get it', 'want it',
];

function isLeadMagnet(postText) {
  if (!postText) return false;
  const lower = postText.toLowerCase();
  let matches = 0;
  for (const kw of LEAD_MAGNET_KEYWORDS) {
    if (lower.includes(kw)) matches += 1;
  }
  return matches >= 2;
}

function cleanPostUrl(raw) {
  if (!raw) return '';
  // Strip UTM params and tracking
  try {
    const u = new URL(raw);
    return `${u.origin}${u.pathname}`;
  } catch {
    return raw.split('?')[0];
  }
}

async function fetchMyComments(token, maxItems) {
  const url = `https://api.apify.com/v2/acts/${COMMENTS_ACTOR}/run-sync-get-dataset-items?token=${token}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      usernames: [MY_USERNAME],
      maxItems,
    }),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Apify failed: ${response.status} ${text.slice(0, 300)}`);
  }
  return response.json();
}

async function scrapeOgImage(postUrl) {
  try {
    const response = await fetch(postUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        Accept: 'text/html',
      },
      redirect: 'follow',
    });
    if (!response.ok) return '';
    const html = await response.text();
    const patterns = [
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
    ];
    for (const p of patterns) {
      const m = html.match(p);
      if (m && /^https?:\/\//.test(m[1])) {
        return m[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
      }
    }
  } catch { /* ignore */ }
  return '';
}

async function fetchExistingLinks() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_JWT;
  const endpoint = `${url}/rest/v1/content_posts?select=link&source=eq.lead-magnet&limit=5000`;
  const response = await fetch(endpoint, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!response.ok) throw new Error(`Supabase read failed: ${response.status}`);
  const data = await response.json();
  return new Set((data || []).map((r) => r.link).filter(Boolean));
}

async function upsertRow(row) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_JWT;
  const response = await fetch(`${url}/rest/v1/content_posts?on_conflict=link`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal,resolution=merge-duplicates',
    },
    body: JSON.stringify(row),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase insert failed: ${response.status} ${text.slice(0, 200)}`);
  }
}

async function main() {
  const args = parseArgs();
  await loadEnv();

  const token = process.env.APIFY_API_TOKEN;
  if (!token) throw new Error('Missing APIFY_API_TOKEN');

  const maxItems = Number(args.maxItems || 100);
  const skipFilter = args.skipFilter === true || args.skipFilter === 'true';

  console.log(`\n📡 Pulling last ${maxItems} activity items from @${MY_USERNAME}...`);
  const rawItems = await fetchMyComments(token, maxItems);

  // Filter to comments only (skip reactions/likes)
  const comments = rawItems.filter((r) => r.sourceType === 'comment' && r.postUrl);
  console.log(`  ✓ Got ${rawItems.length} items, ${comments.length} are comments with post URLs\n`);

  if (comments.length === 0) {
    console.log('No comments found.');
    return;
  }

  // Dedupe by post URL
  const seenUrls = new Map();
  for (const c of comments) {
    const cleanUrl = cleanPostUrl(c.postUrl);
    if (!seenUrls.has(cleanUrl)) seenUrls.set(cleanUrl, c);
  }
  console.log(`  📌 ${seenUrls.size} unique posts from ${comments.length} comments`);

  const existingLinks = await fetchExistingLinks();
  console.log(`  📚 ${existingLinks.size} already in lead-magnet DB\n`);

  let saved = 0;
  let skippedDupe = 0;
  let skippedFilter = 0;

  for (const [cleanUrl, c] of seenUrls) {
    const postText = c.postText || '';
    const authorName = c.postAuthorName || '';
    const firstLine = postText.split('\n').map((s) => s.trim()).find((s) => s.length > 0) || '';

    // Skip if already in DB
    if (existingLinks.has(cleanUrl)) {
      skippedDupe += 1;
      continue;
    }

    // Qualify as lead magnet
    if (!skipFilter && !isLeadMagnet(postText)) {
      skippedFilter += 1;
      process.stdout.write(`  ⏭️  ${authorName.padEnd(24)} not a lead magnet\n`);
      continue;
    }

    // Fetch OG image from the post page
    const imageUrl = await scrapeOgImage(cleanUrl);

    const row = {
      source: 'lead-magnet',
      type: 'lead-magnet',
      title: trimSmart(firstLine, 500),
      creator: authorName,
      date: (c.postDate || c.eventDate || '').slice(0, 10),
      likes: Number(c.postTotalReactions || 0),
      comments: Number(c.postCommentsCount || 0),
      reposts: Number(c.postRepostsCount || 0),
      topic: `Commented: "${(c.content || '').trim()}"`,
      why_it_worked: '',
      link: cleanUrl,
      content: postText,
      image_url: imageUrl,
    };

    try {
      await upsertRow(row);
      saved += 1;
      process.stdout.write(`  ✓  ${authorName.padEnd(24)} "${firstLine.slice(0, 50)}"\n`);
    } catch (error) {
      process.stdout.write(`  ❌ ${authorName.padEnd(24)} ${error.message}\n`);
    }
  }

  console.log(`\n✅ Done.`);
  console.log(`  Comments:           ${comments.length}`);
  console.log(`  Unique posts:       ${seenUrls.size}`);
  console.log(`  Already in DB:      ${skippedDupe}`);
  console.log(`  Not a lead magnet:  ${skippedFilter}`);
  console.log(`  Saved:              ${saved}`);
}

main().catch((error) => {
  console.error(`\n❌ Fatal: ${error.message}\n`);
  process.exitCode = 1;
});
