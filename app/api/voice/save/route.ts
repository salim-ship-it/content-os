import { type NextRequest } from "next/server";
import { writeVoiceProfile } from "@/lib/voice-storage";
import { requireUser } from "@/lib/auth";
import {
  readOnboarding,
  renderPillarsMarkdown,
  writePillars,
  writePillarsMarkdown,
  type Pillars,
} from "@/lib/pillars";

export async function POST(request: NextRequest) {
  const userId = await requireUser();
  const body = (await request.json()) as { profile?: string; pillars?: Pillars };

  if (!body.profile) {
    return Response.json({ error: "Missing profile content" }, { status: 400 });
  }

  await writeVoiceProfile(userId, body.profile);

  let pillarsSaved = false;
  if (body.pillars) {
    await writePillars(userId, body.pillars);
    const onboarding = await readOnboarding(userId);
    const md = renderPillarsMarkdown(onboarding?.name ?? "Unknown", body.pillars);
    await writePillarsMarkdown(userId, md);
    pillarsSaved = true;
  }

  return Response.json({ ok: true, pillarsSaved });
}
