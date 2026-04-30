"use client";

import { useState, useRef, useEffect } from "react";

// ─── Mock data — represents what each idea looks like ─────────────────────

type Source = "reddit" | "linkedin" | "twitter" | "self" | "fireflies";
type Status = "raw" | "drafting" | "scheduled" | "shipped";

type Idea = {
  id: string;
  text: string;
  hook?: string;
  source: Source;
  sourceLabel: string;
  capturedAt: string;
  status: Status;
  pillar?: string;
};

const MOCK_IDEAS: Idea[] = [
  {
    id: "1",
    text: "Most GTM 'systems' are duct-taped Zapiers. Real systems are boring, observable, and survive vendor changes.",
    hook: "I audited 11 GTM stacks last month. 9 of them broke when one tool changed pricing.",
    source: "self",
    sourceLabel: "Personal note",
    capturedAt: "2h ago",
    status: "raw",
    pillar: "GTM systems",
  },
  {
    id: "2",
    text: "The Clay table is not the strategy. It's a downstream of strategy. Confusing the two is why most outbound looks the same.",
    source: "linkedin",
    sourceLabel: "Michel Lieben",
    capturedAt: "5h ago",
    status: "raw",
    pillar: "Hot take",
  },
  {
    id: "3",
    text: "Why founders should write before they hire a ghostwriter — your voice is a moat the agency can't see yet.",
    hook: "I ghostwrite for founders. I always tell them: write 30 posts yourself first.",
    source: "self",
    sourceLabel: "Shower thought",
    capturedAt: "Yesterday",
    status: "drafting",
    pillar: "Ghostwriting",
  },
  {
    id: "4",
    text: "Reddit thread: 'I scraped 10K B2B sales reps and 70% had outdated LinkedIn titles' — angle on data hygiene.",
    source: "reddit",
    sourceLabel: "r/sales",
    capturedAt: "Yesterday",
    status: "raw",
    pillar: "Data hygiene",
  },
  {
    id: "5",
    text: "The 3-tier signal model: tier 1 (intent), tier 2 (capacity), tier 3 (timing). Most teams only score tier 1.",
    hook: "Your scoring model is incomplete. Here's the framework that fixed mine.",
    source: "self",
    sourceLabel: "Client call",
    capturedAt: "2 days ago",
    status: "scheduled",
    pillar: "Signal-based",
  },
  {
    id: "6",
    text: "Vibe GTM is real but everyone is butchering the definition. It's not 'AI does outbound for you.' It's 'you direct an AI engineer who does outbound.'",
    source: "twitter",
    sourceLabel: "@varun",
    capturedAt: "3 days ago",
    status: "drafting",
    pillar: "Hot take",
  },
];

// ─── Component ────────────────────────────────────────────────────────────

