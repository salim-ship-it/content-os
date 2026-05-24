import { readPostsByCreators } from "@/lib/winning-posts";
import { readSources } from "@/lib/sources";
import { requireUser } from "@/lib/auth";
import { getUserLanguage } from "@/lib/get-user-language";
import { SwipeFileClient } from "./swipe-file-client";
export const dynamic = "force-dynamic";

export default async function SwipeFilePage() {
  const userId = await requireUser();
  const [sources, language] = await Promise.all([
    readSources(userId),
    getUserLanguage(),
  ]);

  const creatorNames = sources
    .filter((s) => s.kind === "linkedin")
    .map((s) => s.name.trim());

  const posts = await readPostsByCreators(creatorNames);

  return <SwipeFileClient posts={posts} language={language} />;
}
