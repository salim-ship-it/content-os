import { type NextRequest } from "next/server";
import { readSources, addSource, removeSource, updateSource } from "@/lib/sources";
import { requireUser } from "@/lib/auth";

export async function GET() {
  const userId = await requireUser();
  const sources = await readSources(userId);
  return Response.json(sources);
}

export async function POST(request: NextRequest) {
  const userId = await requireUser();
  const body = await request.json();
  const updated = await addSource(userId, {
    kind: body.kind,
    name: body.name,
    url: body.url,
    note: body.note ?? "",
    enabled: body.enabled ?? true,
    maxPosts: body.maxPosts ?? 10,
  });
  return Response.json(updated);
}

export async function DELETE(request: NextRequest) {
  const userId = await requireUser();
  const url = request.nextUrl.searchParams.get("url");
  if (!url) return Response.json({ error: "url required" }, { status: 400 });
  const updated = await removeSource(userId, url);
  return Response.json(updated);
}

export async function PATCH(request: NextRequest) {
  const userId = await requireUser();
  const body = await request.json();
  const { url, ...patch } = body;
  if (!url) return Response.json({ error: "url required" }, { status: 400 });
  const updated = await updateSource(userId, url, patch);
  return Response.json(updated);
}
