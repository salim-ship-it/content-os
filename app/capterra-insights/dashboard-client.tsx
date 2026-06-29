"use client";

import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface Review {
  id: string;
  reviewer_name: string;
  reviewer_role: string;
  reviewer_company: string;
  rating: number;
  review_date: string;
  review_title: string;
  review_body: string;
  pros: string;
  cons: string;
  problems_solved: string;
}

const STOPWORDS = new Set([
  "the","and","or","a","an","is","it","in","of","to","for","with","on","at","by","from",
  "that","this","are","was","be","as","i","we","our","my","their","can","not","but","have",
  "has","had","very","so","if","no","do","use","used","using","also","more","some","when",
  "than","its","would","which","there","what","how","all","one","more","been","they","about",
  "like","just","will","your","were","he","she","his","her","you","get","got","we're",
  "it's","don't","didn't","doesn't","we've","they're","we'd","could","should","make","made",
  "need","needs","want","good","great","easy","well","much","many","really","very","bit",
  "way","time","us","still","work","works","worked","working","team","product","software",
]);

function extractKeywords(texts: string[], topN = 12): { word: string; count: number }[] {
  const freq: Record<string, number> = {};
  for (const text of texts) {
    const words = text
      .toLowerCase()
      .replace(/[^a-z\s'-]/g, " ")
      .split(/\s+/)
      .map((w) => w.replace(/^['-]+|['-]+$/g, ""))
      .filter((w) => w.length > 3 && !STOPWORDS.has(w));
    for (const w of words) {
      freq[w] = (freq[w] || 0) + 1;
    }
  }
  return Object.entries(freq)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN);
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <span className="text-yellow-400">
      {"★".repeat(Math.round(rating))}{"☆".repeat(5 - Math.round(rating))}
    </span>
  );
}

const CHART_COLORS = ["#f97316", "#fb923c", "#fdba74", "#fed7aa", "#ffedd5"];
const ACCENT = "#f97316";

