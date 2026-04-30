import { type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { getLeadMagnet } from "@/lib/lead-magnet-generate";
import { pushToNotion } from "@/lib/notion-push";

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  const userId = await requireUser();
  const body = await request.json().catch(() => null);
  const id = body?.id ? String(body.id) : null;
  if (!id) return Response.json({ error: "id required" }, { status: 400 });

  const magnet = await getLeadMagnet(userId, id);
  if (!magnet) return Response.json({ error: "not found" }, { status: 404 });

  try {
    const result = await pushToNotion(magnet.title, magnet.content);
    return Response.json({ ok: true, ...result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ error: msg }, { status: 500 });
  }
}
