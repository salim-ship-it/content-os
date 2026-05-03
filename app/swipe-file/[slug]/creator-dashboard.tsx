"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { WinningPost } from "@/lib/winning-posts";
import type { CreatorStats } from "@/lib/creator-analysis";
import type { CreatorInsightsCache } from "@/lib/creator-insights";
import { getCreatorPhoto } from "@/lib/recommended-creators";

type TabKey = "overview" | "posts" | "keywords" | "patterns" | "insights";
const TABS: { key: TabKey; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "posts", label: "Posts" },
  { key: "keywords", label: "Keywords" },
  { key: "patterns", label: "Hooks & formats" },
  { key: "insights", label: "Strategic insights" },
];

export function CreatorDashboard({
  creator,
  slug,
  stats,
  posts,
  initialInsights,
  profileImageUrl,
  headline,
}: {
  creator: string;
  slug: string;
  stats: CreatorStats;
  posts: WinningPost[];
  initialInsights: CreatorInsightsCache | null;
  profileImageUrl?: string;
  headline?: string;
}) {
  const [tab, setTab] = useState<TabKey>("overview");
  const [sortKey, setSortKey] = useState<"likes" | "comments" | "date">("likes");
  const [showAll, setShowAll] = useState(false);
  const [insights, setInsights] = useState<CreatorInsightsCache | null>(initialInsights);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);

  const sortedPosts = useMemo(() => {
    const copy = [...posts];
    copy.sort((a, b) => {
      if (sortKey === "date") return b.date.localeCompare(a.date);
      return (b[sortKey] as number) - (a[sortKey] as number);
    });
    return copy;
  }, [posts, sortKey]);

  const visiblePosts = showAll ? sortedPosts : sortedPosts.slice(0, 12);

  async function generateInsights() {
    setLoadingInsights(true);
    setInsightsError(null);
    try {
      const res = await fetch(`/api/creator-insights/${slug}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate");
      setInsights(data.cache);
    } catch (e) {
      setInsightsError(e instanceof Error ? e.message : "Failed to generate");
    } finally {
      setLoadingInsights(false);
    }
  }

  return (
    <div className="max-w-6xl">
      {/* Back link */}
      <Link
        href="/swipe-file"
        className="inline-flex items-center gap-1 text-sm font-semibold mb-4"
        style={{ color: "var(--vl-accent)" }}
      >
        ← Back to swipe file
      </Link>

      {/* Hero */}
      <div className="mb-6 flex items-center gap-5">
        {profileImageUrl ? (
          <div
            className="w-16 h-16 rounded-full overflow-hidden shrink-0 border-2"
            style={{ borderColor: "var(--vl-accent)" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={profileImageUrl}
              alt={creator}
              className="w-full h-full object-cover"
              onError={(e) => {
                const el = e.currentTarget as HTMLImageElement;
                el.style.display = "none";
                const fallback = el.parentElement?.nextElementSibling as HTMLElement | null;
                if (fallback) fallback.style.display = "flex";
              }}
            />
          </div>
        ) : null}
        <div
          style={{ display: profileImageUrl ? "none" : "flex" }}
          className="w-16 h-16 rounded-full items-center justify-center text-2xl font-black shrink-0"
        >
          <div
            className="w-full h-full rounded-full flex items-center justify-center"
            style={{ background: "var(--vl-accent-glow)", color: "var(--vl-accent)" }}
          >
            {creator.charAt(0).toUpperCase()}
          </div>
        </div>
        <div>
          <div
            className="text-[11px] uppercase tracking-[0.22em] mb-1"
            style={{ color: "var(--vl-accent)" }}
          >
            Creator dashboard
          </div>
          <h1 className="text-3xl font-bold" style={{ color: "var(--vl-text-heading)" }}>
            {creator}
          </h1>
          {headline && (
            <p className="text-xs mt-0.5" style={{ color: "var(--vl-text-muted)" }}>
              {headline}
            </p>
          )}
          {stats.dateRange.from && (
            <p className="text-sm mt-1" style={{ color: "var(--vl-text-muted)" }}>
              {stats.totalPosts} posts · {stats.dateRange.from} → {stats.dateRange.to}
            </p>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div
        className="flex items-center gap-1 mb-8 border-b"
        style={{ borderColor: "var(--vl-border)" }}
      >
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="px-4 py-3 text-sm font-semibold transition-colors relative -mb-px"
              style={{
                color: active ? "var(--vl-accent)" : "var(--vl-text-muted)",
                borderBottom: active
                  ? "2px solid var(--vl-accent)"
                  : "2px solid transparent",
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "overview" && <OverviewTab stats={stats} />}
      {tab === "posts" && (
        <PostsTab
          sortedPosts={sortedPosts}
          visiblePosts={visiblePosts}
          sortKey={sortKey}
          setSortKey={setSortKey}
          totalCount={posts.length}
          showAll={showAll}
          setShowAll={setShowAll}
        />
      )}
      {tab === "keywords" && <KeywordsTab stats={stats} />}
      {tab === "patterns" && <PatternsTab stats={stats} />}
      {tab === "insights" && (
        <InsightsTab
          insights={insights}
          loading={loadingInsights}
          error={insightsError}
          onGenerate={generateInsights}
        />
      )}
    </div>
  );
}

/* ───────── Tab components ───────── */

type ChartRow = {
  label: string;
  count: number;
  avgLikes: number;
};

function BarChart({
  rows,
  metric = "avgLikes",
  unit = "avg likes",
}: {
  rows: ChartRow[];
  metric?: "avgLikes" | "count";
  unit?: string;
}) {
  if (rows.length === 0) {
    return (
      <p className="text-xs italic" style={{ color: "var(--vl-text-muted)" }}>
        Not enough data.
      </p>
    );
  }
  const values = rows.map((r) => (metric === "avgLikes" ? r.avgLikes : r.count));
  const max = Math.max(...values, 1);
  const bestIdx = values.indexOf(Math.max(...values));

  return (
    <div className="flex flex-col gap-2.5">
      {rows.map((row, i) => {
        const value = metric === "avgLikes" ? row.avgLikes : row.count;
        const width = (value / max) * 100;
        const isBest = i === bestIdx;
        return (
          <div key={row.label}>
            <div className="flex items-baseline justify-between text-xs mb-1">
              <span
                className="font-medium"
                style={{ color: isBest ? "var(--vl-text-heading)" : "var(--vl-text)" }}
              >
                {row.label}
              </span>
              <span style={{ color: "var(--vl-text-muted)" }}>
                <strong style={{ color: "var(--vl-text-heading)" }}>
                  {value.toLocaleString()}
                </strong>{" "}
                {unit} · {row.count} post{row.count === 1 ? "" : "s"}
              </span>
            </div>
            <div
              className="h-2.5 rounded-full overflow-hidden"
              style={{ background: "var(--vl-bg-card)" }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.max(2, width)}%`,
                  background: isBest
                    ? "var(--vl-accent)"
                    : "linear-gradient(90deg, rgba(249,115,22,0.55), rgba(249,115,22,0.35))",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FaceOff({
  title,
  a,
  b,
}: {
  title: string;
  a: { label: string; count: number; avgLikes: number };
  b: { label: string; count: number; avgLikes: number };
}) {
  const max = Math.max(a.avgLikes, b.avgLikes, 1);
  const aWins = a.avgLikes >= b.avgLikes;
  const lift =
    Math.min(a.avgLikes, b.avgLikes) > 0
      ? (Math.max(a.avgLikes, b.avgLikes) / Math.min(a.avgLikes, b.avgLikes)).toFixed(1)
      : null;

  function row(side: { label: string; count: number; avgLikes: number }, isWinner: boolean) {
    const width = (side.avgLikes / max) * 100;
    return (
      <div>
        <div className="flex items-baseline justify-between text-xs mb-1">
          <span
            className="font-semibold"
            style={{ color: isWinner ? "var(--vl-text-heading)" : "var(--vl-text-muted)" }}
          >
            {side.label}
          </span>
          <span style={{ color: "var(--vl-text-muted)" }}>
            <strong style={{ color: "var(--vl-text-heading)" }}>
              {side.avgLikes.toLocaleString()}
            </strong>{" "}
            avg · {side.count} posts
          </span>
        </div>
        <div
          className="h-3 rounded-full overflow-hidden"
          style={{ background: "var(--vl-bg-card)" }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.max(2, width)}%`,
              background: isWinner ? "var(--vl-accent)" : "rgba(100,116,139,0.35)",
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl border p-4"
      style={{ borderColor: "var(--vl-border)", background: "white" }}
    >
      <div className="flex items-baseline justify-between mb-3">
        <div
          className="text-[11px] uppercase tracking-wider font-bold"
          style={{ color: "var(--vl-text-muted)" }}
        >
          {title}
        </div>
        {lift && lift !== "1.0" && (
          <div className="text-[11px] font-bold" style={{ color: "var(--vl-accent-hover)" }}>
            {lift}× lift
          </div>
        )}
      </div>
      <div className="flex flex-col gap-3">
        {row(a, aWins)}
        {row(b, !aWins)}
      </div>
    </div>
  );
}

function HeadlineStat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div
      className="rounded-xl border px-4 py-3 flex flex-col"
      style={{ borderColor: "var(--vl-border)", background: "white" }}
    >
      <div
        className="text-[10px] uppercase tracking-wider font-medium mb-1"
        style={{ color: "var(--vl-text-muted)" }}
      >
        {label}
      </div>
      <div className="text-2xl font-bold" style={{ color: "var(--vl-text-heading)" }}>
        {value}
      </div>
      {sub && (
        <div className="text-[11px]" style={{ color: "var(--vl-text-muted)" }}>
          {sub}
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div
      className="bg-white rounded-2xl border p-5"
      style={{ borderColor: "var(--vl-border)" }}
    >
      <div
        className="text-[10px] uppercase tracking-wider mb-2 font-medium"
        style={{ color: "var(--vl-text-muted)" }}
      >
        {label}
      </div>
      <div className="text-3xl font-bold" style={{ color: "var(--vl-text-heading)" }}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      {sub && (
        <div className="text-xs mt-1" style={{ color: "var(--vl-text-muted)" }}>
          {sub}
        </div>
      )}
    </div>
  );
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} style={{ color: "var(--vl-accent-hover)" }}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function OverviewTab({ stats }: { stats: CreatorStats }) {
  return (
    <div>
      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total posts" value={stats.totalPosts} />
        <StatCard label="Avg likes" value={stats.avgLikes} />
        <StatCard label="Avg comments" value={stats.avgComments} />
        <StatCard
          label="Best post"
          value={stats.bestPost ? stats.bestPost.likes.toLocaleString() : "—"}
          sub="likes"
        />
      </div>

      {/* Auto-generated insights */}
      {stats.insights.length > 0 && (
        <div
          className="rounded-2xl border p-6 mb-8"
          style={{ borderColor: "var(--vl-accent)", background: "var(--vl-accent-glow)" }}
        >
          <div
            className="text-[10px] uppercase tracking-wider font-bold mb-3"
            style={{ color: "var(--vl-accent-hover)" }}
          >
            What made them go viral
          </div>
          <ul className="flex flex-col gap-2">
            {stats.insights.map((text, i) => (
              <li
                key={i}
                className="text-sm leading-relaxed"
                style={{ color: "var(--vl-text)" }}
              >
                {renderInline(text)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Best post callout */}
      {stats.bestPost && (
        <div
          className="rounded-2xl border p-6"
          style={{ borderColor: "var(--vl-border)", background: "white" }}
        >
          <div
            className="text-[10px] uppercase tracking-wider font-bold mb-3"
            style={{ color: "var(--vl-text-muted)" }}
          >
            🏆 Top post · {stats.bestPost.likes.toLocaleString()} likes ·{" "}
            {stats.bestPost.comments.toLocaleString()} comments
          </div>
          <div
            className="text-base font-semibold mb-3 leading-snug"
            style={{ color: "var(--vl-text-heading)" }}
          >
            {stats.bestPost.content.split("\n")[0]}
          </div>
          <div
            className="text-sm leading-relaxed line-clamp-5 whitespace-pre-line"
            style={{ color: "var(--vl-text)" }}
          >
            {stats.bestPost.content.split("\n").slice(1).join("\n")}
          </div>
          {stats.bestPost.link && (
            <a
              href={stats.bestPost.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-4 text-sm font-semibold"
              style={{ color: "var(--vl-accent)" }}
            >
              Open on LinkedIn →
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function PostsTab({
  sortedPosts,
  visiblePosts,
  sortKey,
  setSortKey,
  totalCount,
  showAll,
  setShowAll,
}: {
  sortedPosts: WinningPost[];
  visiblePosts: WinningPost[];
  sortKey: "likes" | "comments" | "date";
  setSortKey: (k: "likes" | "comments" | "date") => void;
  totalCount: number;
  showAll: boolean;
  setShowAll: (v: boolean) => void;
}) {
  void sortedPosts;
  return (
    <div>
      <div className="flex items-baseline justify-between mb-4">
        <p className="text-sm" style={{ color: "var(--vl-text-muted)" }}>
          {totalCount} posts ranked by {sortKey === "date" ? "newest" : "most " + sortKey}
        </p>
        <div className="flex items-center gap-3">
          <select
            className="px-3 py-1.5 rounded-lg border text-xs outline-none"
            style={{ borderColor: "var(--vl-border)", color: "var(--vl-text)" }}
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as typeof sortKey)}
          >
            <option value="likes">Most liked</option>
            <option value="comments">Most discussed</option>
            <option value="date">Newest</option>
          </select>
          {totalCount > 12 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-xs font-semibold"
              style={{ color: "var(--vl-accent)" }}
            >
              {showAll ? "Show top 12" : `Show all ${totalCount} →`}
            </button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visiblePosts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}

function KeywordsTab({ stats }: { stats: CreatorStats }) {
  if (stats.keywords.length === 0) {
    return (
      <p className="text-sm italic" style={{ color: "var(--vl-text-muted)" }}>
        Not enough posts to extract meaningful keywords yet.
      </p>
    );
  }
  return (
    <div>
      <p className="text-sm mb-5" style={{ color: "var(--vl-text-muted)" }}>
        Words and phrases correlated with high engagement. Ranked by avg likes × frequency.
      </p>
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ borderColor: "var(--vl-border)" }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "var(--vl-bg-card)" }}>
              <th
                className="text-left px-4 py-3 font-medium"
                style={{ color: "var(--vl-text-muted)" }}
              >
                Keyword
              </th>
              <th
                className="text-right px-4 py-3 font-medium"
                style={{ color: "var(--vl-text-muted)" }}
              >
                Posts
              </th>
              <th
                className="text-right px-4 py-3 font-medium"
                style={{ color: "var(--vl-text-muted)" }}
              >
                Avg likes
              </th>
              <th
                className="text-right px-4 py-3 font-medium"
                style={{ color: "var(--vl-text-muted)" }}
              >
                Avg comments
              </th>
            </tr>
          </thead>
          <tbody>
            {stats.keywords.map((k) => (
              <tr
                key={k.keyword}
                style={{ borderTop: "1px solid var(--vl-border)" }}
              >
                <td
                  className="px-4 py-3 font-semibold"
                  style={{ color: "var(--vl-text-heading)" }}
                >
                  {k.keyword}
                </td>
                <td
                  className="px-4 py-3 text-right"
                  style={{ color: "var(--vl-text)" }}
                >
                  {k.count}
                </td>
                <td
                  className="px-4 py-3 text-right font-bold"
                  style={{ color: "var(--vl-text-heading)" }}
                >
                  {k.avgLikes.toLocaleString()}
                </td>
                <td
                  className="px-4 py-3 text-right"
                  style={{ color: "var(--vl-text)" }}
                >
                  {k.avgComments.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PatternsTab({ stats }: { stats: CreatorStats }) {
  const [hookTableLimit, setHookTableLimit] = useState(20);
  const [hookSearch, setHookSearch] = useState("");

  const filteredHooks = useMemo(() => {
    if (!hookSearch.trim()) return stats.hookDetail.allHooks;
    const q = hookSearch.toLowerCase();
    return stats.hookDetail.allHooks.filter((h) =>
      h.firstLine.toLowerCase().includes(q),
    );
  }, [stats.hookDetail.allHooks, hookSearch]);

  return (
    <div className="flex flex-col gap-12">
      {/* ─────────── HOOKS SECTION ─────────── */}

      <section>
        <div className="flex items-baseline justify-between mb-2">
          <h2 className="text-xl font-bold" style={{ color: "var(--vl-text-heading)" }}>
            Hooks
          </h2>
          <span className="text-xs" style={{ color: "var(--vl-text-muted)" }}>
            The first line is 80% of the work
          </span>
        </div>
        <p className="text-sm mb-5" style={{ color: "var(--vl-text-muted)" }}>
          How this creator opens every post — broken down by type, length, first word, and emoji use.
        </p>

        {/* Hook type breakdown */}
        <div className="mb-6">
          <h3 className="text-sm font-bold mb-2" style={{ color: "var(--vl-text-heading)" }}>
            By type
          </h3>
          <div
            className="rounded-2xl border overflow-hidden"
            style={{ borderColor: "var(--vl-border)" }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "var(--vl-bg-card)" }}>
                  <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--vl-text-muted)" }}>Pattern</th>
                  <th className="text-right px-4 py-3 font-medium" style={{ color: "var(--vl-text-muted)" }}>Posts</th>
                  <th className="text-right px-4 py-3 font-medium" style={{ color: "var(--vl-text-muted)" }}>Avg likes</th>
                  <th className="text-right px-4 py-3 font-medium" style={{ color: "var(--vl-text-muted)" }}>Avg comments</th>
                  <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--vl-text-muted)" }}>Best example</th>
                </tr>
              </thead>
              <tbody>
                {stats.hooks.map((row) => (
                  <tr key={row.type} style={{ borderTop: "1px solid var(--vl-border)" }}>
                    <td className="px-4 py-3 font-semibold" style={{ color: "var(--vl-text-heading)" }}>{row.label}</td>
                    <td className="px-4 py-3 text-right" style={{ color: "var(--vl-text)" }}>{row.count}</td>
                    <td className="px-4 py-3 text-right font-bold" style={{ color: "var(--vl-text-heading)" }}>{row.avgLikes.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right" style={{ color: "var(--vl-text)" }}>{row.avgComments.toLocaleString()}</td>
                    <td
                      className="px-4 py-3 text-xs italic max-w-sm truncate"
                      style={{ color: "var(--vl-text-muted)" }}
                      title={row.bestPost?.content || ""}
                    >
                      {row.bestPost ? row.bestPost.content.split("\n")[0].slice(0, 90) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Hook length */}
        <div className="mb-6">
          <h3 className="text-sm font-bold mb-2" style={{ color: "var(--vl-text-heading)" }}>
            By length
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {stats.hookDetail.byLength.map((row) => (
              <StatCard
                key={row.type}
                label={row.label}
                value={row.count}
                sub={`avg ${row.avgLikes.toLocaleString()} likes`}
              />
            ))}
          </div>
        </div>

        {/* Emoji vs plain hooks */}
        <div className="mb-6">
          <h3 className="text-sm font-bold mb-2" style={{ color: "var(--vl-text-heading)" }}>
            Emoji in the hook
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Hook starts with emoji"
              value={stats.hookDetail.hooksWithEmoji.count}
              sub={`avg ${stats.hookDetail.hooksWithEmoji.avgLikes.toLocaleString()} likes`}
            />
            <StatCard
              label="Hook is text only"
              value={stats.hookDetail.hooksWithoutEmoji.count}
              sub={`avg ${stats.hookDetail.hooksWithoutEmoji.avgLikes.toLocaleString()} likes`}
            />
          </div>
        </div>

        {/* First word frequency */}
        {stats.hookDetail.topFirstWords.length > 0 && (
          <div className="mb-6">
            <div className="flex items-baseline justify-between mb-2">
              <h3 className="text-sm font-bold" style={{ color: "var(--vl-text-heading)" }}>
                Most common first words
              </h3>
              <span className="text-xs" style={{ color: "var(--vl-text-muted)" }}>
                Top 15 · appears in 2+ posts
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {stats.hookDetail.topFirstWords.map((w) => (
                <div
                  key={w.word}
                  className="rounded-full border px-3 py-1.5 text-xs flex items-center gap-2"
                  style={{ borderColor: "var(--vl-border)", background: "white" }}
                >
                  <span className="font-bold" style={{ color: "var(--vl-text-heading)" }}>
                    {w.word}
                  </span>
                  <span style={{ color: "var(--vl-text-muted)" }}>
                    ({w.count} · {w.share}%)
                  </span>
                  <span style={{ color: "var(--vl-accent-hover)" }}>
                    avg <strong>{w.avgLikes.toLocaleString()}</strong>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All hooks browser */}
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <h3 className="text-sm font-bold" style={{ color: "var(--vl-text-heading)" }}>
              Every hook · sorted by likes
            </h3>
            <input
              className="px-3 py-1.5 rounded-full border text-xs outline-none w-48"
              style={{ borderColor: "var(--vl-border)", color: "var(--vl-text)" }}
              placeholder="Search hooks..."
              value={hookSearch}
              onChange={(e) => setHookSearch(e.target.value)}
            />
          </div>
          <div
            className="rounded-2xl border overflow-hidden"
            style={{ borderColor: "var(--vl-border)" }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "var(--vl-bg-card)" }}>
                  <th className="text-left px-4 py-3 font-medium w-[55%]" style={{ color: "var(--vl-text-muted)" }}>First line</th>
                  <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--vl-text-muted)" }}>Type</th>
                  <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--vl-text-muted)" }}>Length</th>
                  <th className="text-right px-4 py-3 font-medium" style={{ color: "var(--vl-text-muted)" }}>Likes</th>
                  <th className="text-right px-4 py-3 font-medium" style={{ color: "var(--vl-text-muted)" }}>Comments</th>
                </tr>
              </thead>
              <tbody>
                {filteredHooks.slice(0, hookTableLimit).map((h) => (
                  <tr key={h.id} style={{ borderTop: "1px solid var(--vl-border)" }}>
                    <td className="px-4 py-3" style={{ color: "var(--vl-text-heading)" }}>
                      {h.link ? (
                        <a
                          href={h.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {h.firstLine}
                        </a>
                      ) : (
                        h.firstLine
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--vl-text-muted)" }}>
                      {h.type}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--vl-text-muted)" }}>
                      {h.length}
                    </td>
                    <td className="px-4 py-3 text-right font-bold" style={{ color: "var(--vl-text-heading)" }}>
                      {h.likes.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right" style={{ color: "var(--vl-text)" }}>
                      {h.comments.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredHooks.length > hookTableLimit && (
            <button
              onClick={() => setHookTableLimit((n) => n + 20)}
              className="mt-3 text-xs font-semibold"
              style={{ color: "var(--vl-accent)" }}
            >
              Load 20 more ({filteredHooks.length - hookTableLimit} remaining) →
            </button>
          )}
          {filteredHooks.length === 0 && (
            <p className="text-sm italic text-center py-6" style={{ color: "var(--vl-text-muted)" }}>
              No hooks match your search.
            </p>
          )}
        </div>
      </section>

      {/* ─────────── FORMATS SECTION ─────────── */}

      <section>
        <div className="flex items-baseline justify-between mb-2">
          <h2 className="text-xl font-bold" style={{ color: "var(--vl-text-heading)" }}>
            Formats
          </h2>
          <span className="text-xs" style={{ color: "var(--vl-text-muted)" }}>
            Post structure — the sequence of blocks
          </span>
        </div>
        <p className="text-sm mb-5" style={{ color: "var(--vl-text-muted)" }}>
          Classified using the Kleo playbook taxonomy (10 templates) + Lara Acosta&apos;s SLAY framework.
        </p>

        {/* Structural format distribution */}
        <div className="mb-8">
          <h3 className="text-sm font-bold mb-2" style={{ color: "var(--vl-text-heading)" }}>
            Structural format distribution
          </h3>
          <div
            className="rounded-2xl border overflow-hidden"
            style={{ borderColor: "var(--vl-border)" }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "var(--vl-bg-card)" }}>
                  <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--vl-text-muted)" }}>Format</th>
                  <th className="text-right px-4 py-3 font-medium" style={{ color: "var(--vl-text-muted)" }}>Posts</th>
                  <th className="text-right px-4 py-3 font-medium" style={{ color: "var(--vl-text-muted)" }}>Avg likes</th>
                  <th className="text-right px-4 py-3 font-medium" style={{ color: "var(--vl-text-muted)" }}>Avg comments</th>
                  <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--vl-text-muted)" }}>Best example</th>
                </tr>
              </thead>
              <tbody>
                {stats.structural.formats.map((row) => (
                  <tr key={row.type} style={{ borderTop: "1px solid var(--vl-border)" }}>
                    <td className="px-4 py-3 font-semibold" style={{ color: "var(--vl-text-heading)" }}>{row.label}</td>
                    <td className="px-4 py-3 text-right" style={{ color: "var(--vl-text)" }}>{row.count}</td>
                    <td className="px-4 py-3 text-right font-bold" style={{ color: "var(--vl-text-heading)" }}>{row.avgLikes.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right" style={{ color: "var(--vl-text)" }}>{row.avgComments.toLocaleString()}</td>
                    <td
                      className="px-4 py-3 text-xs italic max-w-sm truncate"
                      style={{ color: "var(--vl-text-muted)" }}
                      title={row.bestPost?.content || ""}
                    >
                      {row.bestPost ? row.bestPost.content.split("\n")[0].slice(0, 90) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Beat frequency */}
        <div className="mb-8">
          <h3 className="text-sm font-bold mb-1" style={{ color: "var(--vl-text-heading)" }}>
            Beat frequency
          </h3>
          <p className="text-xs mb-3" style={{ color: "var(--vl-text-muted)" }}>
            Which structural building blocks the creator uses, and how much each one lifts their average likes.
          </p>
          <div
            className="rounded-2xl border overflow-hidden"
            style={{ borderColor: "var(--vl-border)" }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "var(--vl-bg-card)" }}>
                  <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--vl-text-muted)" }}>Beat</th>
                  <th className="text-right px-4 py-3 font-medium" style={{ color: "var(--vl-text-muted)" }}>Used in</th>
                  <th className="text-right px-4 py-3 font-medium" style={{ color: "var(--vl-text-muted)" }}>Avg likes with</th>
                  <th className="text-right px-4 py-3 font-medium" style={{ color: "var(--vl-text-muted)" }}>Avg likes without</th>
                  <th className="text-right px-4 py-3 font-medium" style={{ color: "var(--vl-text-muted)" }}>Lift</th>
                </tr>
              </thead>
              <tbody>
                {stats.structural.beats.map((row) => {
                  const lift =
                    row.avgLikesWithout > 0
                      ? (row.avgLikesWith / row.avgLikesWithout).toFixed(1)
                      : "—";
                  const liftColor =
                    Number(lift) > 1.2
                      ? "var(--vl-accent-hover)"
                      : Number(lift) < 0.85
                        ? "#ef4444"
                        : "var(--vl-text-muted)";
                  return (
                    <tr key={row.beat} style={{ borderTop: "1px solid var(--vl-border)" }}>
                      <td className="px-4 py-3 font-semibold" style={{ color: "var(--vl-text-heading)" }}>{row.label}</td>
                      <td className="px-4 py-3 text-right" style={{ color: "var(--vl-text)" }}>
                        {row.count} ({row.share}%)
                      </td>
                      <td className="px-4 py-3 text-right font-bold" style={{ color: "var(--vl-text-heading)" }}>
                        {row.avgLikesWith.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right" style={{ color: "var(--vl-text-muted)" }}>
                        {row.avgLikesWithout.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-bold" style={{ color: liftColor }}>
                        {lift === "—" ? "—" : `${lift}×`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stylistic traits — visual dashboard */}
        <div className="mb-6">
          <h3 className="text-sm font-bold mb-1" style={{ color: "var(--vl-text-heading)" }}>
            Stylistic traits
          </h3>
          <p className="text-xs mb-4" style={{ color: "var(--vl-text-muted)" }}>
            How the post is shaped. Bars show avg likes per bucket — longer = higher engagement.
          </p>

          {/* Headline averages strip */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            <HeadlineStat
              label="Avg words / post"
              value={stats.formatDetail.avgWordsPerPost.toLocaleString()}
            />
            <HeadlineStat
              label="Avg lines / post"
              value={stats.formatDetail.avgLinesPerPost.toLocaleString()}
            />
            <HeadlineStat
              label="Avg words / sentence"
              value={stats.formatDetail.avgWordsPerSentence.toLocaleString()}
              sub={
                stats.formatDetail.avgWordsPerSentence <= 12
                  ? "Punchy"
                  : stats.formatDetail.avgWordsPerSentence <= 20
                    ? "Balanced"
                    : "Dense"
              }
            />
          </div>

          {/* Word count chart + Whitespace chart side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
            <div
              className="rounded-xl border p-5"
              style={{ borderColor: "var(--vl-border)", background: "white" }}
            >
              <div className="flex items-baseline justify-between mb-4">
                <div
                  className="text-[11px] uppercase tracking-wider font-bold"
                  style={{ color: "var(--vl-text-muted)" }}
                >
                  Word count
                </div>
                <span className="text-[11px]" style={{ color: "var(--vl-text-muted)" }}>
                  avg likes per bucket
                </span>
              </div>
              <BarChart
                rows={stats.formatDetail.wordHistogram.map((r) => ({
                  label: r.label,
                  count: r.count,
                  avgLikes: r.avgLikes,
                }))}
              />
            </div>

            <div
              className="rounded-xl border p-5"
              style={{ borderColor: "var(--vl-border)", background: "white" }}
            >
              <div className="flex items-baseline justify-between mb-4">
                <div
                  className="text-[11px] uppercase tracking-wider font-bold"
                  style={{ color: "var(--vl-text-muted)" }}
                >
                  Whitespace rhythm
                </div>
                <span className="text-[11px]" style={{ color: "var(--vl-text-muted)" }}>
                  avg likes per bucket
                </span>
              </div>
              <BarChart
                rows={stats.formatDetail.lineBuckets.map((r) => ({
                  label: r.label,
                  count: r.count,
                  avgLikes: r.avgLikes,
                }))}
              />
            </div>
          </div>

          {/* A/B face-offs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FaceOff
              title="Prose vs list"
              a={{
                label: "Prose",
                count: stats.formatDetail.listVsProse.prose.count,
                avgLikes: stats.formatDetail.listVsProse.prose.avgLikes,
              }}
              b={{
                label: "List / numbered",
                count: stats.formatDetail.listVsProse.list.count,
                avgLikes: stats.formatDetail.listVsProse.list.avgLikes,
              }}
            />
            <FaceOff
              title="Emoji vs plain"
              a={{
                label: "Uses emojis",
                count: stats.formatDetail.emojiVsPlain.emoji.count,
                avgLikes: stats.formatDetail.emojiVsPlain.emoji.avgLikes,
              }}
              b={{
                label: "No emojis",
                count: stats.formatDetail.emojiVsPlain.plain.count,
                avgLikes: stats.formatDetail.emojiVsPlain.plain.avgLikes,
              }}
            />
            <FaceOff
              title="Image vs text-only"
              a={{
                label: "With image",
                count: stats.formats.withImage.count,
                avgLikes: stats.formats.withImage.avgLikes,
              }}
              b={{
                label: "Text only",
                count: stats.formats.textOnly.count,
                avgLikes: stats.formats.textOnly.avgLikes,
              }}
            />
          </div>
        </div>
      </section>

      {/* ─────────── CTAs ─────────── */}

      <section>
        <div className="flex items-baseline justify-between mb-2">
          <h2 className="text-xl font-bold" style={{ color: "var(--vl-text-heading)" }}>
            CTAs
          </h2>
          <span className="text-xs" style={{ color: "var(--vl-text-muted)" }}>
            How each post closes
          </span>
        </div>
        <div
          className="rounded-2xl border overflow-hidden"
          style={{ borderColor: "var(--vl-border)" }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--vl-bg-card)" }}>
                <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--vl-text-muted)" }}>CTA type</th>
                <th className="text-right px-4 py-3 font-medium" style={{ color: "var(--vl-text-muted)" }}>Posts</th>
                <th className="text-right px-4 py-3 font-medium" style={{ color: "var(--vl-text-muted)" }}>Avg likes</th>
                <th className="text-right px-4 py-3 font-medium" style={{ color: "var(--vl-text-muted)" }}>Avg comments</th>
              </tr>
            </thead>
            <tbody>
              {stats.ctas.map((row) => (
                <tr key={row.type} style={{ borderTop: "1px solid var(--vl-border)" }}>
                  <td className="px-4 py-3 font-semibold" style={{ color: "var(--vl-text-heading)" }}>{row.label}</td>
                  <td className="px-4 py-3 text-right" style={{ color: "var(--vl-text)" }}>{row.count}</td>
                  <td className="px-4 py-3 text-right font-bold" style={{ color: "var(--vl-text-heading)" }}>{row.avgLikes.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right" style={{ color: "var(--vl-text)" }}>{row.avgComments.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

/* Strategic insights tab — renders Claude-generated markdown */

function MarkdownBlock({ text }: { text: string }) {
  // Minimal markdown renderer: ## headings, - bullets, **bold**, paragraphs.
  const blocks: React.ReactNode[] = [];
  const lines = text.split("\n");
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i += 1; continue; }

    if (line.startsWith("## ")) {
      blocks.push(
        <h3
          key={key++}
          className="text-base font-bold mt-6 mb-2"
          style={{ color: "var(--vl-text-heading)" }}
        >
          {line.slice(3).trim()}
        </h3>,
      );
      i += 1;
      continue;
    }

    if (line.startsWith("# ")) {
      blocks.push(
        <h2
          key={key++}
          className="text-lg font-bold mt-6 mb-3"
          style={{ color: "var(--vl-text-heading)" }}
        >
          {line.slice(2).trim()}
        </h2>,
      );
      i += 1;
      continue;
    }

    if (/^[-*]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s/, ""));
        i += 1;
      }
      blocks.push(
        <ul key={key++} className="list-disc pl-5 my-3 space-y-2">
          {items.map((item, idx) => (
            <li
              key={idx}
              className="text-sm leading-relaxed"
              style={{ color: "var(--vl-text)" }}
            >
              {renderInline(item)}
            </li>
          ))}
        </ul>,
      );
      continue;
    }

    // Paragraph — collect until blank line
    const para: string[] = [line];
    i += 1;
    while (i < lines.length && lines[i].trim() && !lines[i].startsWith("#") && !/^[-*]\s/.test(lines[i])) {
      para.push(lines[i]);
      i += 1;
    }
    blocks.push(
      <p
        key={key++}
        className="text-sm leading-relaxed my-3"
        style={{ color: "var(--vl-text)" }}
      >
        {renderInline(para.join(" "))}
      </p>,
    );
  }

  return <div>{blocks}</div>;
}

function InsightsTab({
  insights,
  loading,
  error,
  onGenerate,
}: {
  insights: CreatorInsightsCache | null;
  loading: boolean;
  error: string | null;
  onGenerate: () => void;
}) {
  if (loading) {
    return (
      <div className="text-center py-16">
        <div
          className="inline-block w-8 h-8 rounded-full animate-spin mb-4"
          style={{
            border: "3px solid var(--vl-border)",
            borderTopColor: "var(--vl-accent)",
          }}
        />
        <p className="text-sm" style={{ color: "var(--vl-text-muted)" }}>
          Asking Claude to analyze this creator... (30–60s)
        </p>
      </div>
    );
  }

  if (!insights) {
    return (
      <div
        className="rounded-2xl border p-8 text-center"
        style={{ borderColor: "var(--vl-border)", background: "white" }}
      >
        <h3 className="text-lg font-bold mb-2" style={{ color: "var(--vl-text-heading)" }}>
          Generate strategic insights
        </h3>
        <p className="text-sm mb-5" style={{ color: "var(--vl-text-muted)" }}>
          Claude will read this creator&apos;s top posts, their hook patterns,
          formats, keywords, and CTAs — and write a strategic briefing on
          what makes them work and how you can learn from them.
        </p>
        <button
          onClick={onGenerate}
          className="px-5 py-3 rounded-xl text-sm font-bold"
          style={{
            background: "var(--vl-accent)",
            color: "white",
            boxShadow: "0 4px 14px rgba(249,115,22,0.25)",
          }}
        >
          Generate with Claude
        </button>
        {error && (
          <p className="mt-4 text-xs" style={{ color: "#ef4444" }}>
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div
            className="text-[10px] uppercase tracking-wider font-bold mb-1"
            style={{ color: "var(--vl-accent-hover)" }}
          >
            Generated by Claude · {insights.model}
          </div>
          <div className="text-xs" style={{ color: "var(--vl-text-muted)" }}>
            Based on {insights.postCount} posts · generated{" "}
            {new Date(insights.generatedAt).toLocaleString()}
          </div>
        </div>
        <button
          onClick={onGenerate}
          className="text-xs font-semibold"
          style={{ color: "var(--vl-accent)" }}
        >
          Regenerate →
        </button>
      </div>

      <div
        className="rounded-2xl border p-8"
        style={{ borderColor: "var(--vl-border)", background: "white" }}
      >
        <MarkdownBlock text={insights.markdown} />
      </div>

      {error && (
        <p className="mt-4 text-xs" style={{ color: "#ef4444" }}>
          {error}
        </p>
      )}
    </div>
  );
}

/* Shared post card */

function firstLineOf(content: string): string {
  return (content || "").split("\n").map((s) => s.trim()).find((s) => s.length > 0) || "";
}

function PostCard({ post }: { post: WinningPost }) {
  const title = firstLineOf(post.content) || post.title || "Untitled";
  const body = (post.content || "").slice(title.length).trim();

  return (
    <a
      href={post.link || "#"}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-white rounded-xl border transition-all hover:shadow-md hover:border-[var(--vl-accent)] flex flex-col overflow-hidden group"
      style={{ borderColor: "var(--vl-border)" }}
    >
      <div
        className="relative w-full aspect-[4/3] overflow-hidden"
        style={{ background: "var(--vl-bg-card)" }}
      >
        {post.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.imageUrl}
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
        <div
          style={{ display: post.imageUrl ? "none" : "flex" }}
          className="absolute inset-0 items-center justify-center"
        >
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              background:
                "linear-gradient(135deg, var(--vl-accent-glow) 0%, rgba(249,115,22,0.04) 100%)",
            }}
          >
            {getCreatorPhoto(post.creator) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={getCreatorPhoto(post.creator)!}
                alt={post.creator}
                loading="lazy"
                className="rounded-full object-cover"
                style={{
                  width: 88,
                  height: 88,
                  border: "3px solid #fff",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                }}
              />
            ) : (
              <span
                className="text-6xl font-black select-none"
                style={{ color: "rgba(249,115,22,0.25)" }}
              >
                {(post.creator || "?").charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="px-4 pt-3 pb-3 flex flex-col flex-1 gap-1.5">
        <div
          className="text-sm font-semibold leading-snug line-clamp-2"
          style={{ color: "var(--vl-text-heading)" }}
        >
          {title}
        </div>
        {body && (
          <div
            className="text-xs leading-relaxed line-clamp-2"
            style={{ color: "var(--vl-text-muted)" }}
          >
            {body}
          </div>
        )}
        <div
          className="mt-auto pt-2 flex items-center gap-3 text-[11px] border-t"
          style={{ borderColor: "var(--vl-border)", color: "var(--vl-text-muted)" }}
        >
          <span>
            <strong style={{ color: "var(--vl-text-heading)" }}>
              {post.likes.toLocaleString()}
            </strong>{" "}
            likes
          </span>
          <span>
            <strong style={{ color: "var(--vl-text-heading)" }}>
              {post.comments.toLocaleString()}
            </strong>{" "}
            comments
          </span>
          <span className="ml-auto">{post.date}</span>
        </div>
      </div>
    </a>
  );
}
