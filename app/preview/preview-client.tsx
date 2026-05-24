"use client";

import { useState } from "react";
import type { ContentLanguage } from "@/lib/recommended-creators";
import { getDashboardDict, type DashboardDict } from "@/lib/i18n-dashboard";

type ViewMode = "both" | "desktop" | "mobile";

function escapeHTML(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Style hashtags, @mentions, and URLs like LinkedIn (blue #0a66c2, semi-bold)
function renderPostHTML(text: string): string {
  const escaped = escapeHTML(text);
  const blue = 'color:#0a66c2;font-weight:600';
  return escaped
    .replace(/(https?:\/\/[^\s<]+)/g, `<span style="${blue}">$1</span>`)
    .replace(/(^|\s)(#[\p{L}\p{N}_]+)/gu, `$1<span style="${blue}">$2</span>`)
    .replace(/(^|\s)(@[\p{L}\p{N}_.-]+)/gu, `$1<span style="${blue}">$2</span>`);
}

function LinkedInPost({ text, name, headline, viewMode, t }: { text: string; name: string; headline: string; viewMode: "desktop" | "mobile"; t: DashboardDict }) {
  const isMobile = viewMode === "mobile";
  const containerWidth = isMobile ? 375 : 555;
  const padding = isMobile ? 12 : 16;
  const fontSize = isMobile ? 14 : 14;
  const nameSize = isMobile ? 14 : 14;
  const avatarSize = isMobile ? 40 : 48;

  // LinkedIn truncates at 3 visible lines in feed (regardless of char count).
  // Using -webkit-line-clamp for pixel-accurate rendering-based truncation.
  const [expanded, setExpanded] = useState(false);

  const charCount = text.length;
  const lineCount = text.split("\n").length;

  return (
    <div style={{ width: containerWidth, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      {/* Device frame label */}
      <div className="text-center mb-3">
        <span className="text-xs font-medium px-3 py-1 rounded-full" style={{ background: "var(--vl-bg-card)", color: "var(--vl-text-muted)" }}>
          {isMobile ? t.previewDeviceMobile : t.previewDeviceDesktop} · {containerWidth}px
        </span>
      </div>

      {/* LinkedIn card */}
      <div
        style={{
          background: "#fff",
          borderRadius: 8,
          border: "1px solid #e0e0e0",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{ padding: `${padding}px ${padding}px 0` }}>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <div
              style={{
                width: avatarSize,
                height: avatarSize,
                borderRadius: "50%",
                background: "#f97316",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: 700,
                fontSize: avatarSize * 0.4,
                flexShrink: 0,
              }}
            >
              {name.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: nameSize, fontWeight: 600, color: "#000", lineHeight: 1.3 }}>
                {name}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "#666",
                  lineHeight: 1.3,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {headline}
              </div>
              <div style={{ fontSize: 12, color: "#999", lineHeight: 1.5 }}>1d · 🌐</div>
            </div>
            <div style={{ color: "#0a66c2", fontSize: 14, fontWeight: 600, flexShrink: 0 }}>
              {t.previewFollow}
            </div>
          </div>
        </div>

        {/* Post text — 3-line truncation matches LinkedIn feed */}
        <div style={{ padding: `8px ${padding}px ${padding}px`, position: "relative" }}>
          <div
            style={{
              fontSize,
              lineHeight: 1.43,
              color: "#000",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              display: expanded ? "block" : "-webkit-box",
              WebkitLineClamp: expanded ? "unset" : 3,
              WebkitBoxOrient: "vertical",
              overflow: expanded ? "visible" : "hidden",
            }}
            dangerouslySetInnerHTML={{ __html: renderPostHTML(text) }}
          />
          {!expanded && (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              style={{
                background: "none",
                border: "none",
                color: "#666",
                fontSize,
                padding: 0,
                marginTop: 2,
                cursor: "pointer",
              }}
            >
              {t.previewSeeMore}
            </button>
          )}
        </div>

        {/* Engagement bar */}
        <div
          style={{
            padding: `0 ${padding}px`,
            fontSize: 12,
            color: "#666",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <span>👍❤️</span>
          <span>42</span>
          <span style={{ marginLeft: "auto" }}>{t.previewEngagement(42, 5, 2).split(" · ").slice(1).join(" · ")}</span>
        </div>

        {/* Action buttons */}
        <div
          style={{
            borderTop: "1px solid #e0e0e0",
            margin: `8px ${padding}px 0`,
            padding: "4px 0",
            display: "flex",
            justifyContent: "space-around",
          }}
        >
          {[t.previewActionLike, t.previewActionComment, t.previewActionRepost, t.previewActionSend].map((action) => (
            <button
              key={action}
              style={{
                background: "none",
                border: "none",
                padding: "8px 4px",
                fontSize: isMobile ? 11 : 12,
                color: "#666",
                fontWeight: 600,
                cursor: "default",
              }}
            >
              {action}
            </button>
          ))}
        </div>
      </div>

      {/* Stats below */}
      <div className="mt-3 flex gap-4 justify-center text-xs" style={{ color: "var(--vl-text-muted)" }}>
        <span>{charCount} {t.previewCharsLabel}</span>
        <span>{lineCount} {t.previewLinesLabel}</span>
        <span>{expanded ? t.previewStatsExpanded : t.previewStatsFeed}</span>
      </div>
    </div>
  );
}

export function PreviewClient({ language = "en" }: { language?: ContentLanguage }) {
  const t = getDashboardDict(language);
  const [text, setText] = useState("");
  const [name, setName] = useState("Salim Sraj");
  const [headline, setHeadline] = useState("CEO @ VectorLabs Pro · GTM Engineer · Building outbound systems for B2B SaaS");
  const [viewMode, setViewMode] = useState<ViewMode>("both");

  const charCount = text.length;
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const lineCount = text.split("\n").length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-[11px] uppercase tracking-[0.22em] mb-1" style={{ color: "var(--vl-accent)" }}>
            {t.previewTagline}
          </div>
          <h1 className="text-3xl font-bold" style={{ color: "var(--vl-text-heading)" }}>
            {t.previewTitle}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {(["both", "desktop", "mobile"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className="px-4 py-2 rounded-full text-sm font-medium transition-colors capitalize"
              style={
                viewMode === mode
                  ? { background: "var(--vl-accent)", color: "#fff" }
                  : { background: "white", color: "var(--vl-text)", border: "1px solid var(--vl-border)" }
              }
            >
              {mode === "both" ? t.previewModeBoth : mode === "desktop" ? t.previewModeDesktop : t.previewModeMobile}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Editor */}
        <div className="col-span-5">
          <div className="bg-white rounded-2xl border p-5 sticky top-6" style={{ borderColor: "var(--vl-border)" }}>
            <div className="mb-3">
              <div className="text-[10px] uppercase tracking-wider mb-1.5 font-medium" style={{ color: "var(--vl-text-muted)" }}>
                {t.previewNameLabel}
              </div>
              <input
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                style={{ borderColor: "var(--vl-border)", color: "var(--vl-text)" }}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="mb-3">
              <div className="text-[10px] uppercase tracking-wider mb-1.5 font-medium" style={{ color: "var(--vl-text-muted)" }}>
                {t.previewHeadlineLabel}
              </div>
              <input
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                style={{ borderColor: "var(--vl-border)", color: "var(--vl-text)" }}
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
              />
            </div>
            <div className="mb-3">
              <div className="text-[10px] uppercase tracking-wider mb-1.5 font-medium" style={{ color: "var(--vl-text-muted)" }}>
                {t.previewContentLabel}
              </div>
              <textarea
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none resize-none"
                style={{ borderColor: "var(--vl-border)", color: "var(--vl-text)", minHeight: 300 }}
                placeholder={t.previewContentPlaceholder}
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg p-2.5 text-center" style={{ background: "var(--vl-bg-card)" }}>
                <div className="text-lg font-bold" style={{ color: charCount > 3000 ? "#ef4444" : charCount > 1300 ? "#f59e0b" : "var(--vl-text-heading)" }}>
                  {charCount}
                </div>
                <div className="text-[10px] uppercase tracking-wider" style={{ color: "var(--vl-text-muted)" }}>{t.previewCharsLabel}</div>
              </div>
              <div className="rounded-lg p-2.5 text-center" style={{ background: "var(--vl-bg-card)" }}>
                <div className="text-lg font-bold" style={{ color: "var(--vl-text-heading)" }}>
                  {wordCount}
                </div>
                <div className="text-[10px] uppercase tracking-wider" style={{ color: "var(--vl-text-muted)" }}>{t.previewWordsLabel}</div>
              </div>
              <div className="rounded-lg p-2.5 text-center" style={{ background: "var(--vl-bg-card)" }}>
                <div className="text-lg font-bold" style={{ color: "var(--vl-text-heading)" }}>
                  {lineCount}
                </div>
                <div className="text-[10px] uppercase tracking-wider" style={{ color: "var(--vl-text-muted)" }}>{t.previewLinesLabel}</div>
              </div>
            </div>

            {/* LinkedIn limits info */}
            <div className="mt-3 text-xs leading-relaxed" style={{ color: "var(--vl-text-muted)" }}>
              {t.previewLimitsBody}
            </div>
          </div>
        </div>

        {/* Preview(s) */}
        <div className="col-span-7">
          {!text && (
            <div className="text-center py-20" style={{ color: "var(--vl-text-muted)" }}>
              {t.previewEmpty}
            </div>
          )}
          {text && (
            <div className={`flex ${viewMode === "both" ? "gap-6" : "justify-center"}`}>
              {(viewMode === "both" || viewMode === "desktop") && (
                <LinkedInPost text={text} name={name} headline={headline} viewMode="desktop" t={t} />
              )}
              {(viewMode === "both" || viewMode === "mobile") && (
                <LinkedInPost text={text} name={name} headline={headline} viewMode="mobile" t={t} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
