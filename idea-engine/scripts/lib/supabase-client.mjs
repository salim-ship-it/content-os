/**
 * supabase-client.mjs — Shared Supabase write client for all scrapers.
 *
 * Provides upsertPosts() which inserts new posts and skips duplicates
 * based on the `link` field. Returns the count of actually inserted rows.
 */

import { loadEnv } from './content-automation.mjs';

let _url = null;
let _key = null;

async function ensureEnv() {
  if (_url && _key) return;
  await loadEnv();
  _url = process.env.SUPABASE_URL;
  _key = process.env.SUPABASE_SERVICE_JWT;
  if (!_url || !_key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_JWT in .env.local');
  }
}

/**
 * Upsert posts to Supabase. Dedupes on `link`. Returns number of rows written.
 *
 * @param {Array<{source, type, title, creator, date, likes, comments, reposts, topic, why_it_worked, link}>} posts
 * @returns {Promise<number>}
 */
export async function upsertPosts(posts) {
  if (posts.length === 0) return 0;
  await ensureEnv();

  // Dedupe within the batch by link
  const seen = new Set();
  const deduped = [];
  for (const post of posts) {
    if (!post.link) continue;
    if (seen.has(post.link)) continue;
    seen.add(post.link);
    deduped.push(post);
  }

  if (deduped.length === 0) return 0;

  // Insert in batches of 50
  const BATCH = 50;
  let written = 0;

  for (let i = 0; i < deduped.length; i += BATCH) {
    const batch = deduped.slice(i, i + BATCH);
    const response = await fetch(`${_url}/rest/v1/content_posts?on_conflict=link`, {
      method: 'POST',
      headers: {
        'apikey': _key,
        'Authorization': `Bearer ${_key}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal,resolution=merge-duplicates',
      },
      body: JSON.stringify(batch),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Supabase upsert failed: ${response.status} ${text.slice(0, 300)}`);
    }
    written += batch.length;
  }

  return written;
}

/**
 * Check if a link already exists in Supabase (for dedup before expensive operations).
 *
 * @param {string} link
 * @returns {Promise<boolean>}
 */
export async function linkExists(link) {
  await ensureEnv();
  const response = await fetch(
    `${_url}/rest/v1/content_posts?link=eq.${encodeURIComponent(link)}&select=id&limit=1`,
    {
      headers: {
        'apikey': _key,
        'Authorization': `Bearer ${_key}`,
      },
    },
  );
  if (!response.ok) return false;
  const data = await response.json();
  return data.length > 0;
}
