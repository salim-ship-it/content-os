import { type NextRequest } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { requireUser } from "@/lib/auth";

export async function GET() {
  await requireUser();
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("content_posts")
    .select("*")
    .eq("source", "lead-magnet")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ posts: data || [] });
}

async function scrapeLinkedInPost(postUrl: string): Promise<{
  title: string;
  content: string;
  creator: string;
  imageUrl: string;
}> {
  const res = await fetch(postUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      Accept: "text/html",
    },
    redirect: "follow",
  });

  if (!res.ok) return { title: "", content: "", creator: "", imageUrl: "" };

  const html = await res.text();

  function meta(property: string): string {
    const patterns = [
      new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, "i"),
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, "i"),
      new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`, "i"),
    ];
    for (const p of patterns) {
      const m = html.match(p);
      if (m) return decodeEntities(m[1]);
    }
    return "";
  }

  const title = meta("og:title");
  const content = meta("og:description");
  const imageUrl = meta("og:image");

  let creator = "";
  const authorMatch = title.match(/^(.+?)\s+(?:on LinkedIn|posted on)/i);
  if (authorMatch) creator = authorMatch[1].trim();

  return { title, content, creator, imageUrl };
}

function decodeEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&apos;/g, "'");
}

export async function POST(request: NextRequest) {
  await requireUser();
  const body = await request.json().catch(() => null);
  if (!body || typeof body.url !== "string" || !body.url.trim()) {
    return Response.json({ error: "url is required" }, { status: 400 });
  }

  const postUrl = body.url.trim();
  const notes = typeof body.notes === "string" ? body.notes.trim() : "";

  const supabase = await getSupabase();
  const { data: existing } = await supabase
    .from("content_posts")
    .select("id")
    .eq("link", postUrl)
    .eq("source", "lead-magnet")
    .limit(1);
  if (existing && existing.length > 0) {
    return Response.json({ error: "Already saved" }, { status: 409 });
  }

  const scraped = await scrapeLinkedInPost(postUrl);

  const firstLine =
    scraped.content
      .split("\n")
      .map((s: string) => s.trim())
      .find((s: string) => s.length > 0) || "";

  const row = {
    source: "lead-magnet",
    type: "lead-magnet",
    title: (firstLine || scraped.title || notes || postUrl).slice(0, 500),
    creator: scraped.creator,
    date: new Date().toISOString().slice(0, 10),
    likes: 0,
    comments: 0,
    reposts: 0,
    topic: notes,
    why_it_worked: "",
    link: postUrl,
    content: scraped.content,
    image_url: scraped.imageUrl,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: inserted, error } = await (supabase as any)
    .from("content_posts")
    .insert(row)
    .select("id")
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ id: inserted.id, row });
}

export async function DELETE(request: NextRequest) {
  await requireUser();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return Response.json({ error: "id is required" }, { status: 400 });
  const supabase = await getSupabase();
  await supabase.from("content_posts").delete().eq("id", id).eq("source", "lead-magnet");
  return Response.json({ ok: true });
}
