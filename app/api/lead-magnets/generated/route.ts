import { type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { listLeadMagnets, deleteLeadMagnet } from "@/lib/lead-magnet-generate";

export async function GET() {
  const userId = await requireUser();
  try {
    const magnets = await listLeadMagnets(userId);
    return Response.json({ magnets });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const userId = await requireUser();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return Response.json({ error: "id required" }, { status: 400 });
  try {
    await deleteLeadMagnet(userId, id);
    return Response.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ error: msg }, { status: 500 });
  }
}
