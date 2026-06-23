import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

async function addSources() {
  // Get the first user (you)
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();

  if (userError || !users || users.length === 0) {
    console.error("Error getting users:", userError);
    return;
  }

  const userId = users[0].id;
  console.log(`Adding sources for user: ${userId}\n`);

  const sources = [
    {
      user_id: userId,
      kind: "linkedin",
      name: "Kenny",
      url: "https://linkedin.com/in/kenny",
      enabled: true,
      max_posts: 1000,
      note: "ColdIQ founder - imported from LinkedIn content hub"
    },
    {
      user_id: userId,
      kind: "linkedin",
      name: "Mich",
      url: "https://linkedin.com/in/mich",
      enabled: true,
      max_posts: 1000,
      note: "ColdIQ founder - imported from LinkedIn content hub"
    }
  ];

  const { data, error } = await supabase
    .from("user_sources")
    .insert(sources)
    .select();

  if (error) {
    console.error("Error adding sources:", error.message);
  } else {
    console.log("✓ Sources added successfully:");
    data?.forEach(s => console.log(`  - ${s.name} (${s.kind})`));
    console.log("\nNow refresh the app to see Kenny and Mich in your swipe file!");
  }
}

addSources();
