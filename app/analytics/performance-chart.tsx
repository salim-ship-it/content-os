"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Post = {
  published_date: string;
  impressions: number;
  likes: number;
  comments: number;
  reposts: number;
};

type Range = "30d" | "90d" | "all";
type Grain = "day" | "week";
type Metric = "likes" | "comments" | "impressions" | "reposts";

const METRICS: { key: Metric; label: string; color: string }[] = [
  { key: "likes", label: "Likes", color: "#F97316" },
  { key: "comments", label: "Comments", color: "#0EA5E9" },
  { key: "reposts", label: "Reposts", color: "#10B981" },
  { key: "impressions", label: "Impressions", color: "#8B5CF6" },
];

function startOfWeek(d: Date): Date {
  const copy = new Date(d);
  const day = copy.getDay();
  const diff = (day + 6) % 7; // Monday as week start
  copy.setDate(copy.getDate() - diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function formatDate(iso: string, grain: Grain): string {
  const d = new Date(iso);
  if (grain === "week") {
    return `W${Math.ceil(((d.getTime() - new Date(d.getFullYear(), 0, 1).getTime()) / 86400000 + new Date(d.getFullYear(), 0, 1).getDay() + 1) / 7)}`;
  }
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function PerformanceChart({ posts }: { posts: Post[] }) {
  const [range, setRange] = useState<Range>("90d");
  const [grain, setGrain] = useState<Grain>("day");
  const [activeMetrics, setActiveMetrics] = useState<Metric[]>(["likes", "comments"]);

  const series = useMemo(() => {
    if (posts.length === 0) return [];
    const now = new Date();
    const cutoff = new Date(now);
    if (range === "30d") cutoff.setDate(cutoff.getDate() - 30);
    else if (range === "90d") cutoff.setDate(cutoff.getDate() - 90);
    else cutoff.setFullYear(1970);

    const filtered = posts.filter((p) => new Date(p.published_date) >= cutoff);

    const buckets = new Map<string, { impressions: number; likes: number; comments: number; reposts: number }>();
    for (const p of filtered) {
      const d = new Date(p.published_date);
      const key = grain === "week" ? startOfWeek(d).toISOString().slice(0, 10) : p.published_date;
      const bucket = buckets.get(key) ?? { impressions: 0, likes: 0, comments: 0, reposts: 0 };
      bucket.impressions += p.impressions;
      bucket.likes += p.likes;
      bucket.comments += p.comments;
      bucket.reposts += p.reposts;
      buckets.set(key, bucket);
    }

    return Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, vals]) => ({
        date,
        label: formatDate(date, grain),
        ...vals,
      }));
  }, [posts, range, grain]);

  const totals = useMemo(() => {
    return series.reduce(
      (acc, s) => ({
        likes: acc.likes + s.likes,
        comments: acc.comments + s.comments,
        reposts: acc.reposts + s.reposts,
        impressions: acc.impressions + s.impressions,
      }),
      { likes: 0, comments: 0, reposts: 0, impressions: 0 },
    );
  }, [series]);

  function toggleMetric(m: Metric) {
    setActiveMetrics((prev) => {
      if (prev.includes(m)) return prev.length > 1 ? prev.filter((x) => x !== m) : prev;
      return [...prev, m];
    });
  }

  const rangeBtn = (r: Range, label: string) => (
    <button
      key={r}
      onClick={() => setRange(r)}
      className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
      style={{
        background: range === r ? "var(--vl-accent)" : "transparent",
        color: range === r ? "white" : "var(--vl-text-muted)",
      }}
    >
      {label}
    </button>
  );

  const grainBtn = (g: Grain, label: string) => (
    <button
      key={g}
      onClick={() => setGrain(g)}
      className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
      style={{
        background: grain === g ? "var(--vl-accent)" : "transparent",
        color: grain === g ? "white" : "var(--vl-text-muted)",
      }}
    >
      {label}
    </button>
  );

  return (
    <div className="bg-white rounded-2xl border p-5 mb-6" style={{ borderColor: "var(--vl-border)" }}>
      <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
        <div>
          <h3 className="text-base font-bold mb-1" style={{ color: "var(--vl-text-heading)" }}>
            Performance over time
          </h3>
          <p className="text-xs" style={{ color: "var(--vl-text-muted)" }}>
            Click a metric chip to toggle it on the chart
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg p-0.5" style={{ background: "var(--vl-bg-soft)" }}>
            {rangeBtn("30d", "30D")}
            {rangeBtn("90d", "90D")}
            {rangeBtn("all", "All")}
          </div>
          <div className="flex items-center rounded-lg p-0.5" style={{ background: "var(--vl-bg-soft)" }}>
            {grainBtn("day", "Daily")}
            {grainBtn("week", "Weekly")}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {METRICS.map((m) => {
          const active = activeMetrics.includes(m.key);
          return (
            <button
              key={m.key}
              onClick={() => toggleMetric(m.key)}
              className="px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 border transition-all"
              style={{
                borderColor: active ? m.color : "var(--vl-border)",
                background: active ? `${m.color}12` : "white",
                color: active ? m.color : "var(--vl-text-muted)",
              }}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: active ? m.color : "var(--vl-border)" }} />
              {m.label}
              <span className="ml-1 font-bold">{totals[m.key].toLocaleString()}</span>
            </button>
          );
        })}
      </div>

      {series.length === 0 ? (
        <div className="text-center py-12 text-sm" style={{ color: "var(--vl-text-muted)" }}>
          No posts in this date range yet.
        </div>
      ) : (
        <div style={{ width: "100%", height: 280 }}>
          <ResponsiveContainer>
            <AreaChart data={series} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                {METRICS.map((m) => (
                  <linearGradient key={m.key} id={`grad-${m.key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={m.color} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={m.color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--vl-border)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "var(--vl-text-muted)" }}
                axisLine={{ stroke: "var(--vl-border)" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--vl-text-muted)" }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip
                contentStyle={{
                  background: "white",
                  border: "1px solid var(--vl-border)",
                  borderRadius: "12px",
                  fontSize: "12px",
                }}
                labelStyle={{ fontWeight: 700, color: "var(--vl-text-heading)" }}
              />
              {METRICS.filter((m) => activeMetrics.includes(m.key)).map((m) => (
                <Area
                  key={m.key}
                  type="monotone"
                  dataKey={m.key}
                  name={m.label}
                  stroke={m.color}
                  strokeWidth={2}
                  fill={`url(#grad-${m.key})`}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
