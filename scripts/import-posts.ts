/**
 * Import posts from JSON export into Supabase
 * Usage: npx ts-node scripts/import-posts.ts posts-export.json
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

const filePath = process.argv[2];
if (!filePath) {
  console.error("Usage: npx ts-node scripts/import-posts.ts <file-path>");
  console.error("Example: npx ts-node scripts/import-posts.ts posts-export.json");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function importPosts() {
  try {
    console.log("📥 Reading export file...");

    if (!fs.existsSync(filePath)) {
      console.error(`❌ File not found: ${filePath}`);
      process.exit(1);
    }

    const fileContent = fs.readFileSync(filePath, "utf-8");
    const exportData = JSON.parse(fileContent);

    if (!exportData.posts || !Array.isArray(exportData.posts)) {
      console.error("❌ Invalid export file format. Missing 'posts' array.");
      process.exit(1);
    }

    const posts = exportData.posts;
    console.log(`📊 Found ${posts.length} posts to import`);

    // Remove IDs so Supabase generates new ones
    const postsToImport = posts.map(({ id, ...rest }: any) => ({
      ...rest,
      created_at: new Date(rest.created_at).toISOString(),
      updated_at: new Date(rest.updated_at).toISOString(),
    }));

    console.log("⏳ Inserting posts...");
    const { error, data } = await supabase
      .from("content_posts")
      .insert(postsToImport)
      .select();

    if (error) {
      console.error("❌ Import failed:", error.message);
      process.exit(1);
    }

    console.log(`✅ Successfully imported ${data?.length || 0} posts`);
    console.log("🎉 Your swipe file is ready!");
  } catch (error) {
    console.error("❌ Import error:", error);
    process.exit(1);
  }
}

importPosts();
