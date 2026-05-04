import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { requireUser } from "@/lib/auth";

export async function GET() {
  const userId = await requireUser();
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("published_posts")
    .select("*")
    .eq("user_id", userId)
    .order("published_date", { ascending: false })
    .limit(500);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(request: Request) {
  const userId = await requireUser();
  const body = await request.json();
  const supabase = await getSupabase();

  const row = {
    user_id: userId,
    title: body.title,
    content: body.content || null,
    published_date: body.published_date,
    post_url: body.post_url || null,
    post_type: body.post_type || null,
    impressions: Number(body.impressions || 0),
    likes: Number(body.likes || 0),
    comments: Number(body.comments || 0),
    reposts: Number(body.reposts || 0),
    saves: Number(body.saves || 0),
    new_followers: Number(body.new_followers || 0),
    profile_visits: Number(body.profile_visits || 0),
    score: body.score ? Number(body.score) : null,
    notes: body.notes || null,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query = (supabase as any).from("published_posts");
  const { error } = row.post_url
    ? await query.upsert(row, { onConflict: "post_url" })
    : await query.insert(row);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request) {
  const userId = await requireUser();
  const body = await request.json();
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const supabase = await getSupabase();
  const { id, ...updates } = body;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("published_posts")
    .update(updates)
    .eq("id", id)
    .eq("user_id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
