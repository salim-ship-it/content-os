import { promises as fs } from "fs";
import { VoiceOnboardingClient } from "./voice-client";
import { readVoiceDraft, readVoiceProfile } from "@/lib/voice-storage";
import { requireUser } from "@/lib/auth";
import { PILLARS_DRAFT_PATH } from "@/lib/paths";
import type { Pillars } from "@/lib/pillars";

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
  const [draft, profile, pillars] = await Promise.all([
    readVoiceDraft(userId).catch(() => null),
    readVoiceProfile(userId).catch(() => null),
    readPillars(),
  ]);

  return (
    <VoiceOnboardingClient
      initialDraft={draft ?? { answers: {} }}
      initialProfile={profile}
      initialPillars={pillars}
    />
  );
}
