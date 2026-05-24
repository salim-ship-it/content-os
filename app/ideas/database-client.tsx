"use client";

import { useState, useMemo } from "react";
import type { WinningPost, SourceKind } from "@/lib/winning-posts";
import type { ContentLanguage } from "@/lib/recommended-creators";
import { getDashboardDict, type DashboardDict } from "@/lib/i18n-dashboard";

const PLATFORM_ICONS: Record<SourceKind, string> = {
  linkedin: "/icons/linkedin.svg",
  reddit: "/icons/reddit.svg",
  youtube: "/icons/youtube.svg",
  newsletter: "/icons/newsletter.svg",
};

type SourceTab = "all" | SourceKind;
const SOURCE_TABS: SourceTab[] = ["all", "linkedin", "reddit", "newsletter", "youtube"];

type DateTab = "all" | "today" | "week";
const DATE_TAB_VALUES: DateTab[] = ["today", "week", "all"];

function sourceLabel(t: DashboardDict, tab: SourceTab): string {
  switch (tab) {
    case "all": return t.ideasSourceAll;
    case "linkedin": return t.ideasSourceLinkedIn;
    case "reddit": return t.ideasSourceReddit;
    case "newsletter": return t.ideasSourceNewsletter;
    case "youtube": return t.ideasSourceYouTube;
  }
}

function dateLabel(t: DashboardDict, tab: DateTab): string {
  switch (tab) {
    case "today": return t.ideasDateToday;
    case "week": return t.ideasDateWeek;
    case "all": return t.ideasDateAll;
  }
}

function isToday(iso: string): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return false;
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function isThisWeek(iso: string): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return false;
  const diffMs = Date.now() - d.getTime();
  return diffMs >= 0 && diffMs <= 7 * 24 * 60 * 60 * 1000;
}

function extractSubreddit(creator: string): string | null {
  const m = creator.match(/^(r\/[A-Za-z0-9_]+)/);
  return m ? m[1] : null;
}

