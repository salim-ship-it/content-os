import { getSupabaseServer } from "@/lib/supabase-server";

export type SourceKind = "linkedin" | "reddit" | "newsletter" | "youtube";

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
