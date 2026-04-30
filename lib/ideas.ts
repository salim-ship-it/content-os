import { getSupabaseServer } from "@/lib/supabase-server";

export type Idea = {
  id: string;
  date: string;
  source: string;
  original: string;
  angle: string;
  format: string;
  status: string;
  priority: string;
};

export async function readIdeas(userId: string): Promise<Idea[]> {
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from("user_ideas")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (!data) return [];
  return data.map((row) => ({
    id: row.id,
    date: row.date ?? "",
    source: row.source ?? "",
    original: row.original ?? "",
    angle: row.angle ?? "",
    format: row.format ?? "",
    status: row.status ?? "raw",
    priority: row.priority ?? "medium",
  }));
}

export async function addIdea(userId: string, idea: Omit<Idea, "id">): Promise<void> {
  const supabase = await getSupabaseServer();
  await supabase.from("user_ideas").insert({
    user_id: userId,
    date: idea.date,
    source: idea.source,
    original: idea.original,
    angle: idea.angle,
    format: idea.format,
    status: idea.status,
    priority: idea.priority,
  });
}
