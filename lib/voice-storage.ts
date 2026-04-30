import { getSupabaseServer } from "@/lib/supabase-server";
import type { VoiceDraft } from "@/lib/voice-questions";

export async function readVoiceDraft(userId: string): Promise<VoiceDraft | null> {
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from("user_voice_profiles")
    .select("draft")
    .eq("user_id", userId)
    .single();
  return data?.draft ?? null;
}

export async function writeVoiceDraft(userId: string, draft: VoiceDraft): Promise<void> {
  const supabase = await getSupabaseServer();
  await supabase
    .from("user_voice_profiles")
    .upsert({ user_id: userId, draft, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
}

export async function readVoiceProfile(userId: string): Promise<string | null> {
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from("user_voice_profiles")
    .select("profile_markdown")
    .eq("user_id", userId)
    .single();
  return data?.profile_markdown ?? null;
}

export async function writeVoiceProfile(userId: string, content: string): Promise<void> {
  const supabase = await getSupabaseServer();
  await supabase
    .from("user_voice_profiles")
    .upsert({ user_id: userId, profile_markdown: content, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
}
