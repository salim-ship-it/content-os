import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function verify() {
  const { data } = await supabase
    .from("content_posts")
    .select("source, creator")
    .in("creator", ["Kenny", "Mich"]);

  const counts = { Kenny: 0, Mich: 0 };
  for (const row of data || []) {
    counts[row.creator as "Kenny" | "Mich"]++;
  }

  console.log("Imported posts:");
  console.log(`  Kenny: ${counts.Kenny} posts`);
  console.log(`  Mich: ${counts.Mich} posts`);
  console.log(`  Total: ${counts.Kenny + counts.Mich} posts`);

  const { data: topPosts } = await supabase
    .from("content_posts")
    .select("creator, title, likes")
    .in("creator", ["Kenny", "Mich"])
    .order("likes", { ascending: false })
    .limit(3);

  console.log("\nTop posts by engagement:");
  for (const post of topPosts || []) {
    console.log(`  ${post.creator}: ${post.likes} likes`);
    console.log(`    "${post.title?.substring(0, 70)}..."`);
  }
}

verify().catch(console.error);
