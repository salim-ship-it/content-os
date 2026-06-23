import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

async function debug() {
  console.log("\n=== CHECKING DATA CONSISTENCY ===\n");

  // Check sources
  const { data: allSources } = await supabase
    .from("user_sources")
    .select("*");

  console.log("ALL sources in DB:");
  allSources?.forEach(s => {
    console.log(`  [${s.id}] ${s.name} | kind: ${s.kind} | user_id: ${s.user_id} | enabled: ${s.enabled}`);
  });

  // Check posts
  const { data: allPosts } = await supabase
    .from("content_posts")
    .select("id, creator, source, likes")
    .order("creator");

  console.log(`\nALL posts in DB (${allPosts?.length || 0}):`);
  const creators = new Set<string>();
  allPosts?.forEach(p => creators.add(p.creator));

  creators.forEach(c => {
    const count = allPosts?.filter(p => p.creator === c).length || 0;
    console.log(`  "${c}": ${count} posts`);
  });

  // Check exact query that swipe file uses
  console.log(`\nTesting readPostsByCreators query with ["Kenny", "Mich"]:`);
  const { data: testPosts, error } = await supabase
    .from("content_posts")
    .select("id, creator, source, likes")
    .eq("source", "linkedin")
    .in("creator", ["Kenny", "Mich"])
    .order("likes", { ascending: false });

  if (error) {
    console.log(`  ERROR: ${error.message}`);
  } else {
    console.log(`  Result: ${testPosts?.length || 0} posts`);
    testPosts?.forEach(p => {
      console.log(`    ${p.creator}: ${p.likes} likes`);
    });
  }

  // Check if Kenny/Mich posts exist at all
  console.log(`\nDirect creator queries:`);
  const { data: kenny } = await supabase
    .from("content_posts")
    .select("count");
  //.eq("creator", "Kenny");

  console.log(`Kenny posts: ${kenny?.length || 0}`);
  const { data: mich } = await supabase
    .from("content_posts")
    .select("count");
  //.eq("creator", "Mich");

  console.log(`Mich posts: ${mich?.length || 0}`);
}

debug();
