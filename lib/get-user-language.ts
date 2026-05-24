import { createClient } from "@supabase/supabase-js";
import { getSupabaseServer } from "@/lib/supabase-server";
import type { ContentLanguage } from "@/lib/recommended-creators";

export async function getUserLanguage(): Promise<ContentLanguage> {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return "en";

  // Use service-role client so this works in any server-rendering context
  // (root layout, etc.) regardless of how RLS is set up for user_onboarding.
  const admin = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { persistSession: false } }
  );
  const { data } = await admin
    .from("user_onboarding")
    .select("state")
    .eq("user_id", user.id)
    .maybeSingle();
  const lang = (data?.state as { language?: string } | null)?.language;
  return lang === "ar" ? "ar" : "en";
}
