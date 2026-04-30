"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type AssetType =
  | "Guide"
  | "Framework"
  | "Swipe File"
  | "Template"
  | "Playbook"
  | "Checklist"
  | "Tool / Script"
  | "Email course";

type OutputFormat =
  | "notion-markdown"
  | "vercel-mdx"
  | "newsletter-plaintext"
  | "google-doc-markdown"
  | "miro-outline";

type Section = { id: string; name: string; description: string; defaultOn: boolean };

type CtaType = "newsletter" | "book-a-call" | "waitlist" | "product" | "community" | "freebie" | "custom";
const CTA_OPTIONS: { id: CtaType; label: string; placeholder: string }[] = [
  { id: "newsletter", label: "Newsletter", placeholder: "yournewsletter.substack.com" },
  { id: "book-a-call", label: "Book a call", placeholder: "calendly.com/you/30min" },
  { id: "waitlist", label: "Waitlist", placeholder: "you.com/waitlist" },
  { id: "product", label: "Product / Course", placeholder: "you.com/product" },
  { id: "community", label: "Community", placeholder: "discord.gg/... or slack link" },
  { id: "freebie", label: "Another free asset", placeholder: "link to the next freebie" },
  { id: "custom", label: "Custom", placeholder: "what / where should the reader go?" },
];

const ASSET_TYPES: { id: AssetType; blurb: string; icon: string }[] = [
  { id: "Guide", blurb: "Teach one thing end-to-end", icon: "📘" },
  { id: "Framework", blurb: "Named mental model, 3-5 parts", icon: "◎" },
  { id: "Swipe File", blurb: "10-25 copy-pasteable examples", icon: "📎" },
  { id: "Template", blurb: "Fill-in-the-blanks asset", icon: "▤" },
  { id: "Playbook", blurb: "Sequence of plays for a situation", icon: "📓" },
  { id: "Checklist", blurb: "Verifiable list, 10-30 items", icon: "✓" },
  { id: "Tool / Script", blurb: "Runnable code / commands", icon: "⌘" },
  { id: "Email course", blurb: "5-day drip sequence", icon: "✉" },
];

const OUTPUT_FORMATS: { id: OutputFormat; label: string; ext: string }[] = [
  { id: "notion-markdown", label: "Markdown (Notion)", ext: "md" },
  { id: "vercel-mdx", label: "MDX (Vercel site)", ext: "mdx" },
  { id: "newsletter-plaintext", label: "Plain text (newsletter)", ext: "txt" },
  { id: "google-doc-markdown", label: "Markdown (Google Doc)", ext: "md" },
  { id: "miro-outline", label: "Miro outline", ext: "md" },
];

