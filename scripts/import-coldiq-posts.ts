import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { parse as csvParse } from "csv-parse/sync";
import dotenv from "dotenv";
import { randomUUID } from "crypto";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface CSVRow {
  engagement_rank: string;
  post_number: string;
  time_posted: string;
  hook: string;
  reactions: string;
  comments: string;
  total_engagement: string;
  char_count: string;
  full_content: string;
}

interface ContentPost {
  id: string;
  source: string;
  type: string;
  title: string;
  creator: string;
  date: string;
  created_at: string;
  likes: number;
  comments: number;
  reposts: number;
  topic: string;
  why_it_worked: string;
  link: string;
  content: string;
  image_url: string;
  author_image_url: string;
}

function parseCSV(filePath: string): CSVRow[] {
  const content = fs.readFileSync(filePath, "utf-8");
  return csvParse(content, {
    columns: true,
    skip_empty_lines: true,
  });
}

function transformPost(row: CSVRow, creator: string): ContentPost {
  const id = randomUUID();
  const likes = parseInt(row.reactions, 10) || 0;
  const comments = parseInt(row.comments, 10) || 0;
  const now = new Date().toISOString();

  // time_posted doesn't contain dates, so use current timestamp for all
  const date = now;

  // Generate unique link from UUID to satisfy uniqueness constraint
  const link = `https://linkedin.com/feed/update/urn:li:activity:${id}`;

  return {
    id,
    source: "linkedin",
    type: "engagement",
    title: row.hook || row.time_posted || "LinkedIn Post",
    creator,
    date,
    created_at: now,
    likes,
    comments,
    reposts: 0,
    topic: "",
    why_it_worked: "",
    link,
    content: row.full_content || row.time_posted || "",
    image_url: "",
    author_image_url: "",
  };
}

async function importPosts() {
  const creatorPaths = [
    {
      path: path.join(
        "/tmp/ColdIQ-s-GTM-Skills/master-skills/linkedin-content/resources/posts/kenny-posts-reference.csv"
      ),
      creator: "Kenny",
    },
    {
      path: path.join(
        "/tmp/ColdIQ-s-GTM-Skills/master-skills/linkedin-content/resources/posts/mich-posts-reference.csv"
      ),
      creator: "Mich",
    },
  ];

  let totalImported = 0;

  for (const { path: filePath, creator } of creatorPaths) {
    if (!fs.existsSync(filePath)) {
      console.log(`File not found: ${filePath}`);
      continue;
    }

    console.log(`\nImporting ${creator} posts from ${filePath}...`);

    const rows = parseCSV(filePath);
    console.log(`  Found ${rows.length} posts`);

    const posts = rows.map((row) => transformPost(row, creator));

    // Insert in batches of 100 to avoid overwhelming the API
    const batchSize = 100;
    for (let i = 0; i < posts.length; i += batchSize) {
      const batch = posts.slice(i, i + batchSize);
      const { error } = await supabase
        .from("content_posts")
        .insert(batch)
        .select();

      if (error) {
        console.error(`  Error inserting batch ${i / batchSize + 1}:`, error);
      } else {
        console.log(`  ✓ Inserted batch ${i / batchSize + 1} (${batch.length} posts)`);
        totalImported += batch.length;
      }
    }
  }

  console.log(`\n✓ Import complete! Total posts imported: ${totalImported}`);
}

importPosts().catch((error) => {
  console.error("Import failed:", error);
  process.exit(1);
});
