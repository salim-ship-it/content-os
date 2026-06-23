import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

async function exportData() {
  console.log("\n📥 Exporting all data from Supabase...\n");

  // Export user_sources
  const { data: sources } = await supabase
    .from("user_sources")
    .select("*");

  // Export content_posts
  const { data: posts } = await supabase
    .from("content_posts")
    .select("*");

  const exportData = {
    exported_at: new Date().toISOString(),
    sources: sources || [],
    posts: posts || [],
    summary: {
      total_sources: sources?.length || 0,
      total_posts: posts?.length || 0,
    }
  };

  // Save as JSON
  const jsonFile = "content-os-backup.json";
  fs.writeFileSync(jsonFile, JSON.stringify(exportData, null, 2));

  console.log(`✓ Exported ${sources?.length || 0} sources`);
  console.log(`✓ Exported ${posts?.length || 0} posts`);
  console.log(`\n📄 Saved to: ${jsonFile}`);
  console.log("\nShare this file with the other person.\n");
}

exportData().catch(err => {
  console.error("Export failed:", err);
  process.exit(1);
});