export function CapterraDashboard({ reviews }: { reviews: Review[] }) {
  const [search, setSearch] = useState("");
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "outbound" | "reviews">("overview");

  const stats = useMemo(() => {
    if (!reviews.length) return null;
    const avgRating = reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length;
    const positive = reviews.filter((r) => r.rating >= 4).length;
    const distribution = [1, 2, 3, 4, 5].map((star) => ({
      star: `${star}★`,
      count: reviews.filter((r) => Math.round(r.rating) === star).length,
    }));
    return { avgRating, positive, distribution };
  }, [reviews]);

  const volumeByMonth = useMemo(() => {
    const byMonth: Record<string, number> = {};
    for (const r of reviews) {
      if (!r.review_date) continue;
      const d = new Date(r.review_date);
      if (isNaN(d.getTime())) continue;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      byMonth[key] = (byMonth[key] || 0) + 1;
    }
    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-18)
      .map(([month, count]) => ({ month: month.slice(0, 7), count }));
  }, [reviews]);

  const painPoints = useMemo(() => {
    const consTexts = reviews.map((r) => r.cons).filter(Boolean);
    return extractKeywords(consTexts, 12);
  }, [reviews]);

  const praisePoints = useMemo(() => {
    const prosTexts = reviews.map((r) => r.pros).filter(Boolean);
    return extractKeywords(prosTexts, 12);
  }, [reviews]);

  const buyerRoles = useMemo(() => {
    const freq: Record<string, number> = {};
    for (const r of reviews) {
      if (!r.reviewer_role) continue;
      const role = r.reviewer_role.trim();
      freq[role] = (freq[role] || 0) + 1;
    }
    return Object.entries(freq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([role, count]) => ({ role, count }));
  }, [reviews]);

  const triggerKeywords = useMemo(() => {
    const problemsTexts = reviews.map((r) => r.problems_solved).filter(Boolean);
    return extractKeywords(problemsTexts, 10);
  }, [reviews]);

  const coldEmailHooks = useMemo(() => {
    return painPoints.slice(0, 5).map(({ word, count }) => ({
      hook: `"Struggling with ${word}? [X companies] switched from Spendesk because of this exact issue."`,
      word,
      count,
    }));
  }, [painPoints]);

  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      const matchSearch =
        !search ||
        [r.review_title, r.review_body, r.pros, r.cons, r.reviewer_name, r.reviewer_role]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase());
      const matchRating = filterRating === null || Math.round(r.rating) === filterRating;
      return matchSearch && matchRating;
    });
  }, [reviews, search, filterRating]);

  if (!reviews.length) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <p className="text-2xl font-bold" style={{ color: "var(--vl-text-heading)" }}>
          No reviews yet
        </p>
        <p style={{ color: "var(--vl-text-muted)" }}>
          Run <code className="bg-gray-100 px-2 py-1 rounded text-sm">npx ts-node scripts/scrape-capterra.ts</code> to populate data.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--vl-bg, #f8f8f8)" }}>
      {/* Header */}
      <div className="border-b bg-white" style={{ borderColor: "var(--vl-border, #e5e7eb)" }}>
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--vl-text-heading, #111)" }}>
              Spendesk — Capterra Review Intelligence
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--vl-text-muted, #6b7280)" }}>
              {reviews.length} verified reviews · scraped from Capterra.com
            </p>
          </div>
          <span
            className="text-xs font-semibold px-3 py-1 rounded-full"
            style={{ background: "rgba(249,115,22,0.1)", color: ACCENT }}
          >
            LIVE DATA
          </span>
        </div>

        {/* Tabs */}
        <div className="max-w-6xl mx-auto px-6 flex gap-1 border-t" style={{ borderColor: "var(--vl-border, #e5e7eb)" }}>
          {(["overview", "outbound", "reviews"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-3 text-sm font-medium capitalize transition-colors border-b-2"
              style={{
                borderBottomColor: activeTab === tab ? ACCENT : "transparent",
                color: activeTab === tab ? ACCENT : "var(--vl-text-muted, #6b7280)",
              }}
            >
              {tab === "outbound" ? "Outbound Intelligence" : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && stats && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Reviews", value: reviews.length, sub: "on Capterra" },
                { label: "Average Rating", value: `${stats.avgRating.toFixed(1)} / 5`, sub: "overall score" },
                { label: "Positive Reviews", value: `${Math.round((stats.positive / reviews.length) * 100)}%`, sub: "rated 4–5 stars" },
                { label: "Top Buyer Role", value: buyerRoles[0]?.role?.split(" ").slice(0, 2).join(" ") || "—", sub: "most common reviewer" },
              ].map((kpi) => (
                <div
                  key={kpi.label}
                  className="bg-white rounded-xl border p-5"
                  style={{ borderColor: "var(--vl-border, #e5e7eb)" }}
                >
                  <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--vl-text-muted, #6b7280)" }}>
                    {kpi.label}
                  </p>
                  <p className="text-2xl font-bold mt-1" style={{ color: "var(--vl-text-heading, #111)" }}>
                    {kpi.value}
                  </p>
                  <p className="text-xs mt-1" style={{ color: "var(--vl-text-muted, #6b7280)" }}>
                    {kpi.sub}
                  </p>
                </div>
              ))}
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Rating distribution */}
              <div className="bg-white rounded-xl border p-6" style={{ borderColor: "var(--vl-border, #e5e7eb)" }}>
                <h3 className="font-semibold mb-4" style={{ color: "var(--vl-text-heading, #111)" }}>
                  Rating Distribution
                </h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={stats.distribution} barSize={36}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="star" tick={{ fontSize: 13 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill={ACCENT} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Reviews over time */}
              <div className="bg-white rounded-xl border p-6" style={{ borderColor: "var(--vl-border, #e5e7eb)" }}>
                <h3 className="font-semibold mb-4" style={{ color: "var(--vl-text-heading, #111)" }}>
                  Review Volume Over Time
                </h3>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={volumeByMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke={ACCENT} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pros / Cons keywords */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border p-6" style={{ borderColor: "var(--vl-border, #e5e7eb)" }}>
                <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--vl-text-heading, #111)" }}>
                  <span className="text-green-500">✓</span> Most Praised (from Pros)
                </h3>
                <div className="space-y-2">
                  {praisePoints.map(({ word, count }) => (
                    <div key={word} className="flex items-center gap-3">
                      <span className="text-sm w-28 truncate capitalize" style={{ color: "var(--vl-text-heading, #111)" }}>{word}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-green-400"
                          style={{ width: `${(count / (praisePoints[0]?.count || 1)) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs w-6 text-right" style={{ color: "var(--vl-text-muted, #6b7280)" }}>{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl border p-6" style={{ borderColor: "var(--vl-border, #e5e7eb)" }}>
                <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--vl-text-heading, #111)" }}>
                  <span className="text-red-400">✕</span> Most Complained (from Cons)
                </h3>
                <div className="space-y-2">
                  {painPoints.map(({ word, count }) => (
                    <div key={word} className="flex items-center gap-3">
                      <span className="text-sm w-28 truncate capitalize" style={{ color: "var(--vl-text-heading, #111)" }}>{word}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${(count / (painPoints[0]?.count || 1)) * 100}%`,
                            background: ACCENT,
                          }}
                        />
                      </div>
                      <span className="text-xs w-6 text-right" style={{ color: "var(--vl-text-muted, #6b7280)" }}>{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* OUTBOUND INTELLIGENCE TAB */}
        {activeTab === "outbound" && (
          <div className="space-y-6">
            <div
              className="rounded-xl border p-5 flex items-start gap-4"
              style={{ background: "rgba(249,115,22,0.04)", borderColor: "rgba(249,115,22,0.2)" }}
            >
              <span className="text-2xl">🎯</span>
              <div>
                <p className="font-semibold" style={{ color: ACCENT }}>How to use this tab</p>
                <p className="text-sm mt-1" style={{ color: "var(--vl-text-muted, #6b7280)" }}>
                  These insights are extracted directly from {reviews.length} real customer reviews. Use pain points as cold email hooks, buyer roles to identify who to target, and trigger keywords to find accounts with buying intent.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pain points → cold email hooks */}
              <div className="bg-white rounded-xl border p-6 md:col-span-2" style={{ borderColor: "var(--vl-border, #e5e7eb)" }}>
                <h3 className="font-semibold mb-1" style={{ color: "var(--vl-text-heading, #111)" }}>
                  Cold Email Hooks from Pain Points
                </h3>
                <p className="text-sm mb-4" style={{ color: "var(--vl-text-muted, #6b7280)" }}>
                  Top complaints from real Spendesk customers → ready-to-test openers
                </p>
                <div className="space-y-3">
                  {coldEmailHooks.map(({ hook, word, count }) => (
                    <div
                      key={word}
                      className="border rounded-lg p-4 flex items-start gap-3"
                      style={{ borderColor: "var(--vl-border, #e5e7eb)" }}
                    >
                      <span
                        className="text-xs font-bold px-2 py-1 rounded-full shrink-0 mt-0.5"
                        style={{ background: "rgba(249,115,22,0.1)", color: ACCENT }}
                      >
                        {count}×
                      </span>
                      <p className="text-sm italic" style={{ color: "var(--vl-text-heading, #111)" }}>
                        {hook}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Buyer roles */}
              <div className="bg-white rounded-xl border p-6" style={{ borderColor: "var(--vl-border, #e5e7eb)" }}>
                <h3 className="font-semibold mb-1" style={{ color: "var(--vl-text-heading, #111)" }}>
                  Who Buys Spendesk
                </h3>
                <p className="text-sm mb-4" style={{ color: "var(--vl-text-muted, #6b7280)" }}>
                  Reviewer job titles → your ICP for outbound
                </p>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={buyerRoles}
                      dataKey="count"
                      nameKey="role"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ role, percent }) =>
                        `${role?.split(" ").slice(0, 2).join(" ")} (${Math.round((percent || 0) * 100)}%)`
                      }
                      labelLine={false}
                    >
                      {buyerRoles.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [value, name]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-3 space-y-1">
                  {buyerRoles.map(({ role, count }) => (
                    <div key={role} className="flex justify-between text-sm">
                      <span style={{ color: "var(--vl-text-heading, #111)" }}>{role || "Unknown"}</span>
                      <span style={{ color: "var(--vl-text-muted, #6b7280)" }}>{count} reviews</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trigger keywords */}
              <div className="bg-white rounded-xl border p-6" style={{ borderColor: "var(--vl-border, #e5e7eb)" }}>
                <h3 className="font-semibold mb-1" style={{ color: "var(--vl-text-heading, #111)" }}>
                  Buying Triggers
                </h3>
                <p className="text-sm mb-4" style={{ color: "var(--vl-text-muted, #6b7280)" }}>
                  Keywords from "problems solved" → what signals to watch for in prospects
                </p>
                {triggerKeywords.length > 0 ? (
                  <div className="space-y-2">
                    {triggerKeywords.map(({ word, count }) => (
                      <div key={word} className="flex items-center gap-3">
                        <span className="text-sm w-32 truncate capitalize" style={{ color: "var(--vl-text-heading, #111)" }}>{word}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-blue-400"
                            style={{ width: `${(count / (triggerKeywords[0]?.count || 1)) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs w-6 text-right" style={{ color: "var(--vl-text-muted, #6b7280)" }}>{count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm" style={{ color: "var(--vl-text-muted, #6b7280)" }}>
                    No "problems solved" data scraped. This field may not be available on Capterra.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* REVIEWS TAB */}
        {activeTab === "reviews" && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Search reviews, roles, keywords..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 border rounded-lg px-4 py-2 text-sm outline-none"
                style={{ borderColor: "var(--vl-border, #e5e7eb)" }}
              />
              <div className="flex gap-2">
                {[null, 5, 4, 3, 2, 1].map((star) => (
                  <button
                    key={star ?? "all"}
                    onClick={() => setFilterRating(star)}
                    className="px-3 py-2 rounded-lg text-sm font-medium border transition-colors"
                    style={{
                      borderColor: filterRating === star ? ACCENT : "var(--vl-border, #e5e7eb)",
                      background: filterRating === star ? "rgba(249,115,22,0.08)" : "white",
                      color: filterRating === star ? ACCENT : "var(--vl-text-muted, #6b7280)",
                    }}
                  >
                    {star === null ? "All" : `${star}★`}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-sm" style={{ color: "var(--vl-text-muted, #6b7280)" }}>
              {filteredReviews.length} of {reviews.length} reviews
            </p>

            <div className="space-y-4">
              {filteredReviews.map((r) => (
                <div
                  key={r.id}
                  className="bg-white rounded-xl border p-5"
                  style={{ borderColor: "var(--vl-border, #e5e7eb)" }}
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <p className="font-semibold" style={{ color: "var(--vl-text-heading, #111)" }}>
                        {r.review_title || "Untitled Review"}
                      </p>
                      <p className="text-sm mt-0.5" style={{ color: "var(--vl-text-muted, #6b7280)" }}>
                        {r.reviewer_name || "Anonymous"}
                        {r.reviewer_role && ` · ${r.reviewer_role}`}
                        {r.reviewer_company && ` @ ${r.reviewer_company}`}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <StarDisplay rating={r.rating} />
                      <p className="text-xs mt-1" style={{ color: "var(--vl-text-muted, #6b7280)" }}>
                        {r.review_date ? new Date(r.review_date).toLocaleDateString("en-GB", { month: "short", year: "numeric" }) : ""}
                      </p>
                    </div>
                  </div>

                  {r.review_body && (
                    <p className="text-sm mt-3 line-clamp-3" style={{ color: "var(--vl-text-heading, #111)" }}>
                      {r.review_body}
                    </p>
                  )}

                  {(r.pros || r.cons) && (
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {r.pros && (
                        <div className="rounded-lg p-3" style={{ background: "rgba(34,197,94,0.06)" }}>
                          <p className="text-xs font-semibold text-green-600 mb-1">PROS</p>
                          <p className="text-sm" style={{ color: "var(--vl-text-heading, #111)" }}>{r.pros}</p>
                        </div>
                      )}
                      {r.cons && (
                        <div className="rounded-lg p-3" style={{ background: "rgba(249,115,22,0.06)" }}>
                          <p className="text-xs font-semibold mb-1" style={{ color: ACCENT }}>CONS</p>
                          <p className="text-sm" style={{ color: "var(--vl-text-heading, #111)" }}>{r.cons}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
