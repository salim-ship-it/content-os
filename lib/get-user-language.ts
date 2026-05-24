import { getSupabaseServer } from "@/lib/supabase-server";
import type { ContentLanguage } from "@/lib/recommended-creators";

export async function getUserLanguage(): Promise<ContentLanguage> {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return "en";
  const { data } = await supabase
    .from("user_onboarding")
    .select("state")
    .eq("user_id", user.id)
    .single();
  const lang = (data?.state as { language?: string } | null)?.language;
  return lang === "ar" ? "ar" : "en";
}
