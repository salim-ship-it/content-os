import { createClient } from "@supabase/supabase-js";
import { getSupabaseServer } from "@/lib/supabase-server";
import type { ContentLanguage } from "@/lib/recommended-creators";

function pickLang(state: unknown): ContentLanguage {
  const lang = (state as { language?: string } | null)?.language;
  return lang === "ar" ? "ar" : "en";
}

export async function getUserLanguage(): Promise<ContentLanguage> {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return "en";

    // Try the user-scoped client first — works in any context where RLS allows
    // the user to read their own row (most pages).
    try {
      const { data } = await supabase
        .from("user_onboarding")
        .select("state")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) return pickLang(data.state);
    } catch { /* fall through to admin */ }

    // Fall back to the service-role client for contexts where RLS blocks the
    // user-scoped read (e.g. the root layout in some Next.js versions).
    const url = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_KEY;
    if (!url || !serviceKey) return "en";

    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
    const { data } = await admin
      .from("user_onboarding")
      .select("state")
      .eq("user_id", user.id)
      .maybeSingle();
    return pickLang(data?.state);
  } catch {
    return "en";
  }
}
