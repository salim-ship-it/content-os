import { requireUser } from "@/lib/auth";
import { readSources } from "@/lib/sources";
import { inngest } from "@/lib/inngest";

// One-shot endpoint: re-fires the matching scrape event for every source the
// caller already has. Idempotent — the underlying Inngest functions de-dupe by
// link before inserting, so running this twice does no harm.
//
// Usage: POST /api/sources/rescan
export async function POST() {
  const userId = await requireUser();
  const sources = await readSources(userId);

  const events = [];
  for (const s of sources) {
    if (!s.enabled) continue;
    if (s.kind === "linkedin" && s.url) {
      events.push({
        name: "creator/added" as const,
        data: {
          userId,
          creatorUrl: s.url,
          creatorName: s.name,
          maxPosts: s.maxPosts || 20,
        },
      });
    } else if (s.kind === "reddit" && s.name) {
      events.push({
        name: "reddit/added" as const,
        data: { userId, subredditName: s.name },
      });
    }
    // newsletter, youtube: no scraper yet, skip
  }

  if (events.length === 0) {
    return Response.json({ queued: 0, message: "No scrape-able sources." });
  }

  try {
    await inngest.send(events);
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "inngest send failed" },
      { status: 500 }
    );
  }

  return Response.json({
    queued: events.length,
    breakdown: {
      linkedin: events.filter((e) => e.name === "creator/added").length,
      reddit: events.filter((e) => e.name === "reddit/added").length,
    },
  });
}
