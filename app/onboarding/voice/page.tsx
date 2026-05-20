import { promises as fs } from "fs";
import { VoiceOnboardingClient } from "./voice-client";
import { readVoiceDraft, readVoiceProfile } from "@/lib/voice-storage";
import { requireUser } from "@/lib/auth";
import { PILLARS_DRAFT_PATH } from "@/lib/paths";
import type { Pillars } from "@/lib/pillars";
import { getSupabaseServer } from "@/lib/supabase-server";
import type { ContentLanguage } from "@/lib/recommended-creators";

async function readLanguage(userId: string): Promise<ContentLanguage> {
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from("user_onboarding")
    .select("state")
    .eq("user_id", userId)
    .single();
  const lang = (data?.state as { language?: string } | null)?.language;
  return lang === "ar" ? "ar" : "en";
}

export const dynamic = "force-dynamic";

async function readPillars(): Promise<Pillars | null> {
  try {
    const raw = await fs.readFile(PILLARS_DRAFT_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default async function VoiceOnboardingPage() {
  const userId = await requireUser();
  const [draft, profile, pillars, language] = await Promise.all([
    readVoiceDraft(userId).catch(() => null),
    readVoiceProfile(userId).catch(() => null),
    readPillars(),
    readLanguage(userId),
  ]);

  return (
    <VoiceOnboardingClient
      initialDraft={draft ?? { answers: {} }}
      initialProfile={profile}
      initialPillars={pillars}
      language={language}
    />
  );
}
