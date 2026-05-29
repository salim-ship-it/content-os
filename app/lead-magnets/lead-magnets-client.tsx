"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

type Post = {
  id: string;
  title: string;
  content: string;
  creator: string;
  date: string;
  likes: number;
  comments: number;
  link: string;
  image_url: string;
  topic: string;
  created_at: string;
};

function firstLine(text: string): string {
  return (text || "").split("\n").map((s) => s.trim()).find((s) => s.length > 0) || "";
}

function AddUrlForm({ onSaved }: { onSaved: () => void }) {
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [bulkUrls, setBulkUrls] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState("");

  async function saveSingle() {
    if (!url.trim()) return;
    setSaving(true);
    setError(null);
    setProgress("Scraping...");
    try {
      const res = await fetch("/api/lead-magnets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setUrl("");
      setNotes("");
      setProgress("✓ Saved");
      setTimeout(() => setProgress(""), 2000);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
      setProgress("");
    } finally {
      setSaving(false);
    }
  }

  async function saveBulk() {
    const urls = bulkUrls
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => /linkedin\.com/.test(l));
    if (urls.length === 0) {
      setError("No LinkedIn URLs found. Paste one URL per line.");
      return;
    }
    setSaving(true);
    setError(null);
    let saved = 0;
    let skipped = 0;
    let failed = 0;
    for (let i = 0; i < urls.length; i += 1) {
      setProgress(`Scraping ${i + 1}/${urls.length}...`);
      try {
        const res = await fetch("/api/lead-magnets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: urls[i], notes: "" }),
        });
        if (res.status === 409) { skipped += 1; continue; }
        if (!res.ok) { failed += 1; continue; }
        saved += 1;
      } catch {
        failed += 1;
      }
    }
    setBulkUrls("");
    setProgress(`✓ ${saved} saved · ${skipped} duplicates · ${failed} failed`);
    setTimeout(() => setProgress(""), 4000);
    setSaving(false);
    onSaved();
  }

  return (
    <div
      className="rounded-2xl border p-5 mb-8"
      style={{ borderColor: "var(--vl-border)", background: "white" }}
    >
      <div className="flex items-center justify-between mb-3">
        <div
          className="text-[11px] uppercase tracking-wider font-bold"
          style={{ color: "var(--vl-accent)" }}
        >
          Add lead magnet posts
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setMode("single")}
            className="text-xs font-semibold px-3 py-1 rounded-full"
            style={{
              background: mode === "single" ? "var(--vl-accent)" : "transparent",
              color: mode === "single" ? "white" : "var(--vl-text-muted)",
              border: mode === "single" ? "none" : "1px solid var(--vl-border)",
            }}
          >
            Single URL
          </button>
          <button
            onClick={() => setMode("bulk")}
            className="text-xs font-semibold px-3 py-1 rounded-full"
            style={{
              background: mode === "bulk" ? "var(--vl-accent)" : "transparent",
              color: mode === "bulk" ? "white" : "var(--vl-text-muted)",
              border: mode === "bulk" ? "none" : "1px solid var(--vl-border)",
            }}
          >
            Bulk paste
          </button>
        </div>
      </div>

      {mode === "single" && (
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            className="flex-1 px-4 py-2.5 rounded-xl border text-sm outline-none"
            style={{ borderColor: "var(--vl-border)", color: "var(--vl-text)" }}
            placeholder="Paste LinkedIn post URL..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <input
            className="flex-1 px-4 py-2.5 rounded-xl border text-sm outline-none"
            style={{ borderColor: "var(--vl-border)", color: "var(--vl-text)" }}
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <button
            onClick={saveSingle}
            disabled={saving || !url.trim()}
            className="px-5 py-2.5 rounded-xl text-sm font-bold transition-opacity disabled:opacity-40"
            style={{ background: "var(--vl-accent)", color: "white" }}
          >
            Add
          </button>
        </div>
      )}

      {mode === "bulk" && (
        <div className="flex flex-col gap-3">
          <textarea
            className="w-full resize-y px-4 py-3 rounded-xl border text-sm outline-none"
            style={{ borderColor: "var(--vl-border)", color: "var(--vl-text)" }}
            rows={5}
            placeholder={"Paste LinkedIn post URLs — one per line.\n\nTip: Go to your LinkedIn profile → Comments tab → use the bookmarklet below to copy all post URLs, then paste here."}
            value={bulkUrls}
            onChange={(e) => setBulkUrls(e.target.value)}
          />
          <div className="flex items-center gap-3">
            <button
              onClick={saveBulk}
              disabled={saving || !bulkUrls.trim()}
              className="px-5 py-2.5 rounded-xl text-sm font-bold transition-opacity disabled:opacity-40"
              style={{ background: "var(--vl-accent)", color: "white" }}
            >
              Scrape all
            </button>
            <span className="text-xs" style={{ color: "var(--vl-text-muted)" }}>
              {bulkUrls.split("\n").filter((l) => /linkedin\.com/.test(l)).length} URLs detected
            </span>
          </div>
        </div>
      )}

      {error && <p className="text-xs mt-2" style={{ color: "#ef4444" }}>{error}</p>}
      {progress && (
        <p
          className="text-xs mt-2 font-semibold"
          style={{ color: progress.startsWith("✓") ? "#16a34a" : "var(--vl-text-muted)" }}
        >
          {progress}
        </p>
      )}
    </div>
  );
}

