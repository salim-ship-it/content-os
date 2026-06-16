import { getSupabaseServer } from "@/lib/supabase-server";
import type { WinningPost } from "@/lib/winning-posts";

export type SourceKind = "linkedin" | "reddit" | "instagram" | "youtube";

/**
 * Filter posts down to ones from sources the user actually added.
 * - linkedin / instagram / youtube: exact creator-name match (case-insensitive).
 * - reddit: prefix match — creator field is "r/Sub (u/User)", source name is "r/Sub".
 *
 * If the user has no sources of a given kind, no posts of that kind pass.
 */
export function scopePostsToUserSources(
  posts: WinningPost[],
  sources: Source[],
): WinningPost[] {
  const norm = (s: string) => s.trim().toLowerCase();
  const exactByKind: Record<SourceKind, Set<string>> = {
    linkedin: new Set(),
    reddit: new Set(),
    instagram: new Set(),
    youtube: new Set(),
  };
  for (const s of sources) {
    if (!s.enabled) continue;
    exactByKind[s.kind].add(norm(s.name));
  }

  return posts.filter((p) => {
    const creator = norm(p.creator || "");
    if (!creator) return false;
    const targets = exactByKind[p.source];
    if (!targets || targets.size === 0) return false;
    if (p.source === "reddit") {
      for (const name of targets) {
        if (creator === name || creator.startsWith(name + " ")) return true;
      }
      return false;
    }
    return targets.has(creator);
  });
}

export type Source = {
  id?: string;
  kind: SourceKind;
  name: string;
  url: string;
  enabled: boolean;
  maxPosts: number;
  note?: string;
};

export async function readSources(userId: string): Promise<Source[]> {
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from("user_sources")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (!data) return [];
  return data.map((row) => ({
    id: row.id,
    kind: row.kind as SourceKind,
    name: row.name,
    url: row.url,
    enabled: row.enabled,
    maxPosts: row.max_posts,
    note: row.note ?? undefined,
  }));
}

export async function writeSources(userId: string, sources: Source[]): Promise<void> {
  const supabase = await getSupabaseServer();
  await supabase.from("user_sources").delete().eq("user_id", userId);
  if (sources.length > 0) {
    await supabase.from("user_sources").insert(
      sources.map((s) => ({
        user_id: userId,
        kind: s.kind,
        name: s.name,
        url: s.url,
        enabled: s.enabled,
        max_posts: s.maxPosts,
        note: s.note ?? null,
      }))
    );
  }
}

export async function addSource(userId: string, source: Source): Promise<Source[]> {
  const supabase = await getSupabaseServer();
  await supabase.from("user_sources").insert({
    user_id: userId,
    kind: source.kind,
    name: source.name,
    url: source.url,
    enabled: source.enabled,
    max_posts: source.maxPosts,
    note: source.note ?? null,
  });
  return readSources(userId);
}

export async function removeSource(userId: string, url: string): Promise<Source[]> {
  const supabase = await getSupabaseServer();
  await supabase.from("user_sources").delete().eq("user_id", userId).eq("url", url);
  return readSources(userId);
}

export async function updateSource(userId: string, url: string, patch: Partial<Source>): Promise<Source[]> {
  const supabase = await getSupabaseServer();
  const updates: Record<string, unknown> = {};
  if (patch.kind !== undefined) updates.kind = patch.kind;
  if (patch.name !== undefined) updates.name = patch.name;
  if (patch.url !== undefined) updates.url = patch.url;
  if (patch.enabled !== undefined) updates.enabled = patch.enabled;
  if (patch.maxPosts !== undefined) updates.max_posts = patch.maxPosts;
  if (patch.note !== undefined) updates.note = patch.note;
  await supabase.from("user_sources").update(updates).eq("user_id", userId).eq("url", url);
  return readSources(userId);
}
