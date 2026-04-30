#!/usr/bin/env node

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

const res = await fetch(
  `${url}/rest/v1/published_posts?select=id,title,post_url,content,published_date,likes&order=published_date.desc`,
  { headers: { apikey: key, Authorization: `Bearer ${key}` } },
);
const rows = await res.json();

console.log(`Total rows: ${rows.length}\n`);

// Group by first 80 chars of title
const byTitle = new Map();
for (const r of rows) {
  const k = (r.title || '').slice(0, 80).trim();
  const arr = byTitle.get(k) ?? [];
  arr.push(r);
  byTitle.set(k, arr);
}

const dupes = [...byTitle.entries()].filter(([, arr]) => arr.length > 1);
console.log(`Duplicate TITLE groups: ${dupes.length}`);
for (const [title, arr] of dupes.slice(0, 8)) {
  console.log(`\n"${title.slice(0, 60)}..." — ${arr.length} rows:`);
  for (const r of arr) {
    console.log(`  id=${r.id} likes=${r.likes} date=${r.published_date}`);
    console.log(`    url: ${r.post_url}`);
  }
}

// Group by first 120 chars of content (more reliable)
console.log('\n\n--- By content fingerprint ---');
const byContent = new Map();
for (const r of rows) {
  if (!r.content) continue;
  const k = r.content.slice(0, 120).replace(/\s+/g, ' ').trim();
  const arr = byContent.get(k) ?? [];
  arr.push(r);
  byContent.set(k, arr);
}
const contentDupes = [...byContent.entries()].filter(([, arr]) => arr.length > 1);
console.log(`Duplicate CONTENT groups: ${contentDupes.length}`);
