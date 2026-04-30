import { readWinningPosts } from "@/lib/winning-posts";
import { requireUser } from "@/lib/auth";
import { DatabaseClient } from "./database-client";
export const dynamic = "force-dynamic";
export default async function InboxPage() {
  await requireUser();
  const posts = await readWinningPosts();
  return <DatabaseClient initialPosts={posts} />;
}
