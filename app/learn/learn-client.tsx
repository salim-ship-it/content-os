"use client";

import { useState } from "react";
import type { PostCoachCache } from "@/lib/post-coach";
import type { ContentLanguage } from "@/lib/recommended-creators";
import { getDashboardDict, type DashboardDict } from "@/lib/i18n-dashboard";

function renderMarkdown(md: string) {
  const lines = md.split("\n");
  const html: string[] = [];
  let inList = false;

  for (const line of lines) {
    const trimmed = line.trimEnd();
    if (trimmed.startsWith("### ")) {
      if (inList) { html.push("</ul>"); inList = false; }
      html.push(`<h3 class="text-base font-bold mt-6 mb-2" style="color: var(--vl-text-heading)">${trimmed.slice(4)}</h3>`);
    } else if (trimmed.startsWith("- ")) {
      if (!inList) { html.push('<ul class="list-disc pl-5 space-y-1">'); inList = true; }
      const content = trimmed.slice(2).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/"([^"]+)"/g, '<em>"$1"</em>');
      html.push(`<li class="text-sm" style="color: var(--vl-text)">${content}</li>`);
    } else if (trimmed === "") {
      if (inList) { html.push("</ul>"); inList = false; }
    } else {
      if (inList) { html.push("</ul>"); inList = false; }
      const content = trimmed.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/"([^"]+)"/g, '<em>"$1"</em>');
      html.push(`<p class="text-sm mb-2" style="color: var(--vl-text)">${content}</p>`);
    }
  }
  if (inList) html.push("</ul>");
  return html.join("\n");
}

function CoachSection({ initialAnalysis, t, isRtl }: { initialAnalysis: PostCoachCache | null; t: DashboardDict; isRtl: boolean }) {
  const [analysis, setAnalysis] = useState(initialAnalysis);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runAnalysis() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/post-coach", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t.errorGeneric);
      setAnalysis(data.analysis);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.errorGeneric);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.22em] mb-1" style={{ color: "var(--vl-accent)" }}>
            {t.learnCoachTagline}
          </div>
          <h2 className="text-2xl font-bold" style={{ color: "var(--vl-text-heading)" }}>
            {t.learnCoachTitle}
          </h2>
          <p className="text-sm mt-1" style={{ color: "var(--vl-text-muted)" }}>
            {t.learnCoachSubtitle}
          </p>
        </div>
        <button
          onClick={runAnalysis}
          disabled={loading}
          className="px-5 py-3 rounded-xl text-sm font-bold transition-opacity disabled:opacity-50"
          style={{ background: "var(--vl-accent)", color: "white", boxShadow: "0 4px 14px rgba(249,115,22,0.25)" }}
        >
          {loading ? t.learnAnalyzing : analysis ? t.learnRefresh : t.learnAnalyze}
        </button>
      </div>

      {error && (
        <div className="bg-white rounded-2xl border p-5 mb-4" style={{ borderColor: "#ef4444" }}>
          <p className="text-sm" style={{ color: "#ef4444" }}>{error}</p>
        </div>
      )}

      {loading && (
        <div className="bg-white rounded-2xl border p-12 text-center" style={{ borderColor: "var(--vl-border)" }}>
          <div className="text-sm" style={{ color: "var(--vl-text-muted)" }}>
            {t.learnLoadingMain}
          </div>
          <div className="text-xs mt-2" style={{ color: "var(--vl-text-muted)" }}>
            {t.learnLoadingSub}
          </div>
        </div>
      )}

      {!loading && analysis && (
        <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "var(--vl-border)" }}>
          <div
            dangerouslySetInnerHTML={{ __html: renderMarkdown(analysis.markdown) }}
          />
          <div className="mt-6 pt-4 flex items-center justify-between text-[10px]" style={{ borderTop: "1px solid var(--vl-border)", color: "var(--vl-text-muted)" }}>
            <span>
              {t.learnAnalysisFooter(analysis.myPostCount, analysis.creatorPostCount)}
            </span>
            <span>
              {t.learnGeneratedOn(
                new Date(analysis.generatedAt).toLocaleDateString(isRtl ? "ar" : undefined),
                new Date(analysis.generatedAt).toLocaleTimeString(isRtl ? "ar" : undefined),
              )}
            </span>
          </div>
        </div>
      )}

      {!loading && !analysis && !error && (
        <div className="bg-white rounded-2xl border p-12 text-center" style={{ borderColor: "var(--vl-border)" }}>
          <p className="text-sm" style={{ color: "var(--vl-text-muted)" }}>
            {t.learnEmptyHint}
          </p>
        </div>
      )}
    </div>
  );
}

