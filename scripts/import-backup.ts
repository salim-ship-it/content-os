import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

interface BackupData {
  exported_at: string;
  sources: any[];
  posts: any[];
  summary: {
    total_sources: number;
    total_posts: number;
  };
}

async function importData(filePath: string) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }

  console.log(`\n📤 Importing data from ${filePath}...\n`);

  const fileContent = fs.readFileSync(filePath, "utf-8");
  const backup: BackupData = JSON.parse(fileContent);

  console.log(`Found ${backup.summary.total_sources} sources and ${backup.summary.total_posts} posts`);
  console.log(`Exported at: ${backup.exported_at}\n`);

  // Import sources
  if (backup.sources.length > 0) {
    console.log(`Importing ${backup.sources.length} sources...`);
    const { error: sourceError } = await supabase
      .from("user_sources")
      .insert(backup.sources);

    if (sourceError) {
      console.error(`❌ Error importing sources:`, sourceError);
    } else {
      console.log(`✓ Imported ${backup.sources.length} sources`);
    }
  }

  // Import posts (in batches of 100)
  if (backup.posts.length > 0) {
    console.log(`\nImporting ${backup.posts.length} posts...`);
    const batchSize = 100;
    let imported = 0;

    for (let i = 0; i < backup.posts.length; i += batchSize) {
      const batch = backup.posts.slice(i, i + batchSize);
      const { error: postError } = await supabase
        .from("content_posts")
        .insert(batch);

      if (postError) {
        console.error(`❌ Error importing batch ${i / batchSize + 1}:`, postError);
      } else {
        imported += batch.length;
        console.log(`✓ Imported batch ${i / batchSize + 1} (${imported}/${backup.posts.length})`);
      }
    }
  }

  console.log(`\n✅ Import complete!`);
  console.log(`Total sources: ${backup.sources.length}`);
  console.log(`Total posts: ${backup.posts.length}\n`);
}

const backupFile = process.argv[2] || "content-os-backup.json";
importData(backupFile);
