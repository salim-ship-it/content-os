import { readPostsByCreators } from "@/lib/winning-posts";
import { readSources } from "@/lib/sources";
import { requireUser } from "@/lib/auth";
import { SwipeFileClient } from "./swipe-file-client";
export const dynamic = "force-dynamic";

export default async function SwipeFilePage() {
  const userId = await requireUser();
  const sources = await readSources(userId);

  const creatorNames = sources
    .filter((s) => s.kind === "linkedin")
    .map((s) => s.name.trim());

  const posts = await readPostsByCreators(creatorNames);

  return <SwipeFileClient posts={posts} />;
}
