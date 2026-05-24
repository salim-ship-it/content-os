import { readWinningPosts } from "@/lib/winning-posts";
import { readSources, scopePostsToUserSources } from "@/lib/sources";
import { requireUser } from "@/lib/auth";
import { getUserLanguage } from "@/lib/get-user-language";
import { DatabaseClient } from "./database-client";
export const dynamic = "force-dynamic";
export default async function InboxPage() {
  const userId = await requireUser();
  const [allPosts, sources, language] = await Promise.all([
    readWinningPosts(),
    readSources(userId),
    getUserLanguage(),
  ]);
  const posts = scopePostsToUserSources(allPosts, sources);
  return <DatabaseClient initialPosts={posts} language={language} />;
}