function SwipeCard({ post, onClick, t, isRtl }: { post: WinningPost; onClick: () => void; t: DashboardDict; isRtl: boolean }) {
  const previewText = post.content || post.topic || "";
  const truncated = previewText.length > 280 ? previewText.slice(0, 280) : previewText;
  const hasMore = previewText.length > 280;
  const isNew = isToday(post.createdAt);

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border cursor-pointer transition-all hover:shadow-md hover:border-[var(--vl-accent)] flex flex-col relative"
      style={{ borderColor: isNew ? "var(--vl-accent)" : "var(--vl-border)" }}
    >
      {isNew && (
        <span
          className={`absolute -top-2 ${isRtl ? "right-4" : "left-4"} px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider z-10`}
          style={{ background: "var(--vl-accent)", color: "#fff" }}
        >
          {t.ideasNewBadge}
        </span>
      )}
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
            style={{ background: "var(--vl-accent-glow)", color: "var(--vl-accent)" }}
          >
            {post.creator.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-semibold" style={{ color: "var(--vl-text-heading)" }}>
              {post.creator.replace(/\s*\(u\/.*\)/, "")}
            </div>
            <div className="text-xs" style={{ color: "var(--vl-text-muted)" }}>
              {post.date}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="px-2 py-0.5 rounded text-[10px] font-medium"
            style={{ background: "var(--vl-accent-glow)", color: "var(--vl-accent-hover)" }}
          >
            {t.ideasTypeLabel(post.type)}
          </span>
          <img
            src={PLATFORM_ICONS[post.source]}
            alt={post.source}
            width={20}
            height={20}
          />
        </div>
      </div>

      {/* Post text */}
      <div className="px-5 pb-4 flex-1">
        <div
          className="text-sm font-semibold mb-2 leading-snug"
          style={{ color: "var(--vl-text-heading)" }}
        >
          {post.title}
        </div>
        {previewText && previewText !== post.title && (
          <div className="text-sm leading-relaxed" style={{ color: "var(--vl-text)" }}>
            {truncated}
            {hasMore && (
              <span className="font-medium" style={{ color: "var(--vl-text-muted)" }}>
                {" "}{t.ideasMore}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Image */}
      {post.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.imageUrl}
          alt=""
          loading="lazy"
          className="w-full max-h-64 object-cover border-t"
          style={{ borderColor: "var(--vl-border)" }}
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
        />
      )}

      {/* Stats footer */}
      <div
        className="px-5 py-3 flex items-center gap-4 text-xs border-t"
        style={{ borderColor: "var(--vl-border)", color: "var(--vl-text-muted)" }}
      >
        <span>
          <strong style={{ color: "var(--vl-text-heading)" }}>{post.likes.toLocaleString()}</strong> {t.ideasLikes}
        </span>
        <span>
          <strong style={{ color: "var(--vl-text-heading)" }}>{post.comments.toLocaleString()}</strong> {t.ideasComments}
        </span>
        {post.source === "youtube" && post.reposts > 0 && (
          <span>
            <strong style={{ color: "var(--vl-text-heading)" }}>{post.reposts.toLocaleString()}</strong> {t.ideasViews}
          </span>
        )}
        {post.source !== "youtube" && post.reposts > 0 && (
          <span>
            <strong style={{ color: "var(--vl-text-heading)" }}>{post.reposts.toLocaleString()}</strong> {t.ideasReposts}
          </span>
        )}
      </div>
    </div>
  );
}

export function DatabaseClient({ initialPosts, language = "en" }: { initialPosts: WinningPost[]; language?: ContentLanguage }) {
  const t = getDashboardDict(language);
  const isRtl = language === "ar";
  const [sourceTab, setSourceTab] = useState<SourceTab>("all");
  const [dateTab, setDateTab] = useState<DateTab>("all");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sort, setSort] = useState<"createdAt" | "likes" | "comments" | "date">("createdAt");
  const [drawer, setDrawer] = useState<WinningPost | null>(null);

  const tabCounts = useMemo(() => {
    const c: Record<SourceTab, number> = { all: initialPosts.length, linkedin: 0, reddit: 0, newsletter: 0, youtube: 0 };
    for (const p of initialPosts) c[p.source] = (c[p.source] || 0) + 1;
    return c;
  }, [initialPosts]);

  const dateCounts = useMemo(() => {
    const c: Record<DateTab, number> = { all: initialPosts.length, today: 0, week: 0 };
    for (const p of initialPosts) {
      if (isToday(p.createdAt)) c.today += 1;
      if (isThisWeek(p.createdAt)) c.week += 1;
    }
    return c;
  }, [initialPosts]);

  const sourceFiltered = useMemo(
    () => (sourceTab === "all" ? initialPosts : initialPosts.filter((p) => p.source === sourceTab)),
    [initialPosts, sourceTab],
  );

  const dateFiltered = useMemo(() => {
    if (dateTab === "today") return sourceFiltered.filter((p) => isToday(p.createdAt));
    if (dateTab === "week") return sourceFiltered.filter((p) => isThisWeek(p.createdAt));
    return sourceFiltered;
  }, [sourceFiltered, dateTab]);

  const types = useMemo(() => [...new Set(dateFiltered.map((p) => p.type))].sort(), [dateFiltered]);

  const filtered = useMemo(() => {
    let list = dateFiltered;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.creator.toLowerCase().includes(q) ||
          p.topic.toLowerCase().includes(q) ||
          (p.content || "").toLowerCase().includes(q),
      );
    }
    if (typeFilter) list = list.filter((p) => p.type === typeFilter);
    const sorted = [...list];
    sorted.sort((a, b) => {
      if (sort === "date") return b.date.localeCompare(a.date);
      if (sort === "createdAt") return (b.createdAt || "").localeCompare(a.createdAt || "");
      return (b as unknown as Record<string, number>)[sort] - (a as unknown as Record<string, number>)[sort];
    });
    return sorted;
  }, [dateFiltered, search, typeFilter, sort]);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-[11px] uppercase tracking-[0.22em] mb-1" style={{ color: "var(--vl-accent)" }}>
            {t.ideasTagline}
          </div>
          <h1 className="text-3xl font-bold" style={{ color: "var(--vl-text-heading)" }}>{t.ideasTitle}</h1>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="px-3 py-2 rounded-lg border text-sm outline-none"
            style={{ borderColor: "var(--vl-border)", color: "var(--vl-text)" }}
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
          >
            <option value="createdAt">{t.ideasSortNewestAdded}</option>
            <option value="date">{t.ideasSortNewestPublished}</option>
            <option value="likes">{t.ideasSortMostLiked}</option>
            <option value="comments">{t.ideasSortMostDiscussed}</option>
          </select>
          <select
            className="px-3 py-2 rounded-lg border text-sm outline-none"
            style={{ borderColor: "var(--vl-border)", color: "var(--vl-text)" }}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">{t.ideasAllTypes}</option>
            {types.map((typ) => (
              <option key={typ} value={typ}>{t.ideasTypeLabel(typ)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Date tabs */}
      <div className="flex items-center gap-2 mb-3">
        {DATE_TAB_VALUES.map((tab) => (
          <button
            key={tab}
            onClick={() => setDateTab(tab)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
            style={
              dateTab === tab
                ? { background: "var(--vl-text-heading)", color: "#fff" }
                : { background: "transparent", color: "var(--vl-text-muted)", border: "1px solid var(--vl-border)" }
            }
          >
            {dateLabel(t, tab)} ({dateCounts[tab]})
          </button>
        ))}
      </div>

      {/* Source tabs */}
      <div className="flex items-center gap-2 mb-5">
        {SOURCE_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => { setSourceTab(tab); setTypeFilter(""); }}
            className="px-4 py-2 rounded-full text-sm font-medium transition-colors"
            style={
              sourceTab === tab
                ? { background: "var(--vl-accent)", color: "#fff" }
                : { background: "white", color: "var(--vl-text)", border: "1px solid var(--vl-border)" }
            }
          >
            {sourceLabel(t, tab)} ({tabCounts[tab]})
          </button>
        ))}
        <div className="flex-1" />
        <input
          className="px-4 py-2 rounded-full border text-sm outline-none w-64"
          style={{ borderColor: "var(--vl-border)", color: "var(--vl-text)" }}
          placeholder={t.ideasSearchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((post) => (
          <SwipeCard key={post.id} post={post} onClick={() => setDrawer(post)} t={t} isRtl={isRtl} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div
          className="text-center py-16 text-sm"
          style={{ color: "var(--vl-text-muted)" }}
        >
          {t.ideasEmpty}
        </div>
      )}

      <div className="mt-4 text-xs" style={{ color: "var(--vl-text-muted)" }}>
        {t.ideasCountLabel(filtered.length)}
      </div>

      {/* Drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setDrawer(null)}>
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="relative w-full max-w-lg h-full overflow-y-auto shadow-xl p-6"
            style={{ background: "#fff" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setDrawer(null)}
              className={`absolute top-4 ${isRtl ? "left-4" : "right-4"} w-8 h-8 flex items-center justify-center rounded-lg text-lg`}
              style={{ color: "var(--vl-text-muted)", border: "1px solid var(--vl-border)" }}
            >
              &times;
            </button>

            {/* Creator + platform */}
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
                style={{ background: "var(--vl-accent-glow)", color: "var(--vl-accent)" }}
              >
                {drawer.creator.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-base font-semibold" style={{ color: "var(--vl-text-heading)" }}>
                  {drawer.creator.replace(/\s*\(u\/.*\)/, "")}
                </div>
                <div className="flex items-center gap-2 text-xs" style={{ color: "var(--vl-text-muted)" }}>
                  <img src={PLATFORM_ICONS[drawer.source]} alt={drawer.source} width={16} height={16} />
                  {sourceLabel(t, drawer.source)} · {drawer.date}
                </div>
              </div>
            </div>

            {/* Type + stats */}
            <div className="flex items-center gap-3 mb-5">
              <span
                className="px-2.5 py-1 rounded text-xs font-medium"
                style={{ background: "var(--vl-accent-glow)", color: "var(--vl-accent-hover)" }}
              >
                {t.ideasTypeLabel(drawer.type)}
              </span>
              <span className="text-xs" style={{ color: "var(--vl-text-muted)" }}>
                <strong style={{ color: "var(--vl-text-heading)" }}>{drawer.likes.toLocaleString()}</strong> {t.ideasLikes}
              </span>
              <span className="text-xs" style={{ color: "var(--vl-text-muted)" }}>
                <strong style={{ color: "var(--vl-text-heading)" }}>{drawer.comments.toLocaleString()}</strong> {t.ideasComments}
              </span>
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--vl-text-heading)" }}>
              {drawer.title}
            </h2>

            {/* Full post content */}
            {drawer.content && (
              <div className="mb-5">
                <div
                  className="whitespace-pre-wrap text-sm leading-relaxed p-5 rounded-xl"
                  style={{
                    color: "var(--vl-text)",
                    background: "var(--vl-bg-card)",
                    border: "1px solid var(--vl-border)",
                  }}
                >
                  {drawer.content}
                </div>
              </div>
            )}

            {/* Post image */}
            {drawer.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={drawer.imageUrl}
                alt=""
                loading="lazy"
                className="w-full rounded-xl border mb-5"
                style={{ borderColor: "var(--vl-border)" }}
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
              />
            )}

            {/* Topic */}
            {drawer.topic && !drawer.content && (
              <div className="mb-5">
                <div className="text-sm leading-relaxed" style={{ color: "var(--vl-text)" }}>
                  {drawer.topic}
                </div>
              </div>
            )}

            {/* Why it worked */}
            {drawer.whyItWorked && (
              <div className="mb-5">
                <div className="text-[10px] uppercase tracking-wider mb-1.5 font-medium" style={{ color: "var(--vl-text-muted)" }}>
                  {t.ideasWhyItWorked}
                </div>
                <div className="text-sm leading-relaxed" style={{ color: "var(--vl-text)" }}>
                  {drawer.whyItWorked}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              {drawer.link && (
                <a
                  href={drawer.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-lg text-sm font-medium"
                  style={{ background: "var(--vl-accent)", color: "#fff" }}
                >
                  {t.ideasOpenOriginal}
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
