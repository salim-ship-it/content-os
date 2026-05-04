import { readWinningPosts } from "@/lib/winning-posts";
import { readSources } from "@/lib/sources";
import { requireUser } from "@/lib/auth";
import { SwipeFileClient } from "./swipe-file-client";
export const dynamic = "force-dynamic";
export default async function SwipeFilePage() {
  const userId = await requireUser();
  const [allPosts, sources] = await Promise.all([
    readWinningPosts(),
    readSources(userId),
  ]);
  // Only show posts from creators the user has actually added in onboarding /
  // sources. Match on creator name (case-insensitive).
  const userCreatorNames = new Set(
    sources
      .filter((s) => s.kind === "linkedin")
      .map((s) => s.name.trim().toLowerCase())
  );
  const linkedinPosts = allPosts.filter(
    (p) =>
      p.source === "linkedin" &&
      p.content &&
      userCreatorNames.has((p.creator || "").trim().toLowerCase())
  );
  return <SwipeFileClient posts={linkedinPosts} />;
}
