import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

async function showPosts() {
  const { data } = await supabase
    .from("content_posts")
    .select("creator, title, likes, comments, source")
    .in("creator", ["Kenny", "Mich"])
    .order("creator", { ascending: true })
    .order("likes", { ascending: false });

  let currentCreator = "";
  console.log("\n=== ALL IMPORTED COLDIQ POSTS ===\n");

  for (const post of data || []) {
    if (post.creator !== currentCreator) {
      currentCreator = post.creator;
      console.log(`\n📌 ${post.creator.toUpperCase()}'S POSTS`);
      console.log("─".repeat(60));
    }
    console.log(`❤️  ${post.likes} likes | 💬 ${post.comments} comments`);
    console.log(`   "${post.title}"`);
  }

  console.log("\n" + "=".repeat(60));
  console.log(`✅ Total posts imported: ${data?.length || 0}`);
}

showPosts();
