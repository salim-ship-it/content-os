"use client";

import { useState, useCallback, useEffect } from "react";
import { VOICE_QUESTIONS } from "@/lib/voice-questions";
import type { VoiceDraft, Answer, VoiceQuestion } from "@/lib/voice-questions";
import type { Pillars } from "@/lib/pillars";

const TOTAL = VOICE_QUESTIONS.length;

const DAY_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_FULL = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

function getWeekDates(today: Date): Date[] {
  const day = today.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function WeeklyCalendar({ schedule }: { schedule: Pillars["weekly_schedule"] }) {
  const today = new Date();
  const todayKey = today.toDateString();
  const weekDates = getWeekDates(today);

  const monthLabel = today.toLocaleString("default", { month: "long", year: "numeric" });
  const scheduleByDay: Record<string, Pillars["weekly_schedule"][number]> = {};
  for (const row of schedule) scheduleByDay[row.day] = row;

  return (
    <div className="rounded-xl border overflow-hidden mb-8" style={{ borderColor: "var(--vl-border)", background: "var(--vl-bg-card)" }}>
      <div
        className="flex items-center justify-between px-5 py-3"
        style={{ borderBottom: "1px solid var(--vl-border)" }}
      >
        <div className="flex items-center gap-3">
          <div className="text-sm font-bold" style={{ color: "var(--vl-text-heading)" }}>
            {monthLabel}
          </div>
          <div className="text-[11px] uppercase tracking-[0.2em]" style={{ color: "var(--vl-text-muted)" }}>
            Week view
          </div>
        </div>
        <div
          className="text-[11px] px-3 py-1 rounded-full"
          style={{ border: "1px solid var(--vl-border)", color: "var(--vl-text-muted)" }}
        >
          Today
        </div>
      </div>

      <div className="grid grid-cols-7" style={{ borderBottom: "1px solid var(--vl-border)" }}>
        {weekDates.map((date, i) => {
          const isToday = date.toDateString() === todayKey;
          return (
            <div
              key={i}
              className="flex flex-col items-center py-3"
              style={{ borderRight: i < 6 ? "1px solid var(--vl-border)" : "none" }}
            >
              <div
                className="text-[10px] font-bold tracking-[0.2em] mb-1"
                style={{ color: isToday ? "var(--vl-accent)" : "var(--vl-text-muted)" }}
              >
                {DAY_FULL[i]}
              </div>
              <div
                className="flex items-center justify-center rounded-full text-lg font-medium"
                style={{
                  width: 36,
                  height: 36,
                  background: isToday ? "var(--vl-accent)" : "transparent",
                  color: isToday ? "#fff" : "var(--vl-text-heading)",
                }}
              >
                {date.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-7" style={{ minHeight: "200px" }}>
        {DAY_ORDER.map((day, i) => {
          const row = scheduleByDay[day];
          const isToday = weekDates[i].toDateString() === todayKey;
          return (
            <div
              key={day}
              className="p-2"
              style={{
                borderRight: i < 6 ? "1px solid var(--vl-border)" : "none",
                background: isToday ? "var(--vl-accent-glow)" : "transparent",
              }}
            >
              {row && (
                <div
                  className="rounded-lg p-2 text-[11px]"
                  style={{ background: "var(--vl-accent-glow)", borderLeft: "3px solid var(--vl-accent)" }}
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span
                      className="inline-block rounded-full"
                      style={{
                        width: 8, height: 8, background: "var(--vl-accent)",
                        boxShadow: "0 0 6px rgba(249,115,22,0.6)",
                      }}
                    />
                    <span className="font-bold leading-tight" style={{ color: "var(--vl-text-heading)" }}>
                      {row.angle}
                    </span>
                  </div>
                  <div className="leading-snug mb-1.5" style={{ color: "var(--vl-accent)" }}>
                    {row.pillar}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <span
                      className="text-[9px] px-1.5 py-0.5 rounded-full"
                      style={{ background: "var(--vl-accent-glow)", color: "var(--vl-accent)" }}
                    >
                      {row.category}
                    </span>
                    <span
                      className="text-[9px] px-1.5 py-0.5 rounded-full"
                      style={{ border: "1px solid var(--vl-border)", color: "var(--vl-text-muted)" }}
                    >
                      {row.funnel}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PillarsView({ pillars }: { pillars: Pillars }) {
  const [p1, p2, p3] = pillars.pillars;
  const cardBorder = "var(--vl-border)";
  const cardBg = "var(--vl-bg-card)";
  const textMuted = "var(--vl-text-muted)";
  const textHeading = "var(--vl-text-heading)";

  const taglines: Record<string, string> = {
    what_i_do: "What I do",
    my_edge: "My edge",
    who_i_am: "Who I am",
  };

  return (
    <div className="mb-10">
      <div className="text-[11px] uppercase tracking-[0.22em] mb-3" style={{ color: "var(--vl-accent)" }}>
        Content pillars
      </div>
      <p className="text-sm mb-6" style={{ color: textMuted }}>
        Three topics. The more you post them, the more the right people associate them with you.
      </p>

      <div className="grid gap-4 mb-8">
        {pillars.pillars.map((p) => (
          <div key={p.name} className="rounded-xl border p-5" style={{ borderColor: cardBorder, background: cardBg }}>
            <div className="flex items-baseline justify-between mb-2">
              <h3 className="text-base font-bold" style={{ color: textHeading }}>{p.name}</h3>
              <span className="text-[11px] uppercase tracking-wider" style={{ color: textMuted }}>
                {taglines[p.role] ?? p.role}
              </span>
            </div>
            <p className="text-sm mb-3" style={{ color: "var(--vl-text)" }}>{p.description}</p>
            <ul className="text-sm space-y-1" style={{ color: textMuted }}>
              {p.purposes.map((purpose, i) => (
                <li key={i}>— {purpose}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="text-sm font-bold mb-3" style={{ color: textHeading }}>
        The Treadmill — 10 angles × 3 pillars
      </div>
      <div className="rounded-xl border overflow-x-auto mb-8" style={{ borderColor: cardBorder, background: cardBg }}>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ color: textMuted, borderBottom: `1px solid ${cardBorder}` }}>
              <th className="text-left px-3 py-2 font-medium">Angle</th>
              <th className="text-left px-3 py-2 font-medium">{p1?.name}</th>
              <th className="text-left px-3 py-2 font-medium">{p2?.name}</th>
              <th className="text-left px-3 py-2 font-medium">{p3?.name}</th>
              <th className="text-left px-3 py-2 font-medium">Category</th>
            </tr>
          </thead>
          <tbody>
            {pillars.treadmill.map((row) => (
              <tr key={row.angle} style={{ borderTop: `1px solid ${cardBorder}`, color: "var(--vl-text)" }}>
                <td className="px-3 py-2 font-medium">{row.angle}</td>
                <td className="px-3 py-2 align-top">{row.ideas.pillar_1}</td>
                <td className="px-3 py-2 align-top">{row.ideas.pillar_2}</td>
                <td className="px-3 py-2 align-top">{row.ideas.pillar_3}</td>
                <td className="px-3 py-2 align-top" style={{ color: textMuted }}>{row.category}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-sm font-bold mb-3" style={{ color: textHeading }}>Weekly schedule</div>
      <WeeklyCalendar schedule={pillars.weekly_schedule} />

      <div className="text-sm font-bold mb-3" style={{ color: textHeading }}>CTAs</div>
      <div className="grid gap-4">
        {(["main_offer", "newsletter", "waitlist"] as const).map((key) => (
          <div key={key} className="rounded-xl border p-5" style={{ borderColor: cardBorder, background: cardBg }}>
            <div className="text-[11px] uppercase tracking-[0.22em] mb-3" style={{ color: "var(--vl-accent)" }}>
              {key.replace("_", " ")}
            </div>
            <ul className="space-y-2 text-sm" style={{ color: "var(--vl-text)" }}>
              {pillars.ctas[key].map((cta, i) => (
                <li key={i}>— {cta}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Multi-text input ─────────────────────────────────────────────── */

function MultiTextInput({
  question, selected, onUpdate,
}: {
  question: VoiceQuestion;
  selected: string[];
  onUpdate: (value: string[]) => void;
}) {
  const [otherText, setOtherText] = useState("");

  function toggleOption(option: string) {
    const next = selected.includes(option)
      ? selected.filter((s) => s !== option)
      : [...selected, option];
    onUpdate(next);
  }

  function addOther() {
    if (otherText.trim() && !selected.includes(otherText.trim())) {
      onUpdate([...selected, otherText.trim()]);
      setOtherText("");
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3">
        {question.options?.map((option) => {
          const isSelected = selected.includes(option);
          return (
            <button
              key={option}
              onClick={() => toggleOption(option)}
              className="rounded-full px-3 py-1.5 text-sm transition-all"
              style={{
                borderWidth: isSelected ? "2px" : "1px",
                borderStyle: "solid",
                borderColor: isSelected ? "var(--vl-accent)" : "var(--vl-border)",
                color: isSelected ? "var(--vl-accent)" : "var(--vl-text-muted)",
                background: isSelected ? "var(--vl-accent-glow)" : "transparent",
                fontWeight: isSelected ? 600 : 400,
              }}
            >
              {isSelected ? "✓ " : ""}{option}
            </button>
          );
        })}
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 rounded-lg border px-3 py-2 text-sm outline-none"
          style={{ borderColor: "var(--vl-border)", color: "var(--vl-text)", background: "var(--vl-bg)" }}
          placeholder="Add your own…"
          value={otherText}
          onChange={(e) => setOtherText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); addOther(); }
          }}
        />
        <button
          onClick={addOther}
          className="rounded-lg px-4 py-2 text-sm font-semibold"
          style={{ background: "var(--vl-text-heading)", color: "#fff" }}
        >
          Add
        </button>
      </div>
    </div>
  );
}

/* ─── Building loader ──────────────────────────────────────────────── */

function BuildingLoader() {
  const STEPS = [
    "Reading your answers…",
    "Detecting sentence rhythm…",
    "Extracting signature phrases…",
    "Drafting your voice profile…",
    "Generating your content pillars…",
  ];
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timers = STEPS.map((_, i) =>
      setTimeout(() => setActive((a) => Math.max(a, i + 1)), 900 * (i + 1)),
    );
    return () => { timers.forEach(clearTimeout); };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "color-mix(in srgb, var(--vl-bg) 85%, transparent)", backdropFilter: "blur(6px)" }}>
      <div
        className="w-full max-w-md rounded-2xl border p-7"
        style={{
          background: "var(--vl-bg)",
          borderColor: "var(--vl-border)",
          boxShadow: "0 30px 80px -20px rgba(0,0,0,0.18), 0 8px 24px -8px rgba(0,0,0,0.08)",
          animation: "vl-modal-in 0.4s cubic-bezier(0.2, 0.9, 0.2, 1) both",
        }}
      >
        <h2 className="text-xl font-bold mb-1" style={{ color: "var(--vl-text-heading)" }}>
          Building your voice profile…
        </h2>
        <p className="text-sm mb-5" style={{ color: "var(--vl-text-muted)" }}>
          This usually takes 15–30 seconds.
        </p>

        <div className="relative h-[3px] rounded-full overflow-hidden mb-5" style={{ background: "var(--vl-border)" }}>
          <div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              width: "40%",
              background: "var(--vl-accent)",
              animation: "vl-loader-bar 1.4s ease-in-out infinite",
            }}
          />
        </div>

        <ul className="space-y-2">
          {STEPS.map((s, i) => {
            const done = i < active;
            const isActive = i === active;
            return (
              <li key={s} className="flex items-center gap-2.5 text-[13.5px]" style={{
                color: done ? "#16a34a" : isActive ? "var(--vl-accent)" : "var(--vl-text-muted)",
              }}>
                <span className="w-4 h-4 inline-flex items-center justify-center">
                  {done ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "vl-pop 0.35s cubic-bezier(0.2, 0.9, 0.2, 1) both" }}>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : isActive ? (
                    <span className="w-2 h-2 rounded-full" style={{
                      background: "var(--vl-accent)",
                      animation: "vl-pulse-dot 1.2s ease-in-out infinite",
                    }} />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--vl-text-muted)", opacity: 0.4 }} />
                  )}
                </span>
                {s}
              </li>
            );
          })}
        </ul>
      </div>

      <style>{`
        @keyframes vl-modal-in {
          from { opacity: 0; transform: scale(0.97) translateY(6px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes vl-loader-bar {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(350%); }
        }
        @keyframes vl-pop {
          0%   { opacity: 0; transform: scale(0.4); }
          60%  { opacity: 1; transform: scale(1.2); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes vl-pulse-dot {
          0%, 100% { opacity: 0.45; transform: scale(0.85); }
          50%      { opacity: 1; transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}

/* ─── Markdown renderer for the profile output ─────────────────────── */

type ParsedSection = { number: number | null; title: string; body: string };
type ParsedDoc = { title: string; sections: ParsedSection[] };

function parseProfile(md: string): ParsedDoc {
  const lines = md.split("\n");
  let title = "";
  const sections: ParsedSection[] = [];
  let current: ParsedSection | null = null;

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.startsWith("# ") && !title) {
      title = line.slice(2).trim();
      continue;
    }
    if (line.startsWith("## ")) {
      const text = line.slice(3).trim();
      const m = text.match(/^(\d+)\.\s+(.+)/);
      if (current) sections.push(current);
      current = m ? { number: parseInt(m[1], 10), title: m[2], body: "" } : { number: null, title: text, body: "" };
      continue;
    }
    if (/^---+$/.test(line.trim())) continue;
    if (current) current.body += raw + "\n";
  }
  if (current) sections.push(current);
  return { title, sections };
}

function renderInline(text: string): React.ReactNode {
  // Handle **bold** and *italic* in a single pass
  const parts: React.ReactNode[] = [];
  let i = 0;
  let buffer = "";
  let key = 0;
  function flush() { if (buffer) { parts.push(buffer); buffer = ""; } }
  while (i < text.length) {
    if (text.startsWith("**", i)) {
      const end = text.indexOf("**", i + 2);
      if (end > -1) {
        flush();
        parts.push(<strong key={key++} style={{ color: "var(--vl-text-heading)" }}>{text.slice(i + 2, end)}</strong>);
        i = end + 2; continue;
      }
    }
    if (text[i] === "*" && text[i - 1] !== "*" && text[i + 1] !== "*") {
      const end = text.indexOf("*", i + 1);
      if (end > -1) {
        flush();
        parts.push(<em key={key++}>{text.slice(i + 1, end)}</em>);
        i = end + 1; continue;
      }
    }
    buffer += text[i]; i++;
  }
  flush();
  return parts;
}

function renderBlock(block: string, key: React.Key): React.ReactNode {
  const trimmed = block.trim();
  if (!trimmed) return null;

  // Blockquote
  if (trimmed.startsWith("> ")) {
    const inner = trimmed.split("\n").map((l) => l.replace(/^> ?/, "")).join(" ");
    return (
      <blockquote key={key} className="pl-5 border-l-[3px] my-3 py-2 text-base italic leading-relaxed" style={{ borderColor: "var(--vl-accent)", color: "var(--vl-text)" }}>
        “{renderInline(inner)}”
      </blockquote>
    );
  }

  // Bulleted list
  if (trimmed.split("\n").every((l) => /^[-*•]\s+/.test(l.trim()))) {
    const items = trimmed.split("\n").map((l) => l.trim().replace(/^[-*•]\s+/, ""));
    return (
      <ul key={key} className="space-y-1.5 my-2">
        {items.map((it, i) => (
          <li key={i} className="flex gap-3 leading-relaxed">
            <span className="shrink-0 mt-[10px] w-1 h-1 rounded-full" style={{ background: "var(--vl-accent)" }} />
            <span style={{ color: "var(--vl-text)" }}>{renderInline(it)}</span>
          </li>
        ))}
      </ul>
    );
  }

  // Bold-prefixed callout: starts with `**Some label:**`
  const calloutMatch = trimmed.match(/^\*\*([^*]+):\*\*\s*([\s\S]*)/);
  if (calloutMatch) {
    return (
      <div key={key} className="rounded-xl px-4 py-3 my-3" style={{ background: "var(--vl-accent-glow)", border: "1px solid rgba(249,115,22,0.25)" }}>
        <div className="text-[11px] uppercase tracking-wider font-semibold mb-1" style={{ color: "var(--vl-accent)" }}>
          {calloutMatch[1]}
        </div>
        <div className="text-[15px] leading-relaxed" style={{ color: "var(--vl-text-heading)" }}>
          {renderInline(calloutMatch[2])}
        </div>
      </div>
    );
  }

  // Default: paragraph
  return (
    <p key={key} className="leading-[1.7] my-2" style={{ color: "var(--vl-text)" }}>
      {renderInline(trimmed)}
    </p>
  );
}

function ProfileMarkdown({ source }: { source: string }) {
  const doc = parseProfile(source);
  return (
    <div>
      {doc.title && (
        <div className="mb-10">
          <h1 className="text-3xl font-bold leading-tight tracking-tight" style={{ color: "var(--vl-text-heading)", fontFamily: "var(--font-space-grotesk), sans-serif" }}>
            {doc.title}
          </h1>
          <div className="mt-4 h-px" style={{ background: "var(--vl-border)" }} />
        </div>
      )}
      {doc.sections.map((s) => (
        <section key={`${s.number ?? "x"}-${s.title}`} className="mb-10">
          <div className="flex items-baseline gap-3 mb-3">
            {s.number !== null && (
              <span className="text-xs font-bold tabular-nums" style={{ color: "var(--vl-accent)" }}>
                {String(s.number).padStart(2, "0")}
              </span>
            )}
            <h2 className="text-xl font-bold tracking-tight" style={{ color: "var(--vl-text-heading)", fontFamily: "var(--font-space-grotesk), sans-serif" }}>
              {s.title}
            </h2>
          </div>
          <div className="space-y-1">
            {s.body.split(/\n\s*\n+/).map((block, i) => renderBlock(block, i))}
          </div>
          <div className="mt-6 h-px" style={{ background: "var(--vl-border)" }} />
        </section>
      ))}
    </div>
  );
}

/* ─── Main client ─────────────────────────────────────────────────── */

export function VoiceOnboardingClient({
  initialDraft,
  initialProfile = null,
  initialPillars = null,
}: {
  initialDraft: VoiceDraft;
  initialProfile?: string | null;
  initialPillars?: Pillars | null;
}) {
  const [answers, setAnswers] = useState<Record<string, Answer>>(initialDraft.answers);
  const [step, setStep] = useState(initialProfile ? TOTAL : 0);
  const [generating, setGenerating] = useState(false);
  const [profile, setProfile] = useState<string | null>(initialProfile);
  const [pillars, setPillars] = useState<Pillars | null>(initialPillars);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(Boolean(initialProfile));

  const isComplete = step >= TOTAL;
  const question = isComplete ? null : VOICE_QUESTIONS[step];

  const saveDraft = useCallback(async (updated: Record<string, Answer>) => {
    try {
      await fetch("/api/voice", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: updated }),
      });
    } catch {}
  }, []);

  function setAnswer(id: string, value: Answer) {
    const updated = { ...answers, [id]: value };
    setAnswers(updated);
    saveDraft(updated);
  }

  function next() { if (step < TOTAL) setStep(step + 1); }
  function back() {
    if (profile) { setProfile(null); return; }
    if (step > 0) setStep(step - 1);
  }
  function skip() { next(); }

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/voice/generate", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        setProfile(data.profile);
        if (data.pillars) setPillars(data.pillars);
        setSaved(true);
      } else {
        setError(data.error || "Generation failed");
      }
    } catch {
      setError("Network error during generation");
    } finally {
      setGenerating(false);
    }
  }

  // Cmd+Enter to advance
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        if (isComplete && !profile) handleGenerate();
        else if (hasAnswer) next();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, answers]);

  const currentAnswer = question ? answers[question.id] : undefined;
  const hasAnswer = currentAnswer !== undefined && currentAnswer !== "" &&
    !(Array.isArray(currentAnswer) && currentAnswer.length === 0);

  /* ─── Render input ──────────────────────────────────────── */

  function renderInput() {
    if (!question) return null;
    switch (question.type) {
      case "long-text":
        return (
          <textarea
            className="w-full rounded-xl border px-4 py-3 text-base outline-none resize-none transition-all"
            style={{
              borderColor: "var(--vl-border)",
              color: "var(--vl-text-heading)",
              background: "var(--vl-bg)",
              minHeight: "160px",
              lineHeight: 1.55,
            }}
            rows={6}
            placeholder="Type your answer…"
            value={(currentAnswer as string) || ""}
            onChange={(e) => setAnswer(question.id, e.target.value)}
            autoFocus
            onFocus={(e) => { e.currentTarget.style.borderColor = "var(--vl-accent)"; e.currentTarget.style.boxShadow = "0 0 0 4px var(--vl-accent-glow)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "var(--vl-border)"; e.currentTarget.style.boxShadow = "none"; }}
          />
        );

      case "short-text":
        return (
          <input
            className="w-full rounded-xl border px-4 py-3 text-base outline-none transition-all"
            style={{
              borderColor: "var(--vl-border)",
              color: "var(--vl-text-heading)",
              background: "var(--vl-bg)",
            }}
            placeholder="Type your answer…"
            value={(currentAnswer as string) || ""}
            onChange={(e) => setAnswer(question.id, e.target.value)}
            autoFocus
            onFocus={(e) => { e.currentTarget.style.borderColor = "var(--vl-accent)"; e.currentTarget.style.boxShadow = "0 0 0 4px var(--vl-accent-glow)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "var(--vl-border)"; e.currentTarget.style.boxShadow = "none"; }}
          />
        );

      case "single":
        return (
          <div className="flex flex-col gap-2.5">
            {question.options?.map((option) => {
              const selected = currentAnswer === option;
              return (
                <button
                  key={option}
                  onClick={() => setAnswer(question.id, option)}
                  className="text-left rounded-xl border px-4 py-3 text-sm transition-all"
                  style={{
                    borderColor: selected ? "var(--vl-accent)" : "var(--vl-border)",
                    borderWidth: "1.5px",
                    color: selected ? "var(--vl-accent)" : "var(--vl-text)",
                    background: selected ? "var(--vl-accent-glow)" : "var(--vl-bg)",
                    fontWeight: selected ? 600 : 500,
                  }}
                >
                  {option}
                </button>
              );
            })}
          </div>
        );

      case "multi-text": {
        const selected = Array.isArray(currentAnswer) ? currentAnswer : [];
        return <MultiTextInput question={question} selected={selected} onUpdate={(v) => setAnswer(question.id, v)} />;
      }

      default:
        return null;
    }
  }

  /* ─── Profile output view ───────────────────────────────── */

  if (profile) {
    return (
      <div className="min-h-full">
        {/* Sticky action header */}
        <div className="sticky top-0 z-20 -mx-10 px-10 py-3 border-b backdrop-blur" style={{ borderColor: "var(--vl-border)", background: "color-mix(in srgb, var(--vl-bg) 85%, transparent)" }}>
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold px-2.5 py-1 rounded-full" style={{ background: "var(--vl-accent-glow)", color: "var(--vl-accent)" }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--vl-accent)" }} />
                Voice profile generated
              </span>
              {saved && <span className="text-[12.5px]" style={{ color: "#16a34a" }}>✓ Saved</span>}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="px-3 py-1.5 rounded-lg text-[12.5px] font-medium transition-colors"
                style={{ color: "var(--vl-text-muted)" }}
              >
                {generating ? "Regenerating…" : "Regenerate"}
              </button>
              <button
                onClick={() => { setProfile(null); setPillars(null); setSaved(false); setStep(0); }}
                className="px-3 py-1.5 rounded-lg text-[12.5px] font-medium transition-colors"
                style={{ color: "var(--vl-text-muted)" }}
              >
                Edit answers
              </button>
              <a
                href="/"
                className="ml-2 px-4 py-1.5 rounded-lg text-[13px] font-semibold transition-all"
                style={{ background: "var(--vl-text-heading)", color: "#fff" }}
              >
                Back to home →
              </a>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto pt-10 pb-24">
          <ProfileMarkdown source={profile} />
          {pillars && <PillarsView pillars={pillars} />}

          {error && (
            <div className="text-sm mb-4 px-4 py-2 rounded-lg" style={{ background: "#fef2f2", color: "#dc2626" }}>
              {error}
            </div>
          )}

          <div className="mt-12 pt-8 border-t flex items-center justify-between" style={{ borderColor: "var(--vl-border)" }}>
            <span className="text-[12.5px]" style={{ color: "var(--vl-text-muted)" }}>
              {saved ? "✓ Saved to your profile" : ""}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: "var(--vl-bg-card)", color: "var(--vl-text)", border: "1px solid var(--vl-border)" }}
              >
                {generating ? "Regenerating…" : "Regenerate"}
              </button>
              <button
                onClick={() => { setProfile(null); setPillars(null); setSaved(false); setStep(0); }}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: "var(--vl-bg-card)", color: "var(--vl-text)", border: "1px solid var(--vl-border)" }}
              >
                Edit answers
              </button>
              <a
                href="/"
                className="px-5 py-2 rounded-lg text-sm font-semibold"
                style={{ background: "var(--vl-text-heading)", color: "#fff" }}
              >
                Back to home →
              </a>
            </div>
          </div>
        </div>

        {generating && <BuildingLoader />}
      </div>
    );
  }

  /* ─── Final step ────────────────────────────────────────── */

  if (isComplete) {
    return (
      <>
        <div className="min-h-full flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-xl text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-5" style={{ background: "var(--vl-accent-glow)" }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--vl-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div className="text-[11px] uppercase tracking-[0.22em] mb-2" style={{ color: "var(--vl-accent)" }}>
              Voice profile
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--vl-text-heading)" }}>
              All questions answered
            </h2>
            <p className="text-sm mb-6" style={{ color: "var(--vl-text-muted)" }}>
              Ready to generate your voice profile from your answers.
            </p>
            {error && (
              <div className="text-sm mb-4 px-4 py-2 rounded-lg" style={{ background: "#fef2f2", color: "#dc2626" }}>
                {error}
              </div>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={back}
                className="px-5 py-3 rounded-xl text-sm font-medium"
                style={{ background: "var(--vl-bg-card)", color: "var(--vl-text)", border: "1px solid var(--vl-border)" }}
              >
                Back
              </button>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="px-6 py-3 rounded-xl text-sm font-semibold transition-all"
                style={{ background: "var(--vl-text-heading)", color: "#fff", opacity: generating ? 0.6 : 1 }}
              >
                {generating ? "Generating…" : "Generate voice profile →"}
              </button>
            </div>
          </div>
        </div>
        {generating && <BuildingLoader />}
      </>
    );
  }

  /* ─── Question view ─────────────────────────────────────── */

  const progress = ((step + 1) / TOTAL) * 100;

  return (
    <div className="min-h-full flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl">
        {/* Card header — slim progress + counter */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] uppercase tracking-[0.2em] font-semibold" style={{ color: "var(--vl-accent)" }}>
              Voice profile
            </span>
            <span className="text-[12px] font-medium" style={{ color: "var(--vl-text-muted)" }}>
              Question {step + 1} of {TOTAL}
            </span>
          </div>
          <div className="relative h-[3px] rounded-full overflow-hidden" style={{ background: "var(--vl-border)" }}>
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-500 ease-out"
              style={{ width: `${progress}%`, background: "var(--vl-accent)" }}
            />
          </div>
        </div>

        {/* Question card */}
        <div
          key={step}
          className="rounded-2xl border p-8"
          style={{
            background: "var(--vl-bg)",
            borderColor: "var(--vl-border)",
            boxShadow: "0 1px 0 rgba(255,255,255,0.5) inset, 0 8px 28px -16px rgba(15,23,42,0.18), 0 2px 6px -2px rgba(15,23,42,0.05)",
            animation: "vl-step-in 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) both",
          }}
        >
          <h2 className="text-2xl font-bold leading-snug mb-6 tracking-tight" style={{ color: "var(--vl-text-heading)", fontFamily: "var(--font-space-grotesk), sans-serif" }}>
            {question!.question}
          </h2>

          <div className="mb-7">{renderInput()}</div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-5 border-t" style={{ borderColor: "var(--vl-border)" }}>
            <button
              onClick={back}
              disabled={step === 0}
              className="px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ color: "var(--vl-text-muted)" }}
            >
              ← Back
            </button>
            <div className="flex items-center gap-2 text-[11.5px]" style={{ color: "var(--vl-text-muted)" }}>
              <kbd className="px-1.5 py-0.5 rounded text-[10px] font-medium border" style={{ borderColor: "var(--vl-border)", color: "var(--vl-text)" }}>⌘</kbd>
              <kbd className="px-1.5 py-0.5 rounded text-[10px] font-medium border" style={{ borderColor: "var(--vl-border)", color: "var(--vl-text)" }}>Enter</kbd>
              <span>to continue</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={skip}
                className="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ color: "var(--vl-text-muted)" }}
              >
                Skip
              </button>
              <button
                onClick={next}
                disabled={!hasAnswer}
                className="px-5 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: hasAnswer ? "var(--vl-text-heading)" : "var(--vl-bg-card)",
                  color: hasAnswer ? "#fff" : "var(--vl-text-muted)",
                }}
              >
                {step === TOTAL - 1 ? "Finish →" : "Next →"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes vl-step-in {
          from { opacity: 0; transform: translateY(10px) scale(0.99); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
