/**
 * Export all posts from Supabase to JSON file
 * Usage: npx ts-node scripts/export-posts.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function exportPosts() {
  try {
    console.log("📤 Exporting posts from Supabase...");

    const { data, error } = await supabase
      .from("content_posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Error fetching posts:", error.message);
      process.exit(1);
    }

    if (!data || data.length === 0) {
      console.log("⚠️  No posts found in database");
      process.exit(0);
    }

    const exportData = {
      exportedAt: new Date().toISOString(),
      postCount: data.length,
      posts: data,
    };

    const outputPath = path.join(process.cwd(), "posts-export.json");
    fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));

    console.log(`✅ Exported ${data.length} posts to ${outputPath}`);
    console.log(`📊 File size: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB`);
  } catch (error) {
    console.error("❌ Export failed:", error);
    process.exit(1);
  }
}

exportPosts();
