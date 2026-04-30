#!/usr/bin/env node

// One-off: removes duplicate rows in published_posts (same post_url).
// Keeps the row with the highest `likes` (tiebreak: largest id).

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const envPath = resolve(process.cwd(), '.env.local');
const env = Object.fromEntries(
  (await readFile(envPath, 'utf-8'))
    .split('\n')
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
    }),
);

const url = env.SUPABASE_URL;
const key = env.SUPABASE_SERVICE_JWT || env.SUPABASE_SERVICE_KEY;
if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_JWT in .env.local');

const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  'Content-Type': 'application/json',
};

// Pull every row (pagination for safety)
async function fetchAll() {
  const rows = [];
  let from = 0;
  const page = 1000;
  while (true) {
    const res = await fetch(
      `${url}/rest/v1/published_posts?select=id,post_url,content,title,likes,published_date&order=published_date.asc`,
      { headers: { ...headers, Range: `${from}-${from + page - 1}`, 'Range-Unit': 'items' } },
    );
    if (!res.ok) throw new Error(`Fetch failed ${res.status}: ${await res.text()}`);
    const chunk = await res.json();
    rows.push(...chunk);
    if (chunk.length < page) break;
    from += page;
  }
  return rows;
}

const all = await fetchAll();
console.log(`Total rows: ${all.length}`);

// Group by content fingerprint (first 200 chars, whitespace-normalized)
// Falls back to title if content is empty.
function fingerprint(r) {
  const raw = r.content || r.title || '';
  return raw.slice(0, 200).replace(/\s+/g, ' ').trim().toLowerCase();
}
const groups = new Map();
for (const r of all) {
  const fp = fingerprint(r);
  if (!fp) continue;
  const arr = groups.get(fp) ?? [];
  arr.push(r);
  groups.set(fp, arr);
}

const toDelete = [];
let dupGroups = 0;
for (const [, arr] of groups) {
  if (arr.length <= 1) continue;
  dupGroups++;
  // Winner: highest likes, then most recent, then shortest URL (prefers canonical /posts/...activity form)
  arr.sort((a, b) => {
    if (b.likes !== a.likes) return b.likes - a.likes;
    if (b.published_date !== a.published_date) return b.published_date.localeCompare(a.published_date);
    return (a.post_url?.length || 0) - (b.post_url?.length || 0);
  });
  const [, ...losers] = arr;
  for (const l of losers) toDelete.push(l.id);
}

console.log(`Duplicate URL groups: ${dupGroups}`);
console.log(`Rows to delete: ${toDelete.length}`);

if (toDelete.length === 0) {
  console.log('Nothing to do.');
  process.exit(0);
}

// IDs are UUIDs — delete one at a time for simplicity (small count)
let deleted = 0;
for (const id of toDelete) {
  const res = await fetch(`${url}/rest/v1/published_posts?id=eq.${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { ...headers, Prefer: 'return=minimal' },
  });
  if (!res.ok) throw new Error(`Delete failed ${res.status}: ${await res.text()}`);
  deleted++;
  process.stdout.write(`  deleted ${deleted}/${toDelete.length}\r`);
}
console.log(`\n✅ Deleted ${deleted} duplicate rows.`);
