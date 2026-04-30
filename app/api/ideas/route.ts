import { type NextRequest } from "next/server";
import { readIdeas, addIdea } from "@/lib/ideas";
import { requireUser } from "@/lib/auth";

export async function GET() {
  const userId = await requireUser();
  const ideas = await readIdeas(userId);
  return Response.json(ideas);
}

export async function POST(request: NextRequest) {
  const userId = await requireUser();
  const body = await request.json();
  await addIdea(userId, {
    date: body.date,
    source: body.source,
    original: body.original,
    angle: body.angle,
    format: body.format,
    status: body.status,
    priority: body.priority,
  });
  return Response.json({ ok: true });
}
