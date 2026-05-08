"use client";

import { useState, useMemo } from "react";
import type { Source, SourceKind } from "@/lib/sources";

const KIND_LABELS: Record<SourceKind, string> = {
  linkedin: "LinkedIn",
  reddit: "Reddit",
  newsletter: "Newsletters",
  youtube: "YouTube",
};

const KINDS: SourceKind[] = ["linkedin", "reddit", "newsletter", "youtube"];

export function SourcesClient({ initialSources }: { initialSources: Source[] }) {
  const [sources, setSources] = useState(initialSources);
  const [activeTab, setActiveTab] = useState<SourceKind>("linkedin");
  const [restoring, setRestoring] = useState(false);
  const [restoreMsg, setRestoreMsg] = useState<string | null>(null);
  const [rescanning, setRescanning] = useState(false);
  const [rescanMsg, setRescanMsg] = useState<string | null>(null);
  const [scrapeMsg, setScrapeMsg] = useState<string | null>(null);

  /* --- form state --- */
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [maxPosts, setMaxPosts] = useState(10);

  async function handleRestore() {
    if (restoring) return;
    if (!confirm("Add the 35 default sources? Any sources you've already added will be kept.")) return;
    setRestoring(true);
    setRestoreMsg(null);
    try {
      const res = await fetch("/api/sources/restore", { method: "POST" });
      const data = await res.json();
      const refresh = await fetch("/api/sources");
      setSources(await refresh.json());
      setRestoreMsg(`Restored ${data.restored} sources (${data.total} total).`);
    } catch {
      setRestoreMsg("Restore failed. Try again.");
    } finally {
      setRestoring(false);
    }
  }

  /* --- counts --- */
  const counts: Record<SourceKind, number> = useMemo(() => {
    const c: Record<SourceKind, number> = { linkedin: 0, reddit: 0, newsletter: 0, youtube: 0 };
    for (const s of sources) c[s.kind] = (c[s.kind] || 0) + 1;
    return c;
  }, [sources]);

  /* --- filtered --- */
  const filtered = useMemo(() => sources.filter((s) => s.kind === activeTab), [sources, activeTab]);

  /* --- CRUD --- */
  async function handleRescan() {
    if (rescanning) return;
    setRescanning(true);
    setRescanMsg(null);
    try {
      const res = await fetch("/api/sources/rescan", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setRescanMsg(`Rescan failed: ${data.error || res.status}`);
      } else {
        setRescanMsg(`Queued ${data.queued} source${data.queued !== 1 ? "s" : ""} — check Swipe File in ~5 min.`);
      }
    } catch {
      setRescanMsg("Rescan failed. Try again.");
    } finally {
      setRescanning(false);
    }
  }

  async function handleAdd() {
    if (!name || !url) return;
    setScrapeMsg(null);
    const res = await fetch("/api/sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: activeTab,
        name,
        url,
        note,
        enabled: true,
        maxPosts: activeTab === "newsletter" ? 0 : maxPosts,
      }),
    });
    const updated = await res.json();
    setSources(updated);
    if (activeTab === "linkedin" && url) {
      setScrapeMsg(`Scraping posts for "${name}" in background — check Swipe File in ~5 min.`);
    }
    setName("");
    setUrl("");
    setNote("");
    setMaxPosts(10);
  }

  async function handleRemove(sourceUrl: string) {
    const res = await fetch(`/api/sources?url=${encodeURIComponent(sourceUrl)}`, {
      method: "DELETE",
    });
    const updated = await res.json();
    setSources(updated);
  }

  async function handleToggle(sourceUrl: string, currentEnabled: boolean) {
    const res = await fetch("/api/sources", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: sourceUrl, enabled: !currentEnabled }),
    });
    const updated = await res.json();
    setSources(updated);
  }

  return (
    <div className="max-w-5xl">
      <div className="text-[11px] uppercase tracking-[0.22em] mb-3" style={{ color: "var(--vl-accent)" }}>
        Content OS
      </div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold" style={{ color: "var(--vl-text-heading)" }}>
          Sources
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRescan}
            disabled={rescanning}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              background: "var(--vl-bg-card)",
              color: "var(--vl-text-muted)",
              border: "1px solid var(--vl-border)",
              opacity: rescanning ? 0.6 : 1,
            }}
          >
            {rescanning ? "Rescanning..." : "↻ Rescan all"}
          </button>
          <button
            onClick={handleRestore}
            disabled={restoring}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              background: "var(--vl-bg-card)",
              color: "var(--vl-accent)",
              border: "1px solid var(--vl-accent)",
              opacity: restoring ? 0.6 : 1,
            }}
          >
            {restoring ? "Restoring..." : "↻ Restore defaults"}
          </button>
        </div>
      </div>
      {restoreMsg && (
        <div
          className="mb-4 px-4 py-2 rounded-lg text-sm"
          style={{ background: "var(--vl-accent-glow)", color: "var(--vl-accent)" }}
        >
          {restoreMsg}
        </div>
      )}
      {rescanMsg && (
        <div
          className="mb-4 px-4 py-2 rounded-lg text-sm"
          style={{ background: "var(--vl-accent-glow)", color: "var(--vl-accent)" }}
        >
          {rescanMsg}
        </div>
      )}
      {scrapeMsg && (
        <div
          className="mb-4 px-4 py-2 rounded-lg text-sm"
          style={{ background: "var(--vl-accent-glow)", color: "var(--vl-accent)" }}
        >
          {scrapeMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {KINDS.map((kind) => (
          <button
            key={kind}
            onClick={() => setActiveTab(kind)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={
              activeTab === kind
                ? { background: "var(--vl-accent)", color: "#fff" }
                : { background: "var(--vl-bg-card)", color: "var(--vl-text-muted)", border: "1px solid var(--vl-border)" }
            }
          >
            {KIND_LABELS[kind]}{" "}
            <span className="ml-1 opacity-70">{counts[kind]}</span>
          </button>
        ))}
      </div>

      {/* Add form */}
      <div
        className="bg-white rounded-xl border p-5 mb-6"
        style={{ borderColor: "var(--vl-border)" }}
      >
        <div className="text-xs uppercase tracking-wider font-medium mb-3" style={{ color: "var(--vl-text-muted)" }}>
          Add {KIND_LABELS[activeTab]} source
        </div>
        <div className="grid grid-cols-12 gap-3">
          <input
            className="col-span-3 rounded-lg border px-3 py-2 text-sm outline-none"
            style={{ borderColor: "var(--vl-border)", color: "var(--vl-text)", background: "var(--vl-bg-card)" }}
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="col-span-4 rounded-lg border px-3 py-2 text-sm outline-none"
            style={{ borderColor: "var(--vl-border)", color: "var(--vl-text)", background: "var(--vl-bg-card)" }}
            placeholder="URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <input
            className="col-span-3 rounded-lg border px-3 py-2 text-sm outline-none"
            style={{ borderColor: "var(--vl-border)", color: "var(--vl-text)", background: "var(--vl-bg-card)" }}
            placeholder="Note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          {activeTab !== "newsletter" && (
            <input
              className="col-span-1 rounded-lg border px-2 py-2 text-sm outline-none text-center"
              style={{ borderColor: "var(--vl-border)", color: "var(--vl-text)", background: "var(--vl-bg-card)" }}
              type="number"
              min={1}
              placeholder="Max"
              value={maxPosts}
              onChange={(e) => setMaxPosts(Number(e.target.value))}
            />
          )}
          <button
            onClick={handleAdd}
            className="col-span-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
            style={{ background: "var(--vl-accent)", color: "#fff" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--vl-accent-hover)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "var(--vl-accent)")}
          >
            Add
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--vl-border)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "var(--vl-bg-card)" }}>
              <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--vl-text-muted)" }}>Name</th>
              <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--vl-text-muted)" }}>URL</th>
              <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--vl-text-muted)" }}>Note</th>
              {activeTab !== "newsletter" && (
                <th className="text-right px-4 py-3 font-medium" style={{ color: "var(--vl-text-muted)" }}>Max</th>
              )}
              <th className="text-center px-4 py-3 font-medium" style={{ color: "var(--vl-text-muted)" }}>Status</th>
              <th className="text-right px-4 py-3 font-medium" style={{ color: "var(--vl-text-muted)" }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((source) => (
              <tr key={source.url} style={{ borderTop: "1px solid var(--vl-border)" }}>
                <td className="px-4 py-3 font-medium" style={{ color: "var(--vl-text-heading)" }}>
                  {source.name}
                </td>
                <td className="px-4 py-3">
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm underline"
                    style={{ color: "var(--vl-accent)" }}
                  >
                    {source.url.length > 40 ? source.url.slice(0, 40) + "..." : source.url}
                  </a>
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: "var(--vl-text-muted)" }}>
                  {source.note || "—"}
                </td>
                {activeTab !== "newsletter" && (
                  <td className="px-4 py-3 text-right text-sm" style={{ color: "var(--vl-text)" }}>
                    {source.maxPosts}
                  </td>
                )}
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => handleToggle(source.url, source.enabled)}
                    className="inline-block px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors"
                    style={
                      source.enabled
                        ? { background: "#dcfce7", color: "#166534" }
                        : { background: "#f3f4f6", color: "#6b7280" }
                    }
                  >
                    {source.enabled ? "enabled" : "disabled"}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleRemove(source.url)}
                    className="text-xs font-medium px-2.5 py-1 rounded transition-colors"
                    style={{ color: "#dc2626", background: "#fef2f2" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#fee2e2")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#fef2f2")}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={activeTab !== "newsletter" ? 6 : 5} className="px-4 py-12 text-center" style={{ color: "var(--vl-text-muted)" }}>
                  No {KIND_LABELS[activeTab]} sources yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 text-xs" style={{ color: "var(--vl-text-muted)" }}>
        {filtered.length} source{filtered.length !== 1 ? "s" : ""}
      </div>
    </div>
  );
}