const ASSET_SECTIONS: Record<AssetType, Section[]> = {
  Guide: [
    { id: "hook", name: "Hook + promise", description: "Opening + what they walk away with", defaultOn: true },
    { id: "problem", name: "The problem", description: "Why this matters, who struggles", defaultOn: true },
    { id: "steps", name: "Step-by-step", description: "The actual walkthrough", defaultOn: true },
    { id: "example", name: "Worked example", description: "One concrete run-through", defaultOn: true },
    { id: "mistakes", name: "Common mistakes", description: "What people get wrong", defaultOn: true },
    { id: "author_intro", name: "Author intro page", description: "Who you are + why listen", defaultOn: false },
    { id: "cta", name: "Closing CTA", description: "Closing call to action — pick destination below", defaultOn: false },
  ],
  Framework: [
    { id: "name_explainer", name: "The framework (named)", description: "Name + one-line definition", defaultOn: true },
    { id: "components", name: "Each component", description: "3-5 components with what/why/how", defaultOn: true },
    { id: "connections", name: "How they connect", description: "Text diagram of the flow", defaultOn: true },
    { id: "when_to_use", name: "When to use it", description: "Situations this applies to", defaultOn: true },
    { id: "example", name: "Worked example", description: "Full application of the framework", defaultOn: true },
    { id: "author_intro", name: "Author intro page", description: "Who you are + why listen", defaultOn: false },
    { id: "cta", name: "Closing CTA", description: "Closing call to action — pick destination below", defaultOn: false },
  ],
  "Swipe File": [
    { id: "intro", name: "Intro + how to use", description: "What it is, how to pick from it", defaultOn: true },
    { id: "examples", name: "The examples (10-20)", description: "Raw text + one-line why-it-works", defaultOn: true },
    { id: "tags", name: "Categorization / index", description: "Groupings by situation", defaultOn: false },
    { id: "author_intro", name: "Author intro page", description: "Who you are + why listen", defaultOn: false },
    { id: "cta", name: "Closing CTA", description: "Closing call to action — pick destination below", defaultOn: false },
  ],
  Template: [
    { id: "intro", name: "What this template is for", description: "Problem + ideal use case", defaultOn: true },
    { id: "how_to_use", name: "How to use it", description: "Step-by-step instructions", defaultOn: true },
    { id: "template", name: "The template", description: "Fill-in-the-blanks with [BRACKETS]", defaultOn: true },
    { id: "examples", name: "2-3 worked examples", description: "Filled-in examples", defaultOn: true },
    { id: "author_intro", name: "Author intro page", description: "Who you are + why listen", defaultOn: false },
    { id: "cta", name: "Closing CTA", description: "Closing call to action — pick destination below", defaultOn: false },
  ],
  Playbook: [
    { id: "when", name: "When to run this playbook", description: "Triggering situation + prereqs", defaultOn: true },
    { id: "plays", name: "The plays", description: "Trigger → action → result → measure", defaultOn: true },
    { id: "measurement", name: "How to measure success", description: "Concrete metrics + cadence", defaultOn: true },
    { id: "combining", name: "Combining plays", description: "How plays interact / escalate", defaultOn: false },
    { id: "author_intro", name: "Author intro page", description: "Who you are + why listen", defaultOn: false },
    { id: "cta", name: "Closing CTA", description: "Closing call to action — pick destination below", defaultOn: false },
  ],
  Checklist: [
    { id: "intro", name: "Intro + how to use", description: "Why + when to run it", defaultOn: true },
    { id: "items", name: "The checklist items", description: "10-30 items grouped in 2-5 sections", defaultOn: true },
    { id: "scoring", name: "Scoring / rubric", description: "Optional scoring", defaultOn: false },
    { id: "author_intro", name: "Author intro page", description: "Who you are + why listen", defaultOn: false },
    { id: "cta", name: "Closing CTA", description: "Closing call to action — pick destination below", defaultOn: false },
  ],
  "Tool / Script": [
    { id: "intro", name: "What this tool does", description: "Problem + end state", defaultOn: true },
    { id: "prereqs", name: "Prerequisites", description: "What you need before running", defaultOn: true },
    { id: "code", name: "The code / commands", description: "Actual tool in fenced blocks", defaultOn: true },
    { id: "run", name: "How to run", description: "Step-by-step run instructions", defaultOn: true },
    { id: "output", name: "Expected output", description: "What success looks like", defaultOn: true },
    { id: "adapt", name: "How to adapt", description: "Pointers for customizing", defaultOn: false },
    { id: "author_intro", name: "Author intro page", description: "Who you are + why listen", defaultOn: false },
    { id: "cta", name: "Closing CTA", description: "Closing call to action — pick destination below", defaultOn: false },
  ],
  "Email course": [
    { id: "overview", name: "Course overview", description: "What it covers + lesson outline", defaultOn: true },
    { id: "day1", name: "Day 1 lesson", description: "Lesson 1 email", defaultOn: true },
    { id: "day2", name: "Day 2 lesson", description: "Lesson 2 email", defaultOn: true },
    { id: "day3", name: "Day 3 lesson", description: "Lesson 3 email", defaultOn: true },
    { id: "day4", name: "Day 4 lesson", description: "Lesson 4 email", defaultOn: true },
    { id: "day5", name: "Day 5 lesson", description: "Lesson 5 + final CTA", defaultOn: true },
    { id: "author_intro", name: "Welcome email (day 0)", description: "Opening intro email", defaultOn: false },
  ],
};

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "lead-magnet";
}

type GeneratedMagnet = {
  id: string;
  title: string;
  topic: string;
  asset_type: AssetType;
  output_format: OutputFormat;
  content: string;
  created_at: string;
};

