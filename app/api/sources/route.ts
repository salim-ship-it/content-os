import { type NextRequest } from "next/server";
import { readSources, addSource, removeSource, updateSource } from "@/lib/sources";
import { requireUser } from "@/lib/auth";
import { inngest } from "@/lib/inngest";

export async function GET() {
  const userId = await requireUser();
  const sources = await readSources(userId);
  return Response.json(sources);
}

export async function POST(request: NextRequest) {
  const userId = await requireUser();
  const body = await request.json();
  const source = {
    kind: body.kind,
    name: body.name,
    url: body.url,
    note: body.note ?? "",
    enabled: body.enabled ?? true,
    maxPosts: body.maxPosts ?? 10,
  };
  const updated = await addSource(userId, source);

  // Fire-and-forget scrape for the just-added source. LinkedIn already has a
  // working Inngest function (creator/added). Reddit fires reddit/added. Other
  // kinds (newsletter, youtube) don't have scrapers yet — silently skipped.
  try {
    if (source.kind === "linkedin" && source.url) {
      await inngest.send({
        name: "creator/added",
        data: {
          userId,
          creatorUrl: source.url,
          creatorName: source.name,
          maxPosts: source.maxPosts,
        },
      });
    } else if (source.kind === "reddit" && source.name) {
      await inngest.send({
        name: "reddit/added",
        data: { userId, subredditName: source.name },
      });
    }
  } catch (e) {
    console.error("inngest send failed:", e);
  }

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
