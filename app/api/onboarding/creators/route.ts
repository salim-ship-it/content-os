import { type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { readSources, addSource } from "@/lib/sources";
import { getSupabaseServer } from "@/lib/supabase-server";
import { MAX_CREATORS_PER_USER } from "@/lib/recommended-creators";
import { inngest } from "@/lib/inngest";

const ALLOWED_POST_COUNTS = new Set([10, 20, 50, 100]);
const DEFAULT_POSTS_PER_CREATOR = 20;

export async function POST(request: NextRequest) {
  const userId = await requireUser();
  const body = await request.json().catch(() => ({}));
  const incoming: { name?: string; url?: string }[] = Array.isArray(body?.creators) ? body.creators : [];

  const requested = Number(body?.postsPerCreator);
  const postsPerCreator = ALLOWED_POST_COUNTS.has(requested)
    ? requested
    : DEFAULT_POSTS_PER_CREATOR;

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
      maxPosts: postsPerCreator,
      note: "",
    });
  }

  const supabase = await getSupabaseServer();
  await supabase
    .from("user_onboarding")
    .upsert(
      {
        user_id: userId,
        state: { creators_completed: true, posts_per_creator: postsPerCreator },
        completed: false,
      },
      { onConflict: "user_id" }
    );

  // Fire-and-forget: kick off post scraping for each new creator. The Inngest
  // function does the work in the background so the UI doesn't wait.
  if (toAdd.length > 0) {
    try {
      await inngest.send(
        toAdd.map((c) => ({
          name: "creator/added" as const,
          data: {
            userId,
            creatorUrl: c.url,
            creatorName: c.name,
            maxPosts: postsPerCreator,
          },
        }))
      );
    } catch (e) {
      // Don't block onboarding on Inngest failure — log and continue. The user
      // can re-trigger by editing in /sources, and the archiver cron will pick
      // up any URLs that get inserted later.
      console.error("inngest send failed:", e);
    }
  }

  return Response.json({
    added: toAdd.length,
    total: existingLinkedIn.length + toAdd.length,
    postsPerCreator,
    scrapeQueued: toAdd.length,
  });
}
