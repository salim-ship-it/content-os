import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

async function checkSources() {
  // Get user
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const userId = users?.[0]?.id;

  if (!userId) {
    console.log("No users found");
    return;
  }

  // Check sources
  const { data: sources } = await supabase
    .from("user_sources")
    .select("*")
    .eq("user_id", userId);

  console.log(`User: ${userId}\n`);
  console.log(`Sources in database (${sources?.length || 0}):`);
  sources?.forEach(s => {
    console.log(`  - ${s.name} (${s.kind}) - enabled: ${s.enabled}`);
  });

  // Check posts by creator
  const { data: posts } = await supabase
    .from("content_posts")
    .select("creator, count")
    .in("creator", ["Kenny", "Mich"])
    .limit(2);

  console.log(`\nPosts count by creator:`);
  const { data: kenny } = await supabase
    .from("content_posts")
    .select("*", { count: "exact" })
    .eq("creator", "Kenny");

  const { data: mich } = await supabase
    .from("content_posts")
    .select("*", { count: "exact" })
    .eq("creator", "Mich");

  console.log(`  Kenny: ${kenny?.length || 0} posts`);
  console.log(`  Mich: ${mich?.length || 0} posts`);
}

checkSources();
