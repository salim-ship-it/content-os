import { notFound } from "next/navigation";
import { readWinningPosts } from "@/lib/winning-posts";
import { readSources } from "@/lib/sources";
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

  const [allPosts, sources] = await Promise.all([
    readWinningPosts(),
    readSources(userId),
  ]);

  // Gate: this user must have added a LinkedIn creator whose name matches the
  // requested slug. Otherwise they can't view the dashboard.
  const userOwnsCreator = sources
    .filter((s) => s.kind === "linkedin")
    .some((s) => slugifyCreator(s.name) === slug);
  if (!userOwnsCreator) notFound();

  const creatorPosts = allPosts.filter(
    (p) => p.source === "linkedin" && slugifyCreator(p.creator) === slug,
  );

  if (creatorPosts.length === 0) notFound();

  const creator = creatorPosts[0].creator;
  const stats = analyzeCreator(creatorPosts);
  const cachedInsights = await readInsightsCache(slug);
  const profile = await readCreatorProfile(userId, slug);

  // Derive avatar from the most recent post that has one. LinkedIn signs URLs
  // with an expiry, so prefer newer posts. Fall back to per-user profile cache.
  const avatarFromPosts = [...creatorPosts]
    .sort((a, b) => b.date.localeCompare(a.date))
    .find((p) => p.authorImageUrl)?.authorImageUrl;

  return (
    <CreatorDashboard
      creator={creator}
      slug={slug}
      stats={stats}
      posts={creatorPosts}
      initialInsights={cachedInsights}
      profileImageUrl={avatarFromPosts || profile?.image_url || ""}
      headline={profile?.headline || ""}
    />
  );
}
