import { type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { readSources, addSource } from "@/lib/sources";
import { getSupabaseServer } from "@/lib/supabase-server";
import { MAX_CREATORS_PER_USER } from "@/lib/recommended-creators";

export async function POST(request: NextRequest) {
  const userId = await requireUser();
  const body = await request.json().catch(() => ({}));
  const incoming: { name?: string; url?: string }[] = Array.isArray(body?.creators) ? body.creators : [];

  if (incoming.length === 0) {
    return Response.json({ error: "No creators provided" }, { status: 400 });
  }
  if (incoming.length > MAX_CREATORS_PER_USER) {
    return Response.json(
      { error: `Max ${MAX_CREATORS_PER_USER} creators per user` },
      { status: 400 }
    );
  }

  const existing = await readSources(userId);
  const existingLinkedIn = existing.filter((s) => s.kind === "linkedin");
  const existingUrls = new Set(existingLinkedIn.map((s) => s.url));

  const toAdd: { name: string; url: string }[] = [];
  for (const c of incoming) {
    if (!c?.url || !c?.name) continue;
    if (existingUrls.has(c.url)) continue;
    toAdd.push({ name: c.name, url: c.url });
  }

  if (existingLinkedIn.length + toAdd.length > MAX_CREATORS_PER_USER) {
    return Response.json(
      {
        error: `You already follow ${existingLinkedIn.length} creator(s). Total can't exceed ${MAX_CREATORS_PER_USER}.`,
      },
      { status: 400 }
    );
  }

  for (const c of toAdd) {
    await addSource(userId, {
      kind: "linkedin",
      name: c.name,
      url: c.url,
      enabled: true,
      maxPosts: 20,
      note: "",
    });
  }

  const supabase = await getSupabaseServer();
  await supabase
    .from("user_onboarding")
    .upsert(
      {
        user_id: userId,
        state: { creators_completed: true },
        completed: false,
      },
      { onConflict: "user_id" }
    );

  return Response.json({ added: toAdd.length, total: existingLinkedIn.length + toAdd.length });
}
