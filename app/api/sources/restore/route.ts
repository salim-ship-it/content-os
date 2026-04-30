import { requireUser } from "@/lib/auth";
import { readSources, writeSources } from "@/lib/sources";
import { DEFAULT_SOURCES } from "@/lib/default-sources";

// POST /api/sources/restore
// Inserts the default 35-source watchlist for the logged-in user.
// Merges with existing sources (by URL) so nothing they've added manually is lost.
export async function POST() {
  const userId = await requireUser();
  const existing = await readSources(userId);

  const byUrl = new Map(existing.map((s) => [s.url, s]));
  for (const def of DEFAULT_SOURCES) {
    if (!byUrl.has(def.url)) byUrl.set(def.url, def);
  }

  const merged = Array.from(byUrl.values());
  await writeSources(userId, merged);

  return Response.json({
    ok: true,
    restored: merged.length - existing.length,
    total: merged.length,
  });
}
