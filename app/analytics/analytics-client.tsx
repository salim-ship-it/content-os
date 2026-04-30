"use client";

import { useState, useEffect, useMemo } from "react";
import { PerformanceChart } from "./performance-chart";

type Post = {
  id: string;
  title: string;
  content: string | null;
  published_date: string;
  post_url: string | null;
  post_type: string | null;
  impressions: number;
  likes: number;
  comments: number;
  reposts: number;
  saves: number;
  new_followers: number;
  profile_visits: number;
  score: number | null;
  notes: string | null;
};

const POST_TYPES = ["hot take", "story", "case study", "educational", "insightful", "transparency", "announcement", "engagement"];

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div
      className="bg-white rounded-2xl border p-5"
      style={{ borderColor: "var(--vl-border)" }}
    >
      <div className="text-[10px] uppercase tracking-wider mb-2 font-medium" style={{ color: "var(--vl-text-muted)" }}>
        {label}
      </div>
      <div className="text-3xl font-bold" style={{ color: "var(--vl-text-heading)" }}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      {sub && <div className="text-xs mt-1" style={{ color: "var(--vl-text-muted)" }}>{sub}</div>}
    </div>
  );
}

function LogPostForm({ onSaved }: { onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "", content: "", published_date: new Date().toISOString().slice(0, 10),
    post_url: "", post_type: "hot take", impressions: "", likes: "", comments: "",
    reposts: "", saves: "", new_followers: "", profile_visits: "", score: "", notes: "",
  });

  function set(key: string, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function save() {
    if (!form.title || !form.published_date) return;
    setSaving(true);
    try {
      const res = await fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed");
      setForm({
        title: "", content: "", published_date: new Date().toISOString().slice(0, 10),
        post_url: "", post_type: "hot take", impressions: "", likes: "", comments: "",
        reposts: "", saves: "", new_followers: "", profile_visits: "", score: "", notes: "",
      });
      setOpen(false);
      onSaved();
    } catch { /* ignore */ }
    finally { setSaving(false); }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="px-5 py-2.5 rounded-lg text-sm font-medium"
        style={{ background: "var(--vl-accent)", color: "#fff" }}
      >
        + Log a post
      </button>
    );
  }

  const inputCls = "w-full px-3 py-2 rounded-lg border text-sm outline-none";
  const inputStyle = { borderColor: "var(--vl-border)", color: "var(--vl-text)" };

  return (
    <div className="bg-white rounded-2xl border p-6 mb-6" style={{ borderColor: "var(--vl-border)" }}>
      <h3 className="text-lg font-bold mb-4" style={{ color: "var(--vl-text-heading)" }}>Log a published post</h3>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <input className={inputCls} style={inputStyle} placeholder="Post title / hook *" value={form.title} onChange={(e) => set("title", e.target.value)} />
        <input className={inputCls} style={inputStyle} type="date" value={form.published_date} onChange={(e) => set("published_date", e.target.value)} />
      </div>
      <textarea className={`${inputCls} mb-3`} style={inputStyle} rows={3} placeholder="Full post text (optional)" value={form.content} onChange={(e) => set("content", e.target.value)} />
      <div className="grid grid-cols-3 gap-3 mb-3">
        <input className={inputCls} style={inputStyle} placeholder="LinkedIn URL" value={form.post_url} onChange={(e) => set("post_url", e.target.value)} />
        <select className={inputCls} style={inputStyle} value={form.post_type} onChange={(e) => set("post_type", e.target.value)}>
          {POST_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <input className={inputCls} style={inputStyle} type="number" placeholder="Score (/60)" value={form.score} onChange={(e) => set("score", e.target.value)} />
      </div>
      <div className="text-[10px] uppercase tracking-wider mb-2 font-medium" style={{ color: "var(--vl-text-muted)" }}>
        Metrics (enter 48h after publishing)
      </div>
      <div className="grid grid-cols-4 gap-3 mb-3">
        <input className={inputCls} style={inputStyle} type="number" placeholder="Impressions" value={form.impressions} onChange={(e) => set("impressions", e.target.value)} />
        <input className={inputCls} style={inputStyle} type="number" placeholder="Likes" value={form.likes} onChange={(e) => set("likes", e.target.value)} />
        <input className={inputCls} style={inputStyle} type="number" placeholder="Comments" value={form.comments} onChange={(e) => set("comments", e.target.value)} />
        <input className={inputCls} style={inputStyle} type="number" placeholder="Reposts" value={form.reposts} onChange={(e) => set("reposts", e.target.value)} />
      </div>
      <div className="grid grid-cols-3 gap-3 mb-3">
        <input className={inputCls} style={inputStyle} type="number" placeholder="Saves" value={form.saves} onChange={(e) => set("saves", e.target.value)} />
        <input className={inputCls} style={inputStyle} type="number" placeholder="New followers" value={form.new_followers} onChange={(e) => set("new_followers", e.target.value)} />
        <input className={inputCls} style={inputStyle} type="number" placeholder="Profile visits" value={form.profile_visits} onChange={(e) => set("profile_visits", e.target.value)} />
      </div>
      <textarea className={`${inputCls} mb-4`} style={inputStyle} rows={2} placeholder="Notes — what worked, what didn't" value={form.notes} onChange={(e) => set("notes", e.target.value)} />
      <div className="flex gap-3">
        <button
          onClick={save} disabled={saving || !form.title}
          className="px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
          style={{ background: "var(--vl-accent)", color: "#fff" }}
        >
          {saving ? "Saving..." : "Save post"}
        </button>
        <button
          onClick={() => setOpen(false)}
          className="px-5 py-2.5 rounded-lg text-sm font-medium border"
          style={{ borderColor: "var(--vl-border)", color: "var(--vl-text)" }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export function AnalyticsClient() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function fetchPosts() {
    setLoading(true);
    try {
      const res = await fetch("/api/analytics");
      const data = await res.json();
      setPosts(Array.isArray(data) ? data : []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchPosts(); }, []);

  // Dashboard stats
  const stats = useMemo(() => {
    if (posts.length === 0) return null;
    const totalImpressions = posts.reduce((s, p) => s + p.impressions, 0);
    const totalLikes = posts.reduce((s, p) => s + p.likes, 0);
    const totalComments = posts.reduce((s, p) => s + p.comments, 0);
    const totalFollowers = posts.reduce((s, p) => s + p.new_followers, 0);
    const totalSaves = posts.reduce((s, p) => s + p.saves, 0);
    const avgEngagement = totalImpressions > 0
      ? (((totalLikes + totalComments) / totalImpressions) * 100).toFixed(2)
      : "0";
    const best = posts.reduce((a, b) => a.likes > b.likes ? a : b, posts[0]);
    const avgScore = posts.filter((p) => p.score).length > 0
      ? (posts.filter((p) => p.score).reduce((s, p) => s + (p.score || 0), 0) / posts.filter((p) => p.score).length).toFixed(0)
      : "—";

    // This week
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const thisWeek = posts.filter((p) => new Date(p.published_date) >= weekAgo);
    const weekImpressions = thisWeek.reduce((s, p) => s + p.impressions, 0);
    const weekLikes = thisWeek.reduce((s, p) => s + p.likes, 0);
    const weekFollowers = thisWeek.reduce((s, p) => s + p.new_followers, 0);

    // This month
    const monthAgo = new Date(now);
    monthAgo.setDate(monthAgo.getDate() - 30);
    const thisMonth = posts.filter((p) => new Date(p.published_date) >= monthAgo);
    const monthImpressions = thisMonth.reduce((s, p) => s + p.impressions, 0);
    const monthLikes = thisMonth.reduce((s, p) => s + p.likes, 0);

    return {
      totalPosts: posts.length, totalImpressions, totalLikes, totalComments,
      totalFollowers, totalSaves, avgEngagement, avgScore, best,
      thisWeek: { count: thisWeek.length, impressions: weekImpressions, likes: weekLikes, followers: weekFollowers },
      thisMonth: { count: thisMonth.length, impressions: monthImpressions, likes: monthLikes },
    };
  }, [posts]);

  // Inline update for metrics
  async function updatePost(id: string, updates: Partial<Post>) {
    await fetch("/api/analytics", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates }),
    });
    setEditingId(null);
    fetchPosts();
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-[11px] uppercase tracking-[0.22em] mb-1" style={{ color: "var(--vl-accent)" }}>
            Analytics
          </div>
          <h1 className="text-3xl font-bold" style={{ color: "var(--vl-text-heading)" }}>
            Your Performance
          </h1>
        </div>
        <LogPostForm onSaved={fetchPosts} />
      </div>

      {loading && (
        <div className="text-center py-16" style={{ color: "var(--vl-text-muted)" }}>Loading...</div>
      )}

      {!loading && posts.length === 0 && (
        <div
          className="bg-white rounded-2xl border p-12 text-center"
          style={{ borderColor: "var(--vl-border)" }}
        >
          <h2 className="text-xl font-bold mb-2" style={{ color: "var(--vl-text-heading)" }}>
            No posts tracked yet
          </h2>
          <p className="text-sm mb-4" style={{ color: "var(--vl-text-muted)" }}>
            Click &quot;Log a post&quot; to start tracking your published LinkedIn content and its performance.
          </p>
        </div>
      )}

      {!loading && stats && (
        <>
          <PerformanceChart posts={posts} />

          {/* This week */}
          <div className="mb-2 text-xs font-medium uppercase tracking-wider" style={{ color: "var(--vl-text-muted)" }}>
            This week
          </div>
          <div className="grid grid-cols-4 gap-4 mb-6">
            <StatCard label="Posts" value={stats.thisWeek.count} />
            <StatCard label="Impressions" value={stats.thisWeek.impressions} />
            <StatCard label="Likes" value={stats.thisWeek.likes} />
            <StatCard label="New followers" value={stats.thisWeek.followers} />
          </div>

          {/* This month */}
          <div className="mb-2 text-xs font-medium uppercase tracking-wider" style={{ color: "var(--vl-text-muted)" }}>
            This month
          </div>
          <div className="grid grid-cols-4 gap-4 mb-6">
            <StatCard label="Posts" value={stats.thisMonth.count} />
            <StatCard label="Impressions" value={stats.thisMonth.impressions} />
            <StatCard label="Likes" value={stats.thisMonth.likes} />
            <StatCard label="Avg engagement" value={`${stats.avgEngagement}%`} />
          </div>

          {/* All time */}
          <div className="mb-2 text-xs font-medium uppercase tracking-wider" style={{ color: "var(--vl-text-muted)" }}>
            All time
          </div>
          <div className="grid grid-cols-5 gap-4 mb-8">
            <StatCard label="Total posts" value={stats.totalPosts} />
            <StatCard label="Total impressions" value={stats.totalImpressions} />
            <StatCard label="Total likes" value={stats.totalLikes} />
            <StatCard label="Total followers" value={stats.totalFollowers} />
            <StatCard label="Avg score" value={stats.avgScore} sub="/60" />
          </div>

          {/* Best post callout */}
          {stats.best && (
            <div
              className="bg-white rounded-2xl border p-5 mb-8 flex items-start gap-4"
              style={{ borderColor: "var(--vl-accent)", background: "var(--vl-accent-glow)" }}
            >
              <div className="text-2xl">🏆</div>
              <div>
                <div className="text-[10px] uppercase tracking-wider mb-1 font-medium" style={{ color: "var(--vl-accent-hover)" }}>
                  Best performing post
                </div>
                <div className="text-sm font-bold" style={{ color: "var(--vl-text-heading)" }}>
                  {stats.best.title}
                </div>
                <div className="text-xs mt-1" style={{ color: "var(--vl-text)" }}>
                  {stats.best.likes.toLocaleString()} likes · {stats.best.comments.toLocaleString()} comments · {stats.best.impressions.toLocaleString()} impressions
                </div>
              </div>
            </div>
          )}

          {/* Posts table */}
          <div className="mb-2 text-xs font-medium uppercase tracking-wider" style={{ color: "var(--vl-text-muted)" }}>
            All posts
          </div>
          <div className="rounded-2xl border overflow-x-auto" style={{ borderColor: "var(--vl-border)" }}>
            <table className="w-full text-sm min-w-[1000px]">
              <thead>
                <tr style={{ background: "var(--vl-bg-card)" }}>
                  <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--vl-text-muted)" }}>Post</th>
                  <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--vl-text-muted)" }}>Date</th>
                  <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--vl-text-muted)" }}>Type</th>
                  <th className="text-right px-4 py-3 font-medium" style={{ color: "var(--vl-text-muted)" }}>Impressions</th>
                  <th className="text-right px-4 py-3 font-medium" style={{ color: "var(--vl-text-muted)" }}>Likes</th>
                  <th className="text-right px-4 py-3 font-medium" style={{ color: "var(--vl-text-muted)" }}>Comments</th>
                  <th className="text-right px-4 py-3 font-medium" style={{ color: "var(--vl-text-muted)" }}>Followers</th>
                  <th className="text-right px-4 py-3 font-medium" style={{ color: "var(--vl-text-muted)" }}>Score</th>
                  <th className="text-center px-4 py-3 font-medium" style={{ color: "var(--vl-text-muted)" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <PostRow key={post.id} post={post} isEditing={editingId === post.id} onEdit={() => setEditingId(post.id)} onSave={(updates) => updatePost(post.id, updates)} onCancel={() => setEditingId(null)} />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function PostRow({ post, isEditing, onEdit, onSave, onCancel }: {
  post: Post;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (updates: Partial<Post>) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    impressions: String(post.impressions),
    likes: String(post.likes),
    comments: String(post.comments),
    new_followers: String(post.new_followers),
  });

  if (isEditing) {
    const inputCls = "w-20 px-2 py-1 rounded border text-sm text-right outline-none";
    const inputStyle = { borderColor: "var(--vl-accent)", color: "var(--vl-text)" };
    return (
      <tr style={{ borderTop: "1px solid var(--vl-border)", background: "var(--vl-accent-glow)" }}>
        <td className="px-4 py-3 font-medium" style={{ color: "var(--vl-text-heading)" }}>{post.title}</td>
        <td className="px-4 py-3" style={{ color: "var(--vl-text)" }}>{post.published_date}</td>
        <td className="px-4 py-3">
          <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ background: "var(--vl-accent-glow)", color: "var(--vl-accent-hover)" }}>
            {post.post_type || "—"}
          </span>
        </td>
        <td className="px-4 py-3 text-right"><input className={inputCls} style={inputStyle} value={form.impressions} onChange={(e) => setForm((f) => ({ ...f, impressions: e.target.value }))} /></td>
        <td className="px-4 py-3 text-right"><input className={inputCls} style={inputStyle} value={form.likes} onChange={(e) => setForm((f) => ({ ...f, likes: e.target.value }))} /></td>
        <td className="px-4 py-3 text-right"><input className={inputCls} style={inputStyle} value={form.comments} onChange={(e) => setForm((f) => ({ ...f, comments: e.target.value }))} /></td>
        <td className="px-4 py-3 text-right"><input className={inputCls} style={inputStyle} value={form.new_followers} onChange={(e) => setForm((f) => ({ ...f, new_followers: e.target.value }))} /></td>
        <td className="px-4 py-3 text-right" style={{ color: "var(--vl-text)" }}>{post.score || "—"}</td>
        <td className="px-4 py-3 text-center">
          <button onClick={() => onSave({ impressions: Number(form.impressions), likes: Number(form.likes), comments: Number(form.comments), new_followers: Number(form.new_followers) })} className="text-xs font-medium mr-2" style={{ color: "var(--vl-accent)" }}>Save</button>
          <button onClick={onCancel} className="text-xs" style={{ color: "var(--vl-text-muted)" }}>Cancel</button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-[var(--vl-bg-card)] transition-colors" style={{ borderTop: "1px solid var(--vl-border)" }}>
      <td className="px-4 py-3">
        <div className="font-medium" style={{ color: "var(--vl-text-heading)" }}>{post.title}</div>
        {post.notes && <div className="text-xs mt-0.5" style={{ color: "var(--vl-text-muted)" }}>{post.notes}</div>}
      </td>
      <td className="px-4 py-3 whitespace-nowrap" style={{ color: "var(--vl-text)" }}>{post.published_date}</td>
      <td className="px-4 py-3">
        <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ background: "var(--vl-accent-glow)", color: "var(--vl-accent-hover)" }}>
          {post.post_type || "—"}
        </span>
      </td>
      <td className="px-4 py-3 text-right font-medium" style={{ color: "var(--vl-text-heading)" }}>{post.impressions.toLocaleString()}</td>
      <td className="px-4 py-3 text-right font-medium" style={{ color: "var(--vl-text-heading)" }}>{post.likes.toLocaleString()}</td>
      <td className="px-4 py-3 text-right" style={{ color: "var(--vl-text)" }}>{post.comments.toLocaleString()}</td>
      <td className="px-4 py-3 text-right" style={{ color: "var(--vl-text)" }}>{post.new_followers.toLocaleString()}</td>
      <td className="px-4 py-3 text-right" style={{ color: "var(--vl-text)" }}>{post.score || "—"}</td>
      <td className="px-4 py-3 text-center">
        <button onClick={onEdit} className="text-xs font-medium" style={{ color: "var(--vl-accent)" }}>Update metrics</button>
        {post.post_url && (
          <a href={post.post_url} target="_blank" rel="noopener noreferrer" className="text-xs ml-2" style={{ color: "var(--vl-text-muted)" }}>View →</a>
        )}
      </td>
    </tr>
  );
}
