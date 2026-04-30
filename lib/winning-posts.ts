import { getSupabase } from "./supabase";

export type SourceKind = "linkedin" | "reddit" | "newsletter" | "youtube";

export type WinningPost = {
  id: string;
  source: SourceKind;
  type: string;
  title: string;
  creator: string;
  date: string;
  createdAt: string;
  likes: number;
  comments: number;
  reposts: number;
  topic: string;
  whyItWorked: string;
  link: string;
  content: string;
  imageUrl: string;
};

export async function readWinningPosts(): Promise<WinningPost[]> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("content_posts")
    .select("*")
    .order("likes", { ascending: false })
    .limit(2000);

  if (error) { console.error("Supabase error:", error.message); return []; }

  return (data || []).map((row: Record<string, unknown>) => ({
    id: String(row.id || ""),
    source: String(row.source || "linkedin") as SourceKind,
    type: String(row.type || "engagement"),
    title: String(row.title || ""),
    creator: String(row.creator || ""),
    date: String(row.date || ""),
    createdAt: String(row.created_at || ""),
    likes: Number(row.likes || 0),
    comments: Number(row.comments || 0),
    reposts: Number(row.reposts || 0),
    topic: String(row.topic || ""),
    whyItWorked: String(row.why_it_worked || ""),
    link: String(row.link || ""),
    content: String(row.content || ""),
    imageUrl: String(row.image_url || ""),
  }));
}