export function InboxClient() {
  const [filter, setFilter] = useState<"all" | Status>("all");
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Cmd+N focus shortcut
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Auto-grow textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 200) + "px";
    }
  }, [draft]);

  const filtered = MOCK_IDEAS.filter((i) => filter === "all" || i.status === filter);

  return (
    <div className="h-screen overflow-y-auto">
      <div className="max-w-[860px] mx-auto px-10 pt-12 pb-32">
        {/* Header */}
        <header className="mb-10 animate-rise">
          <div className="text-[11px] uppercase tracking-[0.18em] mb-2" style={{ color: "var(--co-accent-ink)" }}>
            Inbox · Tuesday, April 28
          </div>
          <h1 className="font-display text-[44px] font-semibold leading-[1.05] tracking-[-0.02em]" style={{ color: "var(--co-ink)" }}>
            What's on your mind?
          </h1>
          <p className="text-[15px] mt-2.5" style={{ color: "var(--co-ink-soft)" }}>
            Capture it before it disappears. Refine it later.
          </p>
        </header>

        {/* Capture */}
        <section className="mb-10 animate-rise" style={{ animationDelay: "60ms" }}>
          <div
            className="rounded-2xl border p-5 transition-shadow"
            style={{
              background: "var(--co-card)",
              borderColor: "var(--co-rule-strong)",
              boxShadow: "0 1px 0 rgba(26,24,20,0.02), 0 8px 24px -16px rgba(26,24,20,0.10)",
            }}
          >
            <textarea
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type a raw idea, a hook, a thread you saw, a thought you had…"
              rows={1}
              className="w-full resize-none bg-transparent text-[15.5px] leading-relaxed outline-none focus-ring rounded"
              style={{ color: "var(--co-ink)", minHeight: 28 }}
            />
            <div className="flex items-center justify-between mt-4 pt-4 border-t" style={{ borderColor: "var(--co-rule)" }}>
              <div className="flex items-center gap-2">
                <SourceChip label="Self" tone="self" />
                <SourceChip label="Add pillar" muted />
                <SourceChip label="Add hook" muted />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px]" style={{ color: "var(--co-ink-mute)" }}>
                  <kbd className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ background: "var(--co-paper-soft)", border: "1px solid var(--co-rule)", color: "var(--co-ink-soft)" }}>⌘</kbd>
                  <kbd className="ml-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ background: "var(--co-paper-soft)", border: "1px solid var(--co-rule)", color: "var(--co-ink-soft)" }}>N</kbd>
                  <span className="ml-1.5">to focus</span>
                </span>
                <button
                  disabled={!draft.trim()}
                  className="px-4 py-2 rounded-lg text-[13px] font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: draft.trim() ? "var(--co-ink)" : "var(--co-paper-soft)",
                    color: draft.trim() ? "var(--co-paper)" : "var(--co-ink-mute)",
                  }}
                >
                  Capture →
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Filter rail */}
        <div className="flex items-center justify-between mb-6 animate-rise" style={{ animationDelay: "120ms" }}>
          <div className="flex items-center gap-1">
            {(["all", "raw", "drafting", "scheduled"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-3 py-1.5 rounded-full text-[12.5px] font-medium transition-all"
                style={{
                  background: filter === f ? "var(--co-ink)" : "transparent",
                  color: filter === f ? "var(--co-paper)" : "var(--co-ink-soft)",
                }}
              >
                {f === "all" ? "All ideas" : f.charAt(0).toUpperCase() + f.slice(1)}
                <span className="ml-1.5 opacity-60">{f === "all" ? MOCK_IDEAS.length : MOCK_IDEAS.filter((i) => i.status === f).length}</span>
              </button>
            ))}
          </div>
          <div className="text-[12px]" style={{ color: "var(--co-ink-mute)" }}>
            Sorted by recency
          </div>
        </div>

        {/* Ideas list */}
        <div className="space-y-3">
          {filtered.map((idea, i) => (
            <IdeaCard key={idea.id} idea={idea} delay={150 + i * 40} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Idea card ────────────────────────────────────────────────────────────

function IdeaCard({ idea, delay }: { idea: Idea; delay: number }) {
  return (
    <article
      className="idea-card group rounded-xl border px-5 py-4 cursor-pointer relative overflow-hidden animate-rise"
      style={{
        background: "var(--co-card)",
        borderColor: "var(--co-rule)",
        animationDelay: `${delay}ms`,
      }}
    >
      {/* Status accent strip */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px] opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: statusColor(idea.status) }}
      />

      <div className="flex items-start justify-between gap-6">
        <div className="flex-1 min-w-0">
          {/* Meta row */}
          <div className="flex items-center gap-2 mb-2">
            <SourceChip label={idea.sourceLabel} tone={idea.source} />
            {idea.pillar && (
              <span className="text-[11px] font-medium" style={{ color: "var(--co-ink-mute)" }}>
                · {idea.pillar}
              </span>
            )}
            <span className="text-[11px]" style={{ color: "var(--co-ink-mute)" }}>
              · {idea.capturedAt}
            </span>
          </div>

          {/* Hook (if any) */}
          {idea.hook && (
            <div className="font-display text-[17px] font-semibold leading-snug mb-1.5" style={{ color: "var(--co-ink)" }}>
              {idea.hook}
            </div>
          )}

          {/* Body */}
          <p className="text-[14px] leading-relaxed" style={{ color: idea.hook ? "var(--co-ink-soft)" : "var(--co-ink)" }}>
            {idea.text}
          </p>
        </div>

        {/* Status pill */}
        <StatusPill status={idea.status} />
      </div>

      {/* Hover actions */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ borderColor: "var(--co-rule)" }}>
        <ActionBtn label="Draft" />
        <ActionBtn label="Schedule" />
        <ActionBtn label="Edit" />
        <div className="flex-1" />
        <ActionBtn label="Archive" subtle />
      </div>
    </article>
  );
}

function ActionBtn({ label, subtle }: { label: string; subtle?: boolean }) {
  return (
    <button
      className="px-2.5 py-1 rounded-md text-[11.5px] font-medium transition-colors"
      style={{
        color: subtle ? "var(--co-ink-mute)" : "var(--co-ink-soft)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--co-paper-soft)";
        e.currentTarget.style.color = "var(--co-ink)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.color = subtle ? "var(--co-ink-mute)" : "var(--co-ink-soft)";
      }}
    >
      {label}
    </button>
  );
}

function SourceChip({ label, tone, muted }: { label: string; tone?: Source; muted?: boolean }) {
  const color = muted ? "var(--co-ink-mute)" : sourceColor(tone || "self");
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full"
      style={{
        color,
        border: `1px solid ${muted ? "var(--co-rule)" : "transparent"}`,
        background: muted ? "transparent" : `color-mix(in srgb, ${color} 9%, transparent)`,
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

function StatusPill({ status }: { status: Status }) {
  const labels: Record<Status, string> = {
    raw: "Raw",
    drafting: "Drafting",
    scheduled: "Scheduled",
    shipped: "Shipped",
  };
  return (
    <span
      className="shrink-0 text-[10.5px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
      style={{
        color: statusColor(status),
        background: `color-mix(in srgb, ${statusColor(status)} 10%, transparent)`,
      }}
    >
      {labels[status]}
    </span>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function sourceColor(s: Source): string {
  switch (s) {
    case "reddit": return "var(--co-source-reddit)";
    case "linkedin": return "var(--co-source-linkedin)";
    case "twitter": return "var(--co-source-twitter)";
    case "fireflies": return "var(--co-accent)";
    default: return "var(--co-source-self)";
  }
}

function statusColor(s: Status): string {
  switch (s) {
    case "drafting": return "var(--co-status-drafting)";
    case "scheduled": return "var(--co-status-scheduled)";
    case "shipped": return "var(--co-status-shipped)";
    default: return "var(--co-status-raw)";
  }
}