export function CreateLeadMagnetClient({ hasVoiceProfile }: { hasVoiceProfile: boolean }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [assetType, setAssetType] = useState<AssetType>("Guide");
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [context, setContext] = useState("");
  const [ctaType, setCtaType] = useState<CtaType>("newsletter");
  const [ctaDestination, setCtaDestination] = useState("");
  const [enabledSections, setEnabledSections] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(ASSET_SECTIONS["Guide"].map((s) => [s.id, s.defaultOn])),
  );
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<GeneratedMagnet | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onAssetTypeChange(t: AssetType) {
    setAssetType(t);
    setEnabledSections(
      Object.fromEntries(ASSET_SECTIONS[t].map((s) => [s.id, s.defaultOn])),
    );
  }

  const sections = ASSET_SECTIONS[assetType];
  const enabledList = useMemo(() => sections.filter((s) => enabledSections[s.id]), [sections, enabledSections]);

  const canNext1 = !!assetType;
  const canNext2 = topic.trim().length > 0 && audience.trim().length > 0;
  const canGenerate = enabledList.length > 0;

  async function handleGenerate() {
    if (!canGenerate) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/lead-magnets/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: topic,
          topic,
          audience,
          context,
          ctaType,
          ctaDestination,
          assetType,
          outputFormat: "notion-markdown",
          sections: enabledList.map((s) => s.id),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setResult(data.magnet);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setGenerating(false);
    }
  }

  function downloadFile() {
    if (!result) return;
    const ext = OUTPUT_FORMATS.find((f) => f.id === result.output_format)?.ext ?? "md";
    const blob = new Blob([result.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slugify(result.title)}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col">
      {/* Page header */}
      <div className="flex items-center justify-between mb-4 gap-4">
        <div>
          <Link href="/lead-magnets" className="text-xs" style={{ color: "var(--vl-text-muted)" }}>
            ← Lead Magnets
          </Link>
          <h1 className="text-2xl font-bold mt-1" style={{ color: "var(--vl-text-heading)" }}>
            Create a lead magnet
          </h1>
        </div>
      </div>

      {/* Split canvas */}
      <div
        className="grid gap-0 border rounded-2xl overflow-hidden bg-white"
        style={{ borderColor: "var(--vl-border)", gridTemplateColumns: "minmax(0,1fr)", minHeight: 620 }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr]" style={{ minHeight: 620 }}>
          {/* LEFT: input panel */}
          <div className="p-5 flex flex-col" style={{ borderRight: "1px solid var(--vl-border)" }}>
            <StepTabs step={step} onStep={(n) => { if (!result) setStep(n); }} />

            {!result && step === 1 && (
              <Step1
                assetType={assetType}
                onChange={onAssetTypeChange}
              />
            )}
            {!result && step === 2 && (
              <Step2
                topic={topic}
                audience={audience}
                context={context}
                assetType={assetType}
                hasVoiceProfile={hasVoiceProfile}
                onChange={(patch) => {
                  if (patch.topic !== undefined) setTopic(patch.topic);
                  if (patch.audience !== undefined) setAudience(patch.audience);
                  if (patch.context !== undefined) setContext(patch.context);
                }}
              />
            )}
            {!result && step === 3 && (
              <Step3
                sections={sections}
                enabled={enabledSections}
                onToggle={(id) =>
                  setEnabledSections((s) => ({ ...s, [id]: !s[id] }))
                }
                ctaType={ctaType}
                ctaDestination={ctaDestination}
                onCtaChange={(patch) => {
                  if (patch.ctaType !== undefined) setCtaType(patch.ctaType);
                  if (patch.ctaDestination !== undefined) setCtaDestination(patch.ctaDestination);
                }}
              />
            )}
            {result && (
              <ResultControls
                result={result}
                onDownload={downloadFile}
                onRegenerate={() => { setResult(null); setStep(3); }}
              />
            )}

            {/* Footer nav */}
            {!result && (
              <div className="mt-auto pt-4 flex items-center gap-2" style={{ borderTop: "1px dashed var(--vl-border)" }}>
                <div className="h-4" />
                <button
                  onClick={() => setStep(Math.max(1, step - 1) as 1 | 2 | 3)}
                  disabled={step === 1}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40"
                  style={{ background: "transparent", color: "var(--vl-text-muted)" }}
                >
                  ← Back
                </button>
                <div className="flex-1" />
                {step < 3 && (
                  <button
                    onClick={() => setStep((step + 1) as 1 | 2 | 3)}
                    disabled={(step === 1 && !canNext1) || (step === 2 && !canNext2)}
                    className="px-4 py-1.5 rounded-lg text-xs font-bold disabled:opacity-40"
                    style={{ background: "var(--vl-accent)", color: "white" }}
                  >
                    Next →
                  </button>
                )}
                {step === 3 && (
                  <button
                    onClick={handleGenerate}
                    disabled={generating || !canGenerate}
                    className="px-5 py-1.5 rounded-lg text-xs font-bold disabled:opacity-40"
                    style={{ background: "var(--vl-accent)", color: "white" }}
                  >
                    {generating ? "Generating... (30-60s)" : "✨ Generate"}
                  </button>
                )}
              </div>
            )}
            {error && <div className="mt-2 text-xs" style={{ color: "#ef4444" }}>{error}</div>}
          </div>

          {/* RIGHT: live preview */}
          <div
            className="p-5 overflow-auto"
            style={{
              background:
                "repeating-linear-gradient(45deg, transparent, transparent 14px, rgba(0,0,0,0.015) 14px, rgba(0,0,0,0.015) 16px)",
              maxHeight: "70vh",
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span
                className="inline-block w-3 h-3 rounded-sm"
                style={{ background: "var(--vl-accent)" }}
              />
              <div
                className="text-[11px] uppercase tracking-wider font-bold"
                style={{ color: "var(--vl-text-muted)", letterSpacing: 1 }}
              >
                {result ? "Generated" : "Live preview"}
              </div>
              <div className="flex-1" />
              <div className="text-[11px] italic" style={{ color: "var(--vl-text-muted)" }}>
                {result ? "ready to copy or push" : step === 1 ? "pick a type to start" : "updates as you fill"}
              </div>
            </div>

            {result ? (
              <PreviewRendered content={result.content} />
            ) : (
              <PreviewSkeleton
                step={step}
                assetType={assetType}
                title={topic}
                topic={topic}
                audience={audience}
                enabledList={enabledList}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- STEP TABS ---------- */
function StepTabs({ step, onStep }: { step: 1 | 2 | 3; onStep: (n: 1 | 2 | 3) => void }) {
  const labels: Record<1 | 2 | 3, string> = { 1: "Type", 2: "Topic + voice", 3: "Assets" };
  return (
    <div className="flex gap-2 mb-5">
      {([1, 2, 3] as const).map((n) => {
        const active = step === n;
        const done = step > n;
        return (
          <button
            key={n}
            onClick={() => onStep(n)}
            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-semibold transition-colors"
            style={{
              background: active ? "var(--vl-accent-glow)" : "transparent",
              border: active
                ? "2px solid var(--vl-accent)"
                : "1px solid var(--vl-border)",
              color: active ? "var(--vl-accent)" : "var(--vl-text-muted)",
            }}
          >
            <span
              className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold"
              style={{
                background: done ? "var(--vl-accent)" : active ? "white" : "transparent",
                color: done ? "white" : active ? "var(--vl-accent)" : "var(--vl-text-muted)",
                border: done ? "none" : `1px solid ${active ? "var(--vl-accent)" : "var(--vl-border)"}`,
              }}
            >
              {done ? "✓" : n}
            </span>
            {labels[n]}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- STEP 1 ---------- */
function Step1({ assetType, onChange }: { assetType: AssetType; onChange: (t: AssetType) => void }) {
  return (
    <div>
      <h2 className="text-lg font-bold" style={{ color: "var(--vl-text-heading)" }}>1 · What are you creating?</h2>
      <p className="text-xs mt-0.5 italic" style={{ color: "var(--vl-text-muted)" }}>the preview on the right will take shape →</p>
      <div className="grid grid-cols-2 gap-2 mt-4">
        {ASSET_TYPES.map((t) => {
          const active = assetType === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              className="text-left rounded-lg p-2.5 transition-all"
              style={{
                border: active ? "2px solid var(--vl-accent)" : "1px solid var(--vl-border)",
                background: active ? "var(--vl-accent-glow)" : "white",
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg leading-none">{t.icon}</span>
                <div className="font-bold text-xs" style={{ color: active ? "var(--vl-accent)" : "var(--vl-text-heading)" }}>
                  {t.id}
                </div>
              </div>
              <div className="text-[10px] mt-1 leading-tight" style={{ color: "var(--vl-text-muted)" }}>
                {t.blurb}
              </div>
            </button>
          );
        })}
      </div>
      <p className="text-[10px] italic mt-3" style={{ color: "var(--vl-text-muted)" }}>
        more types coming soon — Miro board, Notion doc, Vercel site scaffolding
      </p>
    </div>
  );
}

/* ---------- STEP 2 ---------- */
function Step2({
  topic, audience, context, assetType, hasVoiceProfile,
  onChange,
}: {
  topic: string; audience: string; context: string; assetType: AssetType;
  hasVoiceProfile: boolean;
  onChange: (patch: Partial<{ topic: string; audience: string; context: string }>) => void;
}) {
  const [suggesting, setSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestErr, setSuggestErr] = useState<string | null>(null);

  async function handleSuggest() {
    if (!topic.trim()) return;
    setSuggesting(true);
    setSuggestErr(null);
    setSuggestions([]);
    try {
      const res = await fetch("/api/lead-magnets/suggest-titles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, audience, assetType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setSuggestions(Array.isArray(data.titles) ? data.titles : []);
    } catch (err) {
      setSuggestErr(err instanceof Error ? err.message : "Failed");
    } finally {
      setSuggesting(false);
    }
  }

  return (
    <div>
      <h2 className="text-lg font-bold" style={{ color: "var(--vl-text-heading)" }}>2 · Topic &amp; voice</h2>
      <p className="text-xs mt-0.5 italic" style={{ color: "var(--vl-text-muted)" }}>drop your idea → I&apos;ll suggest viral-potential titles</p>

      <div className="mt-4 space-y-3">
        <Field label="Your idea / topic">
          <input
            className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
            style={{ borderColor: "var(--vl-border)" }}
            placeholder="hooks that went viral for me on LinkedIn"
            value={topic}
            onChange={(e) => onChange({ topic: e.target.value })}
          />
        </Field>

        {/* Viral title suggester */}
        <div>
          <button
            onClick={handleSuggest}
            disabled={suggesting || !topic.trim()}
            className="w-full px-3 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-40"
            style={{
              background: suggesting ? "var(--vl-bg-card)" : "var(--vl-accent-glow)",
              color: "var(--vl-accent)",
              border: "1px dashed var(--vl-accent)",
            }}
          >
            {suggesting ? "Thinking..." : suggestions.length ? "↻ New title ideas" : "✨ Suggest viral-potential titles"}
          </button>
          {suggestErr && <div className="mt-1 text-[11px]" style={{ color: "#ef4444" }}>{suggestErr}</div>}
          {suggestions.length > 0 && (
            <div className="mt-2 space-y-1.5">
              <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--vl-text-muted)", letterSpacing: 0.8 }}>
                Tap one to use it
              </div>
              {suggestions.map((t, i) => (
                <button
                  key={i}
                  onClick={() => onChange({ topic: t })}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs transition-colors hover:bg-[var(--vl-accent-glow)]"
                  style={{
                    border: "1px solid var(--vl-border)",
                    background: topic === t ? "var(--vl-accent-glow)" : "white",
                    color: "var(--vl-text-heading)",
                    fontWeight: topic === t ? 700 : 500,
                  }}
                >
                  {topic === t && <span className="mr-1" style={{ color: "var(--vl-accent)" }}>✓</span>}
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>

        <Field label="Audience">
          <input
            className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
            style={{ borderColor: "var(--vl-border)" }}
            placeholder="Solo founders, creators"
            value={audience}
            onChange={(e) => onChange({ audience: e.target.value })}
          />
        </Field>

        {/* Your context — personalization source of truth */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--vl-text-muted)", letterSpacing: 0.8 }}>
              Your context
            </label>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: "var(--vl-accent-glow)", color: "var(--vl-accent)" }}>
              makes it personal
            </span>
          </div>
          <textarea
            className="w-full px-3 py-2 rounded-lg border text-sm outline-none resize-y"
            style={{ borderColor: "var(--vl-border)", minHeight: 120, fontFamily: "inherit" }}
            placeholder={`Paste anything you want the magnet grounded in:

• Real stats (e.g. "3x reply rate", "47 of 60 DMs converted")
• Actual scripts/hooks/emails you've used
• Case stories (what happened with specific clients)
• Your step-by-step tactic, in your own words
• Tools / stack you use
• Quotes / screenshots from conversations

Claude will ONLY use what's in here for specifics. No invented numbers or fake clients.`}
            value={context}
            onChange={(e) => onChange({ context: e.target.value })}
          />
          <div className="text-[10px] mt-1" style={{ color: context.trim().length >= 20 ? "#16a34a" : "var(--vl-text-muted)" }}>
            {context.trim().length >= 20
              ? `✓ ${context.trim().length} chars of context — output will be grounded in this`
              : "Empty = generic, principle-only output. Paste specifics to unlock personalization."}
          </div>
        </div>

        {/* Voice profile card */}
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "var(--vl-text-muted)", letterSpacing: 0.8 }}>
            Voice profile
          </div>
          <div
            className="rounded-lg p-3"
            style={{
              background: hasVoiceProfile ? "var(--vl-accent-glow)" : "#fef3c7",
              border: `1.5px solid ${hasVoiceProfile ? "var(--vl-accent)" : "#f59e0b"}`,
            }}
          >
            <div className="flex items-center gap-2">
              <span
                className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold"
                style={{ background: "white", color: "var(--vl-accent)" }}
              >
                M
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold" style={{ color: "var(--vl-text-heading)" }}>
                  {hasVoiceProfile ? "My Voice" : "No voice profile yet"}
                </div>
                <div className="text-[10px]" style={{ color: "var(--vl-text-muted)" }}>
                  {hasVoiceProfile ? "active — will mirror your tone" : "output will use generic voice"}
                </div>
              </div>
              {hasVoiceProfile ? (
                <span className="text-[10px] italic" style={{ color: "var(--vl-accent)" }}>active</span>
              ) : (
                <Link href="/onboarding/voice" className="text-[10px] font-semibold underline" style={{ color: "#b45309" }}>
                  Set it up
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: "var(--vl-text-muted)", letterSpacing: 0.8 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

/* ---------- STEP 3 ---------- */
function Step3({
  sections, enabled, onToggle,
  ctaType, ctaDestination, onCtaChange,
}: {
  sections: Section[];
  enabled: Record<string, boolean>;
  onToggle: (id: string) => void;
  ctaType: CtaType;
  ctaDestination: string;
  onCtaChange: (patch: Partial<{ ctaType: CtaType; ctaDestination: string }>) => void;
}) {
  const ctaOpt = CTA_OPTIONS.find((c) => c.id === ctaType);
  return (
    <div>
      <h2 className="text-lg font-bold" style={{ color: "var(--vl-text-heading)" }}>3 · Sections to include</h2>
      <p className="text-xs mt-0.5 italic" style={{ color: "var(--vl-text-muted)" }}>
        toggle on/off — preview updates live →
      </p>
      <div className="mt-4 space-y-2">
        {sections.map((s) => {
          const on = !!enabled[s.id];
          const isCta = s.id === "cta";
          return (
            <div key={s.id}>
              <button
                onClick={() => onToggle(s.id)}
                className="w-full flex items-center gap-3 rounded-lg p-2.5 text-left transition-colors"
                style={{
                  background: on ? "var(--vl-accent-glow)" : "white",
                  border: on ? "1.5px solid var(--vl-accent)" : "1px solid var(--vl-border)",
                  opacity: on ? 1 : 0.75,
                }}
              >
                <span
                  className="inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold flex-shrink-0"
                  style={{
                    background: on ? "var(--vl-accent)" : "white",
                    color: on ? "white" : "var(--vl-text-muted)",
                    border: on ? "none" : "1px solid var(--vl-border)",
                  }}
                >
                  {on ? "✓" : ""}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold" style={{ color: "var(--vl-text-heading)" }}>{s.name}</div>
                  <div className="text-[10px] leading-tight" style={{ color: "var(--vl-text-muted)" }}>{s.description}</div>
                </div>
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0"
                  style={{ background: "var(--vl-accent-glow)", color: "var(--vl-accent)" }}
                >
                  AI
                </span>
              </button>

              {isCta && on && (
                <div
                  className="mt-1 ml-8 p-3 rounded-lg space-y-2"
                  style={{ background: "var(--vl-bg-card)", border: "1px dashed var(--vl-accent)" }}
                >
                  <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--vl-accent)", letterSpacing: 0.8 }}>
                    Where are you sending them?
                  </div>
                  <select
                    className="w-full px-2 py-1.5 rounded border text-xs outline-none bg-white"
                    style={{ borderColor: "var(--vl-border)" }}
                    value={ctaType}
                    onChange={(e) => onCtaChange({ ctaType: e.target.value as CtaType })}
                  >
                    {CTA_OPTIONS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                  <input
                    className="w-full px-2 py-1.5 rounded border text-xs outline-none"
                    style={{ borderColor: "var(--vl-border)" }}
                    placeholder={ctaOpt?.placeholder ?? "link or short description"}
                    value={ctaDestination}
                    onChange={(e) => onCtaChange({ ctaDestination: e.target.value })}
                  />
                  <div className="text-[10px] italic" style={{ color: "var(--vl-text-muted)" }}>
                    Claude writes the ending in your voice, inviting the reader to {ctaOpt?.label.toLowerCase() ?? "take the next step"}.
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

/* ---------- RESULT CONTROLS (left panel after generation) ---------- */
function ResultControls({
  result, onDownload, onRegenerate,
}: {
  result: GeneratedMagnet;
  onDownload: () => void;
  onRegenerate: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [pushed, setPushed] = useState<string | null>(null);
  const [pushErr, setPushErr] = useState<string | null>(null);

  async function handleCopy() {
    await navigator.clipboard.writeText(result.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handlePushNotion() {
    setPushing(true);
    setPushErr(null);
    setPushed(null);
    try {
      const res = await fetch("/api/lead-magnets/push-to-notion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: result.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setPushed(data.pageUrl);
    } catch (err) {
      setPushErr(err instanceof Error ? err.message : "Failed");
    } finally {
      setPushing(false);
    }
  }

  function handleOpenPdf() {
    window.open(`/api/lead-magnets/pdf?id=${result.id}`, "_blank");
  }

  return (
    <div>
      <div className="text-lg font-bold mb-1" style={{ color: "var(--vl-text-heading)" }}>✓ Generated</div>
      <div className="text-xs mb-3" style={{ color: "var(--vl-text-muted)" }}>
        Saved to your lead magnets. Copy, download, or push to Notion.
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={handleCopy}
          className="w-full px-3 py-2 rounded-lg text-xs font-semibold"
          style={{ background: copied ? "#16a34a" : "var(--vl-accent)", color: "white" }}
        >
          {copied ? "✓ Copied to clipboard" : "Copy content"}
        </button>
        <button
          onClick={onDownload}
          className="w-full px-3 py-2 rounded-lg text-xs font-semibold"
          style={{ background: "white", color: "var(--vl-text)", border: "1px solid var(--vl-border)" }}
        >
          Download .{OUTPUT_FORMATS.find((f) => f.id === result.output_format)?.ext ?? "md"}
        </button>
        <button
          onClick={handleOpenPdf}
          className="w-full px-3 py-2 rounded-lg text-xs font-semibold"
          style={{ background: "white", color: "var(--vl-text)", border: "1px solid var(--vl-border)" }}
        >
          Open PDF (print dialog)
        </button>
        <button
          onClick={handlePushNotion}
          disabled={pushing}
          className="w-full px-3 py-2 rounded-lg text-xs font-semibold disabled:opacity-50"
          style={{ background: "white", color: "var(--vl-text)", border: "1px solid var(--vl-border)" }}
        >
          {pushing ? "Pushing..." : "Push to Notion"}
        </button>
        {pushed && (
          <a href={pushed} target="_blank" rel="noopener noreferrer" className="text-[11px] underline" style={{ color: "#16a34a" }}>
            → Open in Notion
          </a>
        )}
        {pushErr && <div className="text-[11px]" style={{ color: "#ef4444" }}>{pushErr}</div>}
      </div>

      <div className="mt-4 pt-3" style={{ borderTop: "1px dashed var(--vl-border)" }}>
        <button
          onClick={onRegenerate}
          className="w-full px-3 py-2 rounded-lg text-xs font-semibold"
          style={{ background: "var(--vl-bg-card)", color: "var(--vl-text-muted)", border: "1px solid var(--vl-border)" }}
        >
          ↺ Regenerate with same settings
        </button>
      </div>
    </div>
  );
}

/* ---------- PREVIEW ---------- */
function PreviewSkeleton({
  step, assetType, title, topic, audience, enabledList,
}: {
  step: 1 | 2 | 3;
  assetType: AssetType;
  title: string; topic: string; audience: string;
  enabledList: Section[];
}) {
  if (step === 1) {
    return (
      <div className="rounded-xl border-2 border-dashed p-10 flex flex-col items-center justify-center" style={{ borderColor: "var(--vl-border)", background: "white", minHeight: 420 }}>
        <div
          className="w-28 h-32 flex items-center justify-center rounded mb-4 text-4xl"
          style={{ border: "2px dashed var(--vl-border)", color: "var(--vl-text-muted)" }}
        >
          ▢
        </div>
        <div className="text-xs italic" style={{ color: "var(--vl-text-muted)" }}>
          ← pick a lead magnet type
        </div>
      </div>
    );
  }

  const displayTitle = title.trim() || `Your ${assetType.toLowerCase()} title...`;
  const displaySubtitle = topic.trim() ? `about ${topic}` : "topic will appear here";
  const displayAudience = audience.trim() || "for your audience";

  return (
    <div className="rounded-xl border bg-white p-6" style={{ borderColor: "var(--vl-border)", minHeight: 500 }}>
      {/* Title bar */}
      <div
        className="inline-block text-lg font-bold px-1"
        style={{
          background: "var(--vl-accent-glow)",
          color: "var(--vl-text-heading)",
        }}
      >
        {displayTitle}
      </div>
      <div className="text-xs italic mt-1" style={{ color: "var(--vl-text-muted)" }}>
        {displaySubtitle} · {displayAudience}
      </div>

      {step === 2 && (
        <>
          <div className="mt-6 space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-2 rounded-full" style={{ background: "var(--vl-bg-card)", width: `${90 - i * 8}%` }} />
            ))}
          </div>
          <div className="mt-4 p-3 rounded-lg border border-dashed text-[11px] italic" style={{ color: "var(--vl-text-muted)", borderColor: "var(--vl-border)" }}>
            ✨ AI will fill in the outline when you hit Generate
          </div>
          <div className="mt-4 space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-2 rounded-full" style={{ background: "var(--vl-bg-card)", width: `${85 - i * 5}%` }} />
            ))}
          </div>
        </>
      )}

      {step === 3 && (
        <div className="mt-5 space-y-3">
          {enabledList.length === 0 && (
            <div className="text-xs italic" style={{ color: "var(--vl-text-muted)" }}>
              turn on at least one section →
            </div>
          )}
          {enabledList.map((s, i) => (
            <div
              key={s.id}
              className="rounded-lg p-3"
              style={{ border: "1px dashed var(--vl-border)", background: "var(--vl-bg-card)" }}
            >
              <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--vl-text-muted)", letterSpacing: 0.8 }}>
                SECTION {i + 1} — {s.name}
              </div>
              <div className="mt-2 space-y-1.5">
                {[1, 2].map((j) => (
                  <div key={j} className="h-1.5 rounded-full" style={{ background: "var(--vl-border)", width: `${95 - j * 12}%` }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PreviewRendered({ content }: { content: string }) {
  return (
    <div className="rounded-xl border bg-white p-6" style={{ borderColor: "var(--vl-border)" }}>
      <pre
        className="text-xs whitespace-pre-wrap font-sans"
        style={{ color: "var(--vl-text)", lineHeight: 1.7 }}
      >
        {content}
      </pre>
    </div>
  );
}
