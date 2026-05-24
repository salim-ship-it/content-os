"use client";

import { useState, useMemo } from "react";
import type { Source, SourceKind } from "@/lib/sources";
import type { ContentLanguage } from "@/lib/recommended-creators";
import { getDashboardDict, type DashboardDict } from "@/lib/i18n-dashboard";

const KINDS: SourceKind[] = ["linkedin", "reddit", "newsletter", "youtube"];

function kindLabel(t: DashboardDict, k: SourceKind): string {
  switch (k) {
    case "linkedin": return t.sourcesKindLinkedIn;
    case "reddit": return t.sourcesKindReddit;
    case "newsletter": return t.sourcesKindNewsletter;
    case "youtube": return t.sourcesKindYouTube;
  }
}

export function SourcesClient({ initialSources, language = "en" }: { initialSources: Source[]; language?: ContentLanguage }) {
  const t = getDashboardDict(language);
  const [sources, setSources] = useState(initialSources);
  const [activeTab, setActiveTab] = useState<SourceKind>("linkedin");
  const [restoring, setRestoring] = useState(false);
  const [restoreMsg, setRestoreMsg] = useState<string | null>(null);
  const [rescanning, setRescanning] = useState(false);
  const [rescanMsg, setRescanMsg] = useState<string | null>(null);
  const [scrapeMsg, setScrapeMsg] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [maxPosts, setMaxPosts] = useState(10);

  async function handleRestore() {
    if (restoring) return;
    if (!confirm(t.sourcesRestoreConfirm)) return;
    setRestoring(true);
    setRestoreMsg(null);
    try {
      const res = await fetch("/api/sources/restore", { method: "POST" });
      const data = await res.json();
      const refresh = await fetch("/api/sources");
      setSources(await refresh.json());
      setRestoreMsg(t.sourcesRestoreSuccess(data.restored, data.total));
    } catch {
      setRestoreMsg(t.sourcesRestoreFail);
    } finally {
      setRestoring(false);
    }
  }

  const counts: Record<SourceKind, number> = useMemo(() => {
    const c: Record<SourceKind, number> = { linkedin: 0, reddit: 0, newsletter: 0, youtube: 0 };
    for (const s of sources) c[s.kind] = (c[s.kind] || 0) + 1;
    return c;
  }, [sources]);

  const filtered = useMemo(() => sources.filter((s) => s.kind === activeTab), [sources, activeTab]);

  async function handleRescan() {
    if (rescanning) return;
    setRescanning(true);
    setRescanMsg(null);
    try {
      const res = await fetch("/api/sources/rescan", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setRescanMsg(t.sourcesRescanFail(data.error || String(res.status)));
      } else {
        setRescanMsg(t.sourcesRescanQueued(data.queued));
      }
    } catch {
      setRescanMsg(t.sourcesRescanRetry);
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
      setScrapeMsg(t.sourcesScrapeNotice(name));
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

  const isRtl = language === "ar";
  const textAlign = isRtl ? "text-right" : "text-left";

  return (
    <div className="max-w-5xl">
      <div className="text-[11px] uppercase tracking-[0.22em] mb-3" style={{ color: "var(--vl-accent)" }}>
        {t.sourcesTagline}
      </div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold" style={{ color: "var(--vl-text-heading)" }}>
          {t.sourcesTitle}
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
            {rescanning ? t.sourcesRescanning : t.sourcesRescan}
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
            {restoring ? t.sourcesRestoring : t.sourcesRestore}
          </button>
        </div>
      </div>
      {restoreMsg && (
        <div className="mb-4 px-4 py-2 rounded-lg text-sm" style={{ background: "var(--vl-accent-glow)", color: "var(--vl-accent)" }}>
          {restoreMsg}
        </div>
      )}
      {rescanMsg && (
        <div className="mb-4 px-4 py-2 rounded-lg text-sm" style={{ background: "var(--vl-accent-glow)", color: "var(--vl-accent)" }}>
          {rescanMsg}
        </div>
      )}
      {scrapeMsg && (
        <div className="mb-4 px-4 py-2 rounded-lg text-sm" style={{ background: "var(--vl-accent-glow)", color: "var(--vl-accent)" }}>
          {scrapeMsg}
        </div>
      )}

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
            {kindLabel(t, kind)}{" "}
            <span className={`${isRtl ? "mr-1" : "ml-1"} opacity-70`}>{counts[kind]}</span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border p-5 mb-6" style={{ borderColor: "var(--vl-border)" }}>
        <div className="text-xs uppercase tracking-wider font-medium mb-3" style={{ color: "var(--vl-text-muted)" }}>
          {t.sourcesAddHeading(kindLabel(t, activeTab))}
        </div>
        <div className="grid grid-cols-12 gap-3">
          <input
            className="col-span-3 rounded-lg border px-3 py-2 text-sm outline-none"
            style={{ borderColor: "var(--vl-border)", color: "var(--vl-text)", background: "var(--vl-bg-card)" }}
            placeholder={t.sourcesNamePlaceholder}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="col-span-4 rounded-lg border px-3 py-2 text-sm outline-none"
            style={{ borderColor: "var(--vl-border)", color: "var(--vl-text)", background: "var(--vl-bg-card)" }}
            placeholder={t.sourcesUrlPlaceholder}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <input
            className="col-span-3 rounded-lg border px-3 py-2 text-sm outline-none"
            style={{ borderColor: "var(--vl-border)", color: "var(--vl-text)", background: "var(--vl-bg-card)" }}
            placeholder={t.sourcesNotePlaceholder}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          {activeTab !== "newsletter" && (
            <input
              className="col-span-1 rounded-lg border px-2 py-2 text-sm outline-none text-center"
              style={{ borderColor: "var(--vl-border)", color: "var(--vl-text)", background: "var(--vl-bg-card)" }}
              type="number"
              min={1}
              placeholder={t.sourcesMaxPlaceholder}
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
            {t.sourcesAdd}
          </button>
        </div>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--vl-border)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "var(--vl-bg-card)" }}>
              <th className={`${textAlign} px-4 py-3 font-medium`} style={{ color: "var(--vl-text-muted)" }}>{t.sourcesColName}</th>
              <th className={`${textAlign} px-4 py-3 font-medium`} style={{ color: "var(--vl-text-muted)" }}>{t.sourcesColUrl}</th>
              <th className={`${textAlign} px-4 py-3 font-medium`} style={{ color: "var(--vl-text-muted)" }}>{t.sourcesColNote}</th>
              {activeTab !== "newsletter" && (
                <th className={`${isRtl ? "text-left" : "text-right"} px-4 py-3 font-medium`} style={{ color: "var(--vl-text-muted)" }}>{t.sourcesColMax}</th>
              )}
              <th className="text-center px-4 py-3 font-medium" style={{ color: "var(--vl-text-muted)" }}>{t.sourcesColStatus}</th>
              <th className={`${isRtl ? "text-left" : "text-right"} px-4 py-3 font-medium`} style={{ color: "var(--vl-text-muted)" }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((source) => (
              <tr key={source.url} style={{ borderTop: "1px solid var(--vl-border)" }}>
                <td className="px-4 py-3 font-medium" style={{ color: "var(--vl-text-heading)" }}>
                  {source.name}
                </td>
                <td className="px-4 py-3">
                  <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-sm underline" style={{ color: "var(--vl-accent)" }}>
                    {source.url.length > 40 ? source.url.slice(0, 40) + "..." : source.url}
                  </a>
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: "var(--vl-text-muted)" }}>
                  {source.note || "—"}
                </td>
                {activeTab !== "newsletter" && (
                  <td className={`px-4 py-3 ${isRtl ? "text-left" : "text-right"} text-sm`} style={{ color: "var(--vl-text)" }}>
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
                    {source.enabled ? t.sourcesEnabled : t.sourcesDisabled}
                  </button>
                </td>
                <td className={`px-4 py-3 ${isRtl ? "text-left" : "text-right"}`}>
                  <button
                    onClick={() => handleRemove(source.url)}
                    className="text-xs font-medium px-2.5 py-1 rounded transition-colors"
                    style={{ color: "#dc2626", background: "#fef2f2" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#fee2e2")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#fef2f2")}
                  >
                    {t.sourcesRemove}
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={activeTab !== "newsletter" ? 6 : 5} className="px-4 py-12 text-center" style={{ color: "var(--vl-text-muted)" }}>
                  {t.sourcesEmpty(kindLabel(t, activeTab))}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 text-xs" style={{ color: "var(--vl-text-muted)" }}>
        {t.sourcesCount(filtered.length)}
      </div>
    </div>
  );
}
