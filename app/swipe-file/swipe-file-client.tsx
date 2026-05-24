"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { WinningPost } from "@/lib/winning-posts";
import { slugifyCreator } from "@/lib/creator-analysis";
import type { ContentLanguage } from "@/lib/recommended-creators";
import { getDashboardDict, type DashboardDict } from "@/lib/i18n-dashboard";

type CreatorSummary = {
  creator: string;
  slug: string;
  postCount: number;
  avgLikes: number;
  totalLikes: number;
  bestLikes: number;
  coverImage: string;
  dateRange: { from: string; to: string };
};

function summarizeCreators(posts: WinningPost[]): CreatorSummary[] {
  const byCreator = new Map<string, WinningPost[]>();
  for (const p of posts) {
    if (!byCreator.has(p.creator)) byCreator.set(p.creator, []);
    byCreator.get(p.creator)!.push(p);
  }

  const summaries: CreatorSummary[] = [];
  for (const [creator, items] of byCreator) {
    const likes = items.map((p) => p.likes);
    const totalLikes = likes.reduce((s, n) => s + n, 0);
    const avgLikes = Math.round(totalLikes / items.length);
    const bestLikes = Math.max(...likes, 0);
    const withImage = items.filter((p) => p.imageUrl);
    const coverPost = withImage
      .slice()
      .sort((a, b) => b.likes - a.likes)[0];
    const dates = items.map((p) => p.date).filter(Boolean).sort();
    summaries.push({
      creator,
      slug: slugifyCreator(creator),
      postCount: items.length,
      avgLikes,
      totalLikes,
      bestLikes,
      coverImage: coverPost?.imageUrl || "",
      dateRange: { from: dates[0] || "", to: dates[dates.length - 1] || "" },
    });
  }
  return summaries.sort((a, b) => b.postCount - a.postCount);
}

function CoverPlaceholder({ creator }: { creator: string }) {
  const letter = (creator || "?").charAt(0).toUpperCase();
  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{
        background:
          "linear-gradient(135deg, var(--vl-accent-glow) 0%, rgba(249,115,22,0.04) 100%)",
      }}
    >
      <span
        className="text-7xl font-black select-none"
        style={{ color: "rgba(249,115,22,0.25)" }}
      >
        {letter}
      </span>
    </div>
  );
}

function CreatorTile({ summary, t, isRtl }: { summary: CreatorSummary; t: DashboardDict; isRtl: boolean }) {
  return (
    <Link
      href={`/swipe-file/${summary.slug}`}
      className="bg-white rounded-xl border cursor-pointer transition-all hover:shadow-lg hover:border-[var(--vl-accent)] flex flex-col overflow-hidden group"
      style={{ borderColor: "var(--vl-border)" }}
    >
      {/* Cover */}
      <div className="relative w-full aspect-[4/3] overflow-hidden" style={{ background: "var(--vl-bg-card)" }}>
        {summary.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={summary.coverImage}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover transition-transform group-hover:scale-[1.02]"
            onError={(e) => {
              const el = e.currentTarget as HTMLImageElement;
              el.style.display = "none";
              const sibling = el.nextElementSibling as HTMLElement | null;
              if (sibling) sibling.style.display = "flex";
            }}
          />
        ) : null}
        <div style={{ display: summary.coverImage ? "none" : "flex" }} className="absolute inset-0">
          <CoverPlaceholder creator={summary.creator} />
        </div>
        <span
          className={`absolute top-2.5 ${isRtl ? "left-2.5" : "right-2.5"} px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm`}
          style={{ background: "rgba(255,255,255,0.92)", color: "var(--vl-accent-hover)" }}
        >
          {t.swipePostsBadge(summary.postCount)}
        </span>
      </div>

      {/* Body */}
      <div className="px-4 pt-3 pb-4 flex flex-col gap-1">
        <div
          className="text-base font-bold leading-tight"
          style={{ color: "var(--vl-text-heading)" }}
        >
          {summary.creator}
        </div>
        <div className="flex items-center gap-2 text-xs" style={{ color: "var(--vl-text-muted)" }}>
          <span>
            <strong style={{ color: "var(--vl-text-heading)" }}>
              {summary.avgLikes.toLocaleString()}
            </strong>{" "}
            {t.swipeAvgLikes}
          </span>
          <span>·</span>
          <span>
            {t.swipeBest}{" "}
            <strong style={{ color: "var(--vl-text-heading)" }}>
              {summary.bestLikes.toLocaleString()}
            </strong>
          </span>
        </div>
        {summary.dateRange.from && (
          <div className="text-[10px] mt-1" style={{ color: "var(--vl-text-muted)" }}>
            {summary.dateRange.from} → {summary.dateRange.to}
          </div>
        )}
      </div>
    </Link>
  );
}

export function SwipeFileClient({ posts, language = "en" }: { posts: WinningPost[]; language?: ContentLanguage }) {
  const t = getDashboardDict(language);
  const isRtl = language === "ar";
  const [search, setSearch] = useState("");

  const summaries = useMemo(() => summarizeCreators(posts), [posts]);

  const filtered = useMemo(() => {
    if (!search.trim()) return summaries;
    const q = search.toLowerCase();
    return summaries.filter((s) => s.creator.toLowerCase().includes(q));
  }, [summaries, search]);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-[11px] uppercase tracking-[0.22em] mb-1" style={{ color: "var(--vl-accent)" }}>
            {t.swipeTagline}
          </div>
          <h1 className="text-3xl font-bold" style={{ color: "var(--vl-text-heading)" }}>
            {t.swipeTitle}
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--vl-text-muted)" }}>
            {t.swipeSubtitle(summaries.length, posts.length)}
          </p>
        </div>
        <input
          className="px-4 py-2 rounded-full border text-sm outline-none w-64"
          style={{ borderColor: "var(--vl-border)", color: "var(--vl-text)" }}
          placeholder={t.swipeSearchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Creator tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filtered.map((summary) => (
          <CreatorTile key={summary.slug} summary={summary} t={t} isRtl={isRtl} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-sm" style={{ color: "var(--vl-text-muted)" }}>
          {t.swipeEmpty}
        </div>
      )}
    </div>
  );
}
