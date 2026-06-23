import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

async function debugSwipeFile() {
  // Get the user
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const userId = users?.[0]?.id;

  console.log(`\n=== DEBUG SWIPE FILE ===`);
  console.log(`User ID: ${userId}\n`);

  // Get sources (like swipe-file/page.tsx does)
  const { data: sources } = await supabase
    .from("user_sources")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  console.log(`Sources for user (${sources?.length || 0}):`);
  const creatorNames = sources
    ?.filter((s: any) => s.kind === "linkedin")
    .map((s: any) => s.name.trim());

  sources?.forEach((s: any) => {
    console.log(`  - ${s.name} (${s.kind}) enabled: ${s.enabled}`);
  });

  console.log(`\nLinkedIn creator names: ${JSON.stringify(creatorNames)}\n`);

  // Get posts for these creators (like readPostsByCreators does)
  if (creatorNames && creatorNames.length > 0) {
    const { data: posts, error } = await supabase
      .from("content_posts")
      .select("*")
      .eq("source", "linkedin")
      .in("creator", creatorNames)
      .order("likes", { ascending: false });

    if (error) {
      console.error("Error fetching posts:", error);
    } else {
      console.log(`Posts fetched (${posts?.length || 0}):`);
      const byCreator: Record<string, number> = {};
      posts?.forEach((p: any) => {
        byCreator[p.creator] = (byCreator[p.creator] || 0) + 1;
      });

      Object.entries(byCreator).forEach(([creator, count]) => {
        console.log(`  ${creator}: ${count} posts`);
      });
    }
  }
}

debugSwipeFile();
