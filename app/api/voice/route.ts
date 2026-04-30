import { type NextRequest } from "next/server";
import { readVoiceDraft, writeVoiceDraft } from "@/lib/voice-storage";
import { requireUser } from "@/lib/auth";

export async function GET() {
  const userId = await requireUser();
  const draft = await readVoiceDraft(userId);
  return Response.json(draft ?? { answers: {} });
}

export async function PUT(request: NextRequest) {
  const userId = await requireUser();
  const body = await request.json();
  await writeVoiceDraft(userId, body);
  return Response.json({ ok: true });
}
