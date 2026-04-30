import { readWinningPosts } from "@/lib/winning-posts";
import { requireUser } from "@/lib/auth";

export async function GET() {
  await requireUser();
  const posts = await readWinningPosts();
  return Response.json(posts);
}
