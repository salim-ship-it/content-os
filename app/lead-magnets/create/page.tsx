import { requireUser } from "@/lib/auth";
import { readVoiceProfile } from "@/lib/voice-storage";
import { CreateLeadMagnetClient } from "./create-client";

export const dynamic = "force-dynamic";

export default async function CreateLeadMagnetPage() {
  const userId = await requireUser();
  const voiceProfile = await readVoiceProfile(userId);
  return <CreateLeadMagnetClient hasVoiceProfile={Boolean(voiceProfile)} />;
}