function PostCard({ post }: { post: Post }) {
  const title = firstLine(post.content) || post.title || "Untitled";
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
        {post.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.image_url}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover transition-transform group-hover:scale-[1.02]"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              background:
                "linear-gradient(135deg, var(--vl-accent-glow) 0%, rgba(249,115,22,0.04) 100%)",
            }}
          >
            <span
              className="text-5xl select-none"
              style={{ color: "rgba(249,115,22,0.3)" }}
            >
              🧲
            </span>
          </div>
        )}
      </div>
      <div className="px-4 pt-3 pb-3 flex flex-col flex-1 gap-1.5">
        {post.creator && (
          <div className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--vl-text-muted)" }}>
            <span className="font-semibold" style={{ color: "var(--vl-text-heading)" }}>
              {post.creator}
            </span>
            <span>·</span>
            <span>{post.date}</span>
          </div>
        )}
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
        {post.topic && (
          <div
            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full self-start mt-1"
            style={{ color: "var(--vl-accent)", background: "var(--vl-accent-glow)" }}
          >
            {post.topic}
          </div>
        )}
        <div
          className="mt-auto pt-2 flex items-center gap-3 text-[11px] border-t"
          style={{ borderColor: "var(--vl-border)", color: "var(--vl-text-muted)" }}
        >
          {post.likes > 0 && (
            <span>
              <strong style={{ color: "var(--vl-text-heading)" }}>
                {post.likes.toLocaleString()}
              </strong>{" "}
              likes
            </span>
          )}
          {post.comments > 0 && (
            <span>
              <strong style={{ color: "var(--vl-text-heading)" }}>
                {post.comments.toLocaleString()}
              </strong>{" "}
              comments
            </span>
          )}
        </div>
      </div>
    </a>
  );
}

export function LeadMagnetsClient() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/lead-magnets");
      const data = await res.json();
      setPosts(data.posts || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const filtered = search.trim()
    ? posts.filter((p) => {
        const q = search.toLowerCase();
        return (
          (p.title || "").toLowerCase().includes(q) ||
          (p.creator || "").toLowerCase().includes(q) ||
          (p.content || "").toLowerCase().includes(q) ||
          (p.topic || "").toLowerCase().includes(q)
        );
      })
    : posts;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <div className="text-[11px] uppercase tracking-[0.22em] mb-1" style={{ color: "var(--vl-accent)" }}>
            Lead Magnets
          </div>
          <h1 className="text-3xl font-bold" style={{ color: "var(--vl-text-heading)" }}>
            Swipe File
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--vl-text-muted)" }}>
            {posts.length} lead magnet post{posts.length === 1 ? "" : "s"} saved
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            className="px-4 py-2 rounded-full border text-sm outline-none w-56"
            style={{ borderColor: "var(--vl-border)", color: "var(--vl-text)" }}
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Link
            href="/lead-magnets/create"
            className="px-4 py-2 rounded-xl text-sm font-bold transition-colors"
            style={{ background: "var(--vl-accent)", color: "white" }}
          >
            + Create a lead magnet
          </Link>
        </div>
      </div>

      <AddUrlForm onSaved={fetchPosts} />

      {loading && (
        <div className="text-center py-16 text-sm" style={{ color: "var(--vl-text-muted)" }}>
          Loading...
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="rounded-2xl border p-12 text-center" style={{ borderColor: "var(--vl-border)", background: "white" }}>
          <h2 className="text-xl font-bold mb-2" style={{ color: "var(--vl-text-heading)" }}>
            No lead magnets yet
          </h2>
          <p className="text-sm" style={{ color: "var(--vl-text-muted)" }}>
            Paste a LinkedIn post URL above or wait for the daily comment scraper to populate this.
          </p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
