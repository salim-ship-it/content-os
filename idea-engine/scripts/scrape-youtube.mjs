#!/usr/bin/env node

/**
 * scrape-youtube.mjs — Step 4 of the Content OS scrape pipeline
 *
 * Reads watchlist.json (YouTube channels), pulls their latest N uploads via
 * the YouTube Data API v3, runs through the AI relevance filter, and appends
 * to:  content-os/post-database/winning-posts/youtube.md
 *
 * Idempotent: safe to run multiple times — dedupes by video URL.
 *
 * Option C strategy: metadata only (title, description, view/like/comment
 * counts, published date). NO transcript extraction in the daily run.
 * Transcript + framework extraction happens on-demand via the Database tab.
 *
 * Cost per run: ~$0 (YouTube API free tier covers this easily) + tiny Claude
 * Haiku cost for the relevance filter (~$0.05 per run).
 *
 * Quota math:
 *   - 1 channel lookup (forHandle) = 1 unit
 *   - 1 playlistItems list = 1 unit
 *   - 1 videos.list batch (up to 50 ids) = 1 unit
 *   - 4 channels × 3 calls each = ~12 units. Free tier = 10,000/day.
 *
 * Usage:
 *   node scrape-youtube.mjs              # default
 *   node scrape-youtube.mjs --limit 5    # 5 videos per channel
 *   node scrape-youtube.mjs --skip-filter
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
const API_BASE = 'https://www.googleapis.com/youtube/v3';

function isoDateOnly(iso) {
  return (iso || '').slice(0, 10);
}

function parseHandleFromUrl(url) {
  // Accepts https://www.youtube.com/@SomeChannel — return "@SomeChannel"
  const m = (url || '').match(/@([A-Za-z0-9_.-]+)/);
  return m ? `@${m[1]}` : null;
}

async function ytFetch(path, params, apiKey) {
  const qs = new URLSearchParams({ ...params, key: apiKey }).toString();
  const url = `${API_BASE}/${path}?${qs}`;
  const response = await fetch(url);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`YouTube API ${response.status}: ${text.slice(0, 200)}`);
  }
  return response.json();
}

async function resolveChannel(handle, apiKey) {
  // Use forHandle to get channel ID + uploads playlist
  const data = await ytFetch(
    'channels',
    {
      part: 'id,snippet,contentDetails',
      forHandle: handle.replace(/^@/, ''),
    },
    apiKey,
  );
  const item = data.items?.[0];
  if (!item) {
    throw new Error(`Channel not found for handle ${handle}`);
  }
  return {
    channelId: item.id,
    title: item.snippet?.title,
    uploadsPlaylistId: item.contentDetails?.relatedPlaylists?.uploads,
  };
}

async function listUploads(playlistId, limit, apiKey) {
  const data = await ytFetch(
    'playlistItems',
    {
      part: 'snippet,contentDetails',
      playlistId,
      maxResults: String(Math.min(limit, 50)),
    },
    apiKey,
  );
  return (data.items || []).map((it) => ({
    videoId: it.contentDetails?.videoId,
    title: it.snippet?.title,
    description: it.snippet?.description,
    publishedAt: it.contentDetails?.videoPublishedAt || it.snippet?.publishedAt,
    thumbnail: it.snippet?.thumbnails?.medium?.url || it.snippet?.thumbnails?.default?.url,
  }));
}

async function fetchVideoStats(videoIds, apiKey) {
  if (videoIds.length === 0) return [];
  const data = await ytFetch(
    'videos',
    {
      part: 'statistics,contentDetails',
      id: videoIds.join(','),
    },
    apiKey,
  );
  // Index by video id
  const map = new Map();
  for (const item of data.items || []) {
    map.set(item.id, {
      views: Number(item.statistics?.viewCount || 0),
      likes: Number(item.statistics?.likeCount || 0),
      comments: Number(item.statistics?.commentCount || 0),
      duration: item.contentDetails?.duration || '',
    });
  }
  return map;
}

function buildRow(video, channelName) {
  const title = trimSmart(video.title, 500);
  const date = isoDateOnly(video.publishedAt);
  const link = `https://www.youtube.com/watch?v=${video.videoId}`;
  const desc = trimSmart((video.description || '').replace(/\n+/g, ' '), 500);

  const normalized = {
    content: `${video.title}\n${video.description || ''}`,
    firstLine: trimSmart(video.title, 160),
  };
  const postType = classifyPost(normalized);

  return {
    source: 'youtube',
    type: postType,
    title,
    creator: channelName,
    date,
    likes: video.likes || 0,
    comments: video.comments || 0,
    reposts: video.views || 0,
    topic: desc || 'YouTube video',
    why_it_worked: `${(video.views || 0).toLocaleString()} views, ${(video.likes || 0).toLocaleString()} likes.`,
    link,
  };
}

async function main() {
  const args = parseArgs();
  await ensureAutomationDirs();
  await loadEnv();

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error('YOUTUBE_API_KEY not set in .env.local');
  }

  const channels = await loadWatchlist({ kind: 'youtube' });
  if (channels.length === 0) {
    console.log('No enabled YouTube channels in watchlist.json. Nothing to do.');
    return;
  }

  const limit = Number(args.limit || 10);
  const skipFilter = args.skipFilter === true || args.skipFilter === 'true';

  console.log(`\n📡 Scraping ${channels.length} YouTube channels (latest ${limit} videos each)\n`);

  const dateStamp = todayString();

  let totalFetched = 0;
  let totalCandidates = 0;

  // Phase 1: pull videos for all channels
  const candidates = [];

  for (const channel of channels) {
    process.stdout.write(`  ${channel.name.padEnd(22)} `);
    try {
      const handle = channel.handle || parseHandleFromUrl(channel.url);
      if (!handle) {
        console.log(`❌ no handle in url`);
        continue;
      }

      const resolved = await resolveChannel(handle, apiKey);
      if (!resolved.uploadsPlaylistId) {
        console.log(`❌ no uploads playlist`);
        continue;
      }

      const uploads = await listUploads(resolved.uploadsPlaylistId, limit, apiKey);
      const videoIds = uploads.map((u) => u.videoId).filter(Boolean);
      const statsMap = await fetchVideoStats(videoIds, apiKey);

      // Merge stats into uploads
      const enriched = uploads.map((u) => ({
        ...u,
        ...(statsMap.get(u.videoId) || {}),
      }));

      totalFetched += enriched.length;

      // Save raw for audit
      const rawPath = resolve(
        RAW_DIR,
        `youtube-${slugify(channel.name)}-${dateStamp}.json`,
      );
      await writeJson(rawPath, enriched);

      let candidatesHere = 0;
      for (const video of enriched) {
        candidates.push({
          channelName: channel.name,
          video,
          row: buildRow(video, channel.name),
        });
        candidatesHere += 1;
      }

      totalCandidates += candidatesHere;
      console.log(`fetched ${enriched.length.toString().padStart(2)}, ${candidatesHere} new candidates`);

      // polite pause between channels
      await new Promise((r) => setTimeout(r, 800));
    } catch (error) {
      console.log(`❌ ${error.message.slice(0, 100)}`);
    }
  }

  // Phase 2: AI relevance filter
  let kept = candidates;
  let dropped = [];

  if (!skipFilter && candidates.length > 0) {
    console.log(`\n🧠 Running AI relevance filter on ${candidates.length} candidates...`);
    try {
      const verdicts = await filterByRelevance(
        candidates.map((c) => ({
          title: c.video.title,
          source: 'youtube',
          creator: c.channelName,
          topic: trimSmart(c.video.description || '', 200),
        })),
      );
      kept = candidates.filter((_, i) => verdicts[i]?.relevant);
      dropped = candidates.filter((_, i) => !verdicts[i]?.relevant);
      console.log(`  ✅ ${kept.length} relevant · ❌ ${dropped.length} dropped`);
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
    `\n✅ Done. ${totalFetched} videos fetched · ${totalCandidates} candidates · ${kept.length} added to DB\n`,
  );
}

const isDirectRun = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;

if (isDirectRun) {
  main().catch((error) => {
    console.error(`\n❌ Fatal: ${error.message}\n`);
    process.exitCode = 1;
  });
}
