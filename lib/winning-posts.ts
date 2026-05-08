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
  authorImageUrl: string;
};

function mapPost(row: Record<string, unknown>): WinningPost {
  return {
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
    authorImageUrl: String(row.author_image_url || ""),
  };
}

export async function readWinningPosts(): Promise<WinningPost[]> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("content_posts")
    .select("*")
    .order("likes", { ascending: false })
    .limit(2000);

  if (error) { console.error("Supabase error:", error.message); return []; }
  return (data || []).map(mapPost);
}

// Fetch all LinkedIn posts for a specific set of creator names.
// Used by the swipe file page so newly-added creators with low like counts
// aren't cut off by the global 2000-post limit.
export async function readPostsByCreators(creatorNames: string[]): Promise<WinningPost[]> {
  if (creatorNames.length === 0) return [];
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("content_posts")
    .select("*")
    .eq("source", "linkedin")
    .in("creator", creatorNames)
    .order("likes", { ascending: false });

  if (error) { console.error("Supabase error:", error.message); return []; }
  return (data || []).map(mapPost);
}
