import { createClient } from "@supabase/supabase-js";
import { getSupabaseServer } from "@/lib/supabase-server";
import type { ContentLanguage } from "@/lib/recommended-creators";

export async function getUserLanguage(): Promise<ContentLanguage> {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return "en";

    const url = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_KEY;
    if (!url || !serviceKey) return "en";

    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
    const { data } = await admin
      .from("user_onboarding")
      .select("state")
      .eq("user_id", user.id)
      .maybeSingle();
    const lang = (data?.state as { language?: string } | null)?.language;
    return lang === "ar" ? "ar" : "en";
  } catch {
    return "en";
  }
}
