import { notFound } from "next/navigation";
import { readWinningPosts } from "@/lib/winning-posts";
import { slugifyCreator, analyzeCreator } from "@/lib/creator-analysis";
import { readInsightsCache } from "@/lib/creator-insights";
import { readCreatorProfile } from "@/lib/creator-profiles";
import { requireUser } from "@/lib/auth";
import { CreatorDashboard } from "./creator-dashboard";

export const dynamic = "force-dynamic";

export default async function CreatorDashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const userId = await requireUser();
  const { slug } = await params;
  const allPosts = await readWinningPosts();
  const creatorPosts = allPosts.filter(
    (p) => p.source === "linkedin" && slugifyCreator(p.creator) === slug,
  );

  if (creatorPosts.length === 0) notFound();

  const creator = creatorPosts[0].creator;
  const stats = analyzeCreator(creatorPosts);
  const cachedInsights = await readInsightsCache(slug);
  const profile = await readCreatorProfile(userId, slug);

  return (
    <CreatorDashboard
      creator={creator}
      slug={slug}
      stats={stats}
      posts={creatorPosts}
      initialInsights={cachedInsights}
      profileImageUrl={profile?.image_url || ""}
      headline={profile?.headline || ""}
    />
  );
}
