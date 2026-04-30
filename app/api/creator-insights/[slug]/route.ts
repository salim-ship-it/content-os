import { type NextRequest } from "next/server";
import { readWinningPosts } from "@/lib/winning-posts";
import { slugifyCreator } from "@/lib/creator-analysis";
import { generateInsights, readInsightsCache } from "@/lib/creator-insights";
import { requireUser } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  await requireUser();
  const { slug } = await params;
  const cache = await readInsightsCache(slug);
  if (!cache) return Response.json({ cache: null });
  return Response.json({ cache });
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  await requireUser();
  const { slug } = await params;
  const allPosts = await readWinningPosts();
  const posts = allPosts.filter(
    (p) => p.source === "linkedin" && slugifyCreator(p.creator) === slug,
  );
  if (posts.length === 0) {
    return Response.json({ error: "No posts found for creator" }, { status: 404 });
  }
  try {
    const cache = await generateInsights(posts[0].creator, slug, posts);
    return Response.json({ cache });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
