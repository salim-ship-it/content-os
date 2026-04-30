import { readWinningPosts } from "@/lib/winning-posts";
import { requireUser } from "@/lib/auth";
import { SwipeFileClient } from "./swipe-file-client";
export const dynamic = "force-dynamic";
export default async function SwipeFilePage() {
  await requireUser();
  const allPosts = await readWinningPosts();
  const linkedinPosts = allPosts.filter((p) => p.source === "linkedin" && p.content);
  return <SwipeFileClient posts={linkedinPosts} />;
}