function AddPostSection({ t }: { t: DashboardDict }) {
  const [url, setUrl] = useState("");
  const [content, setContent] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [likes, setLikes] = useState("");
  const [comments, setComments] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!url.trim()) {
      setError(t.learnErrUrl);
      return;
    }
    if (!content.trim()) {
      setError(t.learnErrText);
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const firstLine = content.trim().split("\n")[0].slice(0, 500);
      const res = await fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: firstLine,
          content: content.trim(),
          published_date: date,
          post_url: url.trim(),
          likes: likes ? Number(likes) : 0,
          comments: comments ? Number(comments) : 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t.learnErrSaveFail);
      setUrl("");
      setContent("");
      setLikes("");
      setComments("");
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.learnErrSaveFail);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mb-10">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-1" style={{ color: "var(--vl-text-heading)" }}>
          {t.learnAddTitle}
        </h2>
        <p className="text-sm" style={{ color: "var(--vl-text-muted)" }}>
          {t.learnAddSubtitle}
        </p>
      </div>

      <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "var(--vl-border)" }}>
        <div className="mb-5">
          <label className="block text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--vl-text-muted)" }}>
            {t.learnUrlLabel}
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={t.learnUrlPlaceholder}
            className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors focus:border-[var(--vl-accent)]"
            style={{ borderColor: "var(--vl-border)", background: "var(--vl-bg-soft)", color: "var(--vl-text)" }}
          />
        </div>

        <div className="mb-5">
          <label className="block text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--vl-text-muted)" }}>
            {t.learnTextLabel}
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            placeholder={t.learnTextPlaceholder}
            className="w-full resize-y px-4 py-3 rounded-xl border text-sm outline-none transition-colors focus:border-[var(--vl-accent)]"
            style={{ borderColor: "var(--vl-border)", background: "var(--vl-bg-soft)", color: "var(--vl-text)" }}
          />
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--vl-text-muted)" }}>
              {t.learnDateLabel}
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-3 rounded-xl border text-sm outline-none transition-colors focus:border-[var(--vl-accent)]"
              style={{ borderColor: "var(--vl-border)", background: "var(--vl-bg-soft)", color: "var(--vl-text)" }}
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--vl-text-muted)" }}>
              {t.learnLikesLabel}
            </label>
            <input
              type="number"
              min="0"
              value={likes}
              onChange={(e) => setLikes(e.target.value)}
              placeholder="0"
              className="w-full px-3 py-3 rounded-xl border text-sm outline-none transition-colors focus:border-[var(--vl-accent)]"
              style={{ borderColor: "var(--vl-border)", background: "var(--vl-bg-soft)", color: "var(--vl-text)" }}
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--vl-text-muted)" }}>
              {t.learnCommentsLabel}
            </label>
            <input
              type="number"
              min="0"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="0"
              className="w-full px-3 py-3 rounded-xl border text-sm outline-none transition-colors focus:border-[var(--vl-accent)]"
              style={{ borderColor: "var(--vl-border)", background: "var(--vl-bg-soft)", color: "var(--vl-text)" }}
            />
          </div>
        </div>

        {error && <p className="text-xs mb-3" style={{ color: "#ef4444" }}>{error}</p>}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={save}
            disabled={saving || !url.trim() || !content.trim()}
            className="px-5 py-3 rounded-xl text-sm font-bold transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "var(--vl-accent)", color: "white", boxShadow: "0 4px 14px rgba(249,115,22,0.25)" }}
          >
            {saving ? t.learnSaving : t.learnSave}
          </button>
          {saved && <span className="text-xs font-semibold" style={{ color: "#16a34a" }}>{t.learnSaved}</span>}
        </div>
      </div>
    </div>
  );
}

export function LearnClient({ initialAnalysis, language = "en" }: { initialAnalysis: PostCoachCache | null; language?: ContentLanguage }) {
  const t = getDashboardDict(language);
  const isRtl = language === "ar";
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <div className="text-[11px] uppercase tracking-[0.22em] mb-2" style={{ color: "var(--vl-accent)" }}>
          {t.learnTagline}
        </div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--vl-text-heading)", letterSpacing: "-0.02em" }}>
          {t.learnTitle}
        </h1>
      </div>

      <CoachSection initialAnalysis={initialAnalysis} t={t} isRtl={isRtl} />

      <AddPostSection t={t} />
    </div>
  );
}
