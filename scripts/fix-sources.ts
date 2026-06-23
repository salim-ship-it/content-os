import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

async function fixSources() {
  const correctUserId = "ff96cabf-d7e1-4fb2-8ba7-156495d5d5ca";

  console.log(`Moving Kenny & Mich to correct user: ${correctUserId}\n`);

  // Delete from wrong user
  await supabase
    .from("user_sources")
    .delete()
    .in("name", ["Kenny", "Mich"])
    .eq("user_id", "c08fdb8e-0b91-469c-b1a6-1762bd66eeec");

  console.log("✓ Deleted from wrong account");

  // Add to correct user
  const { data, error } = await supabase
    .from("user_sources")
    .insert([
      {
        user_id: correctUserId,
        kind: "linkedin",
        name: "Kenny",
        url: "https://linkedin.com/in/kenny",
        enabled: true,
        max_posts: 1000,
        note: "ColdIQ founder - imported from LinkedIn content hub"
      },
      {
        user_id: correctUserId,
        kind: "linkedin",
        name: "Mich",
        url: "https://linkedin.com/in/mich",
        enabled: true,
        max_posts: 1000,
        note: "ColdIQ founder - imported from LinkedIn content hub"
      }
    ])
    .select();

  if (error) {
    console.error("✗ Error:", error.message);
  } else {
    console.log("✓ Added to correct account");
    console.log("\nSources added:");
    data?.forEach(s => console.log(`  - ${s.name} (${s.kind})`));
    console.log("\nRefresh your browser now to see Kenny & Mich! 🎉");
  }
}

fixSources();
