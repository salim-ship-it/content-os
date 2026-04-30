"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

// ─── Wizard data model ───────────────────────────────────────────────────

type Profile = {
  identity: string;
  positioningLine: string;
  rhythm: "punchy" | "balanced" | "essayistic" | null;
  formality: number;
  humor: number;
  hardNos: string[];
  audience: string;
  voiceSample: string;
  // Auto-derived fields after AI build
  beliefs: string[];
};

const EMPTY: Profile = {
  identity: "",
  positioningLine: "",
  rhythm: null,
  formality: 25,
  humor: 60,
  hardNos: [],
  audience: "",
  voiceSample: "",
  beliefs: [],
};

const SUGGESTED_NOS = [
  "Synergy", "Circle back", "Move the needle", "Low-hanging fruit",
  "Game-changer", "Disruptive", "Leverage", "Unlock your potential",
];

const STORAGE_KEY = "content-os.voice-profile";

// 5 stages, each may have sub-steps
type StageId = "intro" | "drop" | "build" | "review" | "questions";

const STAGE_LABELS: Record<StageId, string> = {
  intro:     "Quick info",
  drop:      "Drop samples",
  build:     "Building",
  review:    "Review",
  questions: "Calibrate",
};

const STAGES: StageId[] = ["intro", "drop", "build", "review", "questions"];

// ─── Component ───────────────────────────────────────────────────────────

export function VoiceWizard() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile>(EMPTY);
  const [stageIdx, setStageIdx] = useState(0);
  const [questionIdx, setQuestionIdx] = useState(0); // sub-step inside questions stage
  const [saving, setSaving] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [saved, setSaved] = useState(false);

  const TOTAL_QUESTIONS = 5;

  function handleSave() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    setSaved(true);
  }

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setProfile({ ...EMPTY, ...JSON.parse(raw) });
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    setSaving(true);
    const t = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      setSaving(false);
    }, 700);
    return () => clearTimeout(t);
  }, [profile, hydrated]);

  const updateProfile = useCallback(
    <K extends keyof Profile>(key: K, value: Profile[K]) => {
      setProfile((p) => ({ ...p, [key]: value }));
    },
    [],
  );

  const stage = STAGES[stageIdx];

  function nextStage() { setStageIdx((i) => Math.min(i + 1, STAGES.length - 1)); }
  function prevStage() { setStageIdx((i) => Math.max(i - 1, 0)); }

  // Auto-advance from build stage after the simulated work
  useEffect(() => {
    if (stage !== "build") return;
    // Synthesize beliefs based on identity (mock AI)
    const t = setTimeout(() => {
      setProfile((p) => ({
        ...p,
        beliefs: deriveBeliefs(p.identity, p.positioningLine),
      }));
      nextStage();
    }, 4200);
    return () => clearTimeout(t);
  }, [stage]);

  if (saved) {
    return <ProfileDocument profile={profile} onEdit={() => setSaved(false)} onHome={() => router.push("/")} />;
  }

  return (
    <>
      <BlurredBackdrop />
      <div className="modal-card">
        {/* Top: progress dots + saving */}
        <div className="px-7 pt-6 pb-3 flex items-center justify-between">
          <DotProgress stageIdx={stageIdx} />
          {saving ? (
            <span className="saving-tag">Saving</span>
          ) : (
            <span className="text-[12px]" style={{ color: "var(--co-ink-mute)" }}>
              {STAGE_LABELS[stage]}
            </span>
          )}
        </div>

        <div className="modal-body">
          {stage === "intro"     && <IntroStage     profile={profile} setProfile={updateProfile} />}
          {stage === "drop"      && <DropStage />}
          {stage === "build"     && <BuildStage />}
          {stage === "review"    && <ReviewStage    profile={profile} setProfile={updateProfile} />}
          {stage === "questions" && <QuestionsStage questionIdx={questionIdx} setQuestionIdx={setQuestionIdx} totalQuestions={TOTAL_QUESTIONS} profile={profile} setProfile={updateProfile} />}
        </div>

        {/* Footer */}
        <Footer
          stage={stage}
          stageIdx={stageIdx}
          questionIdx={questionIdx}
          totalQuestions={TOTAL_QUESTIONS}
          profile={profile}
          onBack={() => {
            if (stage === "questions" && questionIdx > 0) setQuestionIdx((i) => i - 1);
            else prevStage();
          }}
          onNext={() => {
            if (stage === "questions") {
              if (questionIdx < TOTAL_QUESTIONS) setQuestionIdx(questionIdx + 1);
            } else {
              nextStage();
            }
          }}
          onSkip={() => {
            if (stage === "drop") nextStage();
            if (stage === "questions") setQuestionIdx(TOTAL_QUESTIONS); // exit
          }}
          onSave={handleSave}
        />
      </div>
    </>
  );
}

// ─── Backdrop (blurred mock app) ─────────────────────────────────────────

function BlurredBackdrop() {
  return (
    <>
      {/* The mock app behind the modal — visible through blur */}
      <div className="fixed inset-0 z-[90] overflow-hidden" style={{ background: "var(--co-paper-soft)" }}>
        <div className="absolute inset-0 opacity-60" style={{ filter: "blur(3px)" }}>
          {/* Faux sidebar */}
          <div className="absolute left-0 top-0 bottom-0 w-[240px]" style={{ background: "var(--co-paper-soft)", borderRight: "1px solid var(--co-rule)" }}>
            <div className="px-6 py-7">
              <div className="h-5 w-28 rounded" style={{ background: "var(--co-ink)" }} />
              <div className="h-3 w-20 rounded mt-2" style={{ background: "var(--co-rule-strong)" }} />
            </div>
            <div className="px-3 mt-2 space-y-1.5">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-9 rounded-lg" style={{ background: i === 0 ? "var(--co-accent-soft)" : "transparent" }} />
              ))}
            </div>
          </div>
          {/* Faux content */}
          <div className="absolute left-[240px] right-0 top-0 bottom-0 px-12 py-14">
            <div className="h-10 w-64 rounded mx-auto" style={{ background: "var(--co-rule-strong)" }} />
            <div className="h-4 w-96 rounded mx-auto mt-3" style={{ background: "var(--co-rule)" }} />
            <div className="h-4 w-72 rounded mx-auto mt-2" style={{ background: "var(--co-rule)" }} />
            <div className="grid grid-cols-3 gap-4 mt-10 max-w-3xl mx-auto">
              {[0, 1, 2].map((i) => (
                <div key={i} className="rounded-2xl h-36" style={{ background: "var(--co-card)", border: "1px solid var(--co-rule)" }} />
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop" />
    </>
  );
}

// ─── Stages ──────────────────────────────────────────────────────────────

function IntroStage({
  profile, setProfile,
}: { profile: Profile; setProfile: <K extends keyof Profile>(k: K, v: Profile[K]) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);
  return (
    <div>
      <h2 className="modal-title">Let&apos;s set up your voice profile.</h2>
      <p className="modal-sub">
        We&apos;ll build a profile from your identity and a few samples. The AI ghostwriter uses this every time it drafts.
      </p>
      <div className="mt-6 space-y-4">
        <div>
          <label className="modal-label block mb-1.5">Who are you, in one line *</label>
          <input
            ref={ref}
            className="modal-input"
            value={profile.identity}
            onChange={(e) => setProfile("identity", e.target.value)}
            placeholder="GTM engineer building outbound systems for SaaS founders"
          />
        </div>
        <div>
          <label className="modal-label block mb-1.5">
            Positioning line <span className="font-normal lowercase tracking-normal" style={{ color: "var(--co-ink-mute)" }}>(optional)</span>
          </label>
          <input
            className="modal-input"
            value={profile.positioningLine}
            onChange={(e) => setProfile("positioningLine", e.target.value)}
            placeholder="We build the machine that gets you meetings."
          />
        </div>
      </div>
    </div>
  );
}

function DropStage() {
  const [hover, setHover] = useState(false);
  return (
    <div>
      <h2 className="modal-title">Drop any posts you&apos;ve written.</h2>
      <p className="modal-sub">
        LinkedIn posts, newsletter issues, raw notes — anything that sounds like you. We&apos;ll learn the rhythm.
      </p>
      <div
        className="mt-6 rounded-2xl py-12 px-6 text-center transition-all cursor-pointer"
        style={{
          border: `1.5px dashed ${hover ? "var(--co-accent)" : "var(--co-rule-strong)"}`,
          background: hover ? "var(--co-accent-soft)" : "var(--co-paper-soft)",
        }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <FileIcon />
        <div className="mt-3 font-semibold text-[14.5px]" style={{ color: "var(--co-ink)" }}>
          Drop files or click to browse
        </div>
        <div className="text-[12.5px] mt-1" style={{ color: "var(--co-ink-mute)" }}>
          Markdown, TXT, DOCX, PDF — up to 20 files
        </div>
      </div>
    </div>
  );
}

function BuildStage() {
  // Simulate progress through 4 micro-steps
  const STEPS = [
    "Reading your samples…",
    "Detecting sentence rhythm…",
    "Extracting signature phrases…",
    "Drafting your voice profile…",
  ];
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t1 = setTimeout(() => setActive(1), 900);
    const t2 = setTimeout(() => setActive(2), 1800);
    const t3 = setTimeout(() => setActive(3), 2700);
    const t4 = setTimeout(() => setActive(4), 3700);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, []);
  return (
    <div>
      <h2 className="modal-title">Building your voice profile…</h2>
      <p className="modal-sub">This usually takes 15–30 seconds.</p>
      <div className="mt-6 loader-bar" />
      <div className="mt-5">
        {STEPS.map((s, i) => (
          <div key={s} className={`check-line ${i < active ? "line-done" : i === active ? "line-active" : "line-pending"}`}>
            <span className={`check-icon ${i < active ? "icon-done" : i === active ? "icon-active" : "icon-pending"}`}>
              {i < active && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </span>
            {s}
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewStage({
  profile, setProfile,
}: { profile: Profile; setProfile: <K extends keyof Profile>(k: K, v: Profile[K]) => void }) {
  return (
    <div>
      <h2 className="modal-title">Here&apos;s what we found.</h2>
      <p className="modal-sub">Edit anything that&apos;s off. You can always update this later.</p>

      <div className="mt-6 space-y-5">
        <div>
          <label className="modal-label block mb-1.5">Identity</label>
          <input className="modal-input" value={profile.identity} onChange={(e) => setProfile("identity", e.target.value)} />
        </div>
        <div>
          <label className="modal-label block mb-1.5">Positioning line</label>
          <input className="modal-input" value={profile.positioningLine} onChange={(e) => setProfile("positioningLine", e.target.value)} />
        </div>
        <div>
          <label className="modal-label block mb-1.5">Core beliefs (auto-extracted)</label>
          <div className="space-y-2">
            {profile.beliefs.map((b, i) => (
              <textarea
                key={i}
                rows={2}
                className="modal-textarea"
                value={b}
                onChange={(e) => {
                  const next = [...profile.beliefs];
                  next[i] = e.target.value;
                  setProfile("beliefs", next);
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function QuestionsStage({
  questionIdx, setQuestionIdx, totalQuestions, profile, setProfile,
}: {
  questionIdx: number;
  setQuestionIdx: (n: number) => void;
  totalQuestions: number;
  profile: Profile;
  setProfile: <K extends keyof Profile>(k: K, v: Profile[K]) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="modal-title">A few more questions</h2>
        <span className="text-[12.5px] font-medium" style={{ color: "var(--co-ink-mute)" }}>
          {Math.min(questionIdx + 1, totalQuestions)} of {totalQuestions}
        </span>
      </div>
      <div className="h-[2px] w-12 rounded-full mb-5" style={{ background: "var(--co-accent)" }} />

      {questionIdx === 0 && <RhythmQ value={profile.rhythm} onChange={(v) => setProfile("rhythm", v)} />}
      {questionIdx === 1 && <ToneQ formality={profile.formality} humor={profile.humor} onFormality={(v) => setProfile("formality", v)} onHumor={(v) => setProfile("humor", v)} />}
      {questionIdx === 2 && <HardNosQ value={profile.hardNos} onChange={(v) => setProfile("hardNos", v)} />}
      {questionIdx === 3 && <AudienceQ value={profile.audience} onChange={(v) => setProfile("audience", v)} />}
      {questionIdx === 4 && <SampleQ value={profile.voiceSample} onChange={(v) => setProfile("voiceSample", v)} />}
      {questionIdx >= totalQuestions && <FinalQ />}
    </div>
  );
}

// ─── Question variants (match the YALC patterns) ─────────────────────────

function RhythmQ({ value, onChange }: { value: Profile["rhythm"]; onChange: (v: Profile["rhythm"]) => void }) {
  const opts: { id: NonNullable<Profile["rhythm"]>; label: string; sample: string }[] = [
    { id: "punchy",     label: "Punchy",     sample: "Cold calling doesn't work. Build the system instead." },
    { id: "balanced",   label: "Balanced",   sample: "Cold calling fails because it solves volume, not fit." },
    { id: "essayistic", label: "Essayistic", sample: "There's a quiet truth in B2B that we keep dancing around…" },
  ];
  return (
    <>
      <p className="text-[14px] mb-4" style={{ color: "var(--co-ink-soft)" }}>
        How do your sentences breathe? Pick the rhythm that sounds most like you.
      </p>
      <div className="space-y-2.5">
        {opts.map((o) => (
          <button key={o.id} onClick={() => onChange(o.id)} className={`choice ${value === o.id ? "choice-active" : ""}`}>
            <div className="font-semibold text-[14px]">{o.label}</div>
            <div className="text-[12.5px] mt-0.5" style={{ color: "var(--co-ink-mute)" }}>{o.sample}</div>
          </button>
        ))}
      </div>
    </>
  );
}

function ToneQ({
  formality, humor, onFormality, onHumor,
}: { formality: number; humor: number; onFormality: (v: number) => void; onHumor: (v: number) => void }) {
  return (
    <>
      <p className="text-[14px] mb-5" style={{ color: "var(--co-ink-soft)" }}>
        Dial in your defaults. These shape every post the AI drafts.
      </p>
      <div className="space-y-7">
        <Slider label="Formality" left="Coffee chat" right="Boardroom" value={formality} onChange={onFormality} />
        <Slider label="Humor"     left="None"        right="Dry & sharp" value={humor}     onChange={onHumor} />
      </div>
    </>
  );
}

function HardNosQ({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [draft, setDraft] = useState("");
  function add(t: string) { const x = t.trim(); if (!x || value.includes(x)) return; onChange([...value, x]); setDraft(""); }
  function remove(t: string) { onChange(value.filter((y) => y !== t)); }
  const remaining = SUGGESTED_NOS.filter((s) => !value.includes(s));
  return (
    <>
      <p className="text-[14px] mb-4" style={{ color: "var(--co-ink-soft)" }}>
        Words you&apos;d never write. Add anything that triggers your gag reflex on LinkedIn.
      </p>
      <div className="rounded-xl p-3 flex flex-wrap gap-1.5" style={{ background: "var(--co-card)", border: "1.5px solid var(--co-rule-strong)" }}>
        {value.map((t) => (
          <span key={t} className="chip-in inline-flex items-center gap-1.5 text-[12.5px] px-2.5 py-1 rounded-full"
            style={{ background: "var(--co-accent-soft)", color: "var(--co-accent-ink)" }}>
            {t}
            <button onClick={() => remove(t)} aria-label={`Remove ${t}`}
              className="w-4 h-4 inline-flex items-center justify-center rounded-full text-[10px]"
              style={{ background: "transparent", color: "var(--co-accent-ink)" }}>×</button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(draft); }
            if (e.key === "Backspace" && !draft && value.length) remove(value[value.length - 1]);
          }}
          className="bg-transparent outline-none text-[13.5px] flex-1 min-w-[140px] py-1"
          placeholder={value.length === 0 ? "Type and press Enter…" : "Another?"}
          style={{ color: "var(--co-ink)" }}
        />
      </div>
      {remaining.length > 0 && (
        <div className="mt-4">
          <div className="text-[11px] mb-2 uppercase tracking-wider" style={{ color: "var(--co-ink-mute)" }}>
            Common offenders
          </div>
          <div className="flex flex-wrap gap-1.5">
            {remaining.map((s) => (
              <button key={s} onClick={() => add(s)}
                className="text-[12px] px-2.5 py-1 rounded-full transition-all"
                style={{ border: "1px dashed var(--co-rule-strong)", color: "var(--co-ink-mute)" }}>
                + {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function AudienceQ({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);
  return (
    <>
      <p className="text-[14px] mb-4" style={{ color: "var(--co-ink-soft)" }}>
        Who are you actually writing for? Be specific — stage, problem, what they need to hear.
      </p>
      <textarea
        ref={ref}
        rows={5}
        className="modal-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="SaaS founders in the Middle East at $500k–$5M ARR, trying to build outbound but burning budget on cold calling…"
      />
    </>
  );
}

function SampleQ({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);
  return (
    <>
      <p className="text-[14px] mb-4" style={{ color: "var(--co-ink-soft)" }}>
        If a friend asked you &ldquo;what are you working on?&rdquo; — type your honest, unfiltered answer. This is the baseline register the AI will copy.
      </p>
      <textarea
        ref={ref}
        rows={6}
        className="modal-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="I&apos;m going full in on building tools with Claude Code. It&apos;s mindblowing what you can do with it…"
      />
    </>
  );
}

// ─── Full document output (the "voice profile generated" view) ────────────

function ProfileDocument({ profile, onEdit, onHome }: { profile: Profile; onEdit: () => void; onHome: () => void }) {
  const doc = assembleDocument(profile);

  return (
    <div className="min-h-screen" style={{ background: "var(--co-paper)" }}>
      {/* Sticky header bar */}
      <header className="sticky top-0 z-30 border-b backdrop-blur" style={{ borderColor: "var(--co-rule)", background: "color-mix(in srgb, var(--co-paper) 88%, transparent)" }}>
        <div className="max-w-[860px] mx-auto px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold px-2.5 py-1 rounded-full" style={{ background: "var(--co-accent-soft)", color: "var(--co-accent-ink)" }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--co-accent)" }} />
              Voice profile generated
            </span>
            <span className="text-[12.5px]" style={{ color: "var(--co-ink-mute)" }}>✓ Saved</span>
          </div>
          <div className="flex items-center gap-1">
            <button className="btn-skip text-[12.5px]" style={{ padding: "8px 12px" }}>Regenerate</button>
            <button onClick={onEdit} className="btn-skip text-[12.5px]" style={{ padding: "8px 12px" }}>Edit answers</button>
            <button onClick={onHome} className="btn-pill" style={{ padding: "8px 16px", flex: "0 0 auto", fontSize: 13 }}>
              Back to home →
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[760px] mx-auto px-8 py-12">
        {/* Document title */}
        <div className="mb-12">
          <h1 className="font-display text-[40px] font-semibold leading-[1.1] tracking-[-0.02em]" style={{ color: "var(--co-ink)" }}>
            {doc.title}
          </h1>
          <Hr />
        </div>

        {/* Sections 1-9 */}
        <DocSection number={1} title="Identity">
          <DocPara>{doc.identity.body}</DocPara>
          <DocCallout label="Positioning in one line:">
            <em>{doc.identity.positioning}</em>
          </DocCallout>
        </DocSection>

        <DocSection number={2} title="Core Beliefs">
          <DocList items={doc.beliefs.list} />
          <DocCallout label="The contrarian core:">
            {doc.beliefs.contrarianCore}
          </DocCallout>
        </DocSection>

        <DocSection number={3} title="Origin Story">
          <DocPara>{doc.originStory}</DocPara>
        </DocSection>

        <DocSection number={4} title="Voice Mechanics">
          {doc.mechanics.map((m) => (
            <DocLabeledPara key={m.label} label={m.label}>{m.body}</DocLabeledPara>
          ))}
        </DocSection>

        <DocSection number={5} title="Hard Nos">
          <DocSubhead>Banned phrases — never use these under any circumstances:</DocSubhead>
          <DocList items={doc.hardNos.phrases.map((p) => `“${p}”`)} />
          <DocSubhead>Banned patterns:</DocSubhead>
          <DocList items={doc.hardNos.patterns} />
        </DocSection>

        <DocSection number={6} title="Audience">
          {doc.audience.map((a) => (
            <DocLabeledPara key={a.label} label={a.label}>{a.body}</DocLabeledPara>
          ))}
        </DocSection>

        <DocSection number={7} title="Tone Calibration">
          {doc.tone.map((t) => (
            <DocLabeledPara key={t.label} label={t.label}>{t.body}</DocLabeledPara>
          ))}
        </DocSection>

        <DocSection number={8} title="Coffee Baseline">
          <p className="text-[14px] italic mb-3" style={{ color: "var(--co-ink-soft)" }}>
            The most authentic voice sample — how he actually talks:
          </p>
          <blockquote className="pl-5 border-l-[3px] py-2 my-3 text-[16.5px] leading-relaxed" style={{ borderColor: "var(--co-accent)", color: "var(--co-ink)" }}>
            {doc.coffee.quote}
          </blockquote>
          <DocPara>{doc.coffee.commentary}</DocPara>
        </DocSection>

        <DocSection number={9} title="Application Notes for AI Ghostwriter">
          <DocSubhead>DO:</DocSubhead>
          <DocList items={doc.application.dos} />
          <DocSubhead>DON&apos;T:</DocSubhead>
          <DocList items={doc.application.donts} />
          <DocLabeledPara label="Tension to maintain:">{doc.application.tension}</DocLabeledPara>
          <DocLabeledPara label="Default post structure:">
            <ol className="list-decimal pl-5 space-y-1 mt-2">
              {doc.application.structure.map((s, i) => <li key={i}>{s}</li>)}
            </ol>
          </DocLabeledPara>
          <DocCallout label="Voice check question before publishing:">
            <em>{doc.application.voiceCheck}</em>
          </DocCallout>
        </DocSection>

        {/* Pillars */}
        <PillarSection pillars={doc.pillars} />

        {/* Treadmill table */}
        <TreadmillSection rows={doc.treadmill} pillars={doc.pillars.map((p) => p.title)} />

        {/* Weekly schedule */}
        <ScheduleSection week={doc.schedule} />

        {/* CTAs */}
        <CTASection ctas={doc.ctas} />

        {/* Footer actions */}
        <div className="mt-16 pt-8 border-t flex items-center justify-between" style={{ borderColor: "var(--co-rule)" }}>
          <div className="flex items-center gap-2 text-[13px]" style={{ color: "var(--co-ink-mute)" }}>
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full" style={{ background: "var(--co-accent-soft)" }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--co-accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
            Saved
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-skip">Regenerate</button>
            <button onClick={onEdit} className="btn-skip">Edit answers</button>
            <button onClick={onHome} className="btn-pill" style={{ flex: "0 0 auto" }}>
              Back to home →
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

// ─── Document atoms ───────────────────────────────────────────────────────

function DocSection({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <div className="flex items-baseline gap-3 mb-4">
        <span className="text-[12px] font-semibold tabular-nums" style={{ color: "var(--co-accent)" }}>
          {String(number).padStart(2, "0")}
        </span>
        <h2 className="font-display text-[26px] font-semibold tracking-tight" style={{ color: "var(--co-ink)" }}>
          {title}
        </h2>
      </div>
      <div className="space-y-3 text-[15px] leading-relaxed" style={{ color: "var(--co-ink)" }}>
        {children}
      </div>
      <Hr />
    </section>
  );
}

function DocPara({ children }: { children: React.ReactNode }) {
  return <p className="leading-[1.65]">{children}</p>;
}

function DocList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5 ml-1">
      {items.map((it, i) => (
        <li key={i} className="flex gap-3 leading-[1.6]">
          <span className="shrink-0 mt-[10px] w-1 h-1 rounded-full" style={{ background: "var(--co-accent)" }} />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}

function DocSubhead({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-semibold text-[14px] mt-4 mb-2" style={{ color: "var(--co-ink)" }}>
      {children}
    </p>
  );
}

function DocLabeledPara({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="my-3">
      <span className="font-semibold text-[14.5px]" style={{ color: "var(--co-ink)" }}>{label}</span>{" "}
      <span className="text-[14.5px] leading-[1.6]" style={{ color: "var(--co-ink-soft)" }}>{children}</span>
    </div>
  );
}

function DocCallout({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-4 my-3" style={{ background: "var(--co-accent-soft)", border: "1px solid var(--co-accent-line)" }}>
      <div className="text-[12px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--co-accent-ink)" }}>
        {label}
      </div>
      <div className="text-[14.5px]" style={{ color: "var(--co-ink)" }}>{children}</div>
    </div>
  );
}

function Hr() {
  return <div className="my-8 h-px" style={{ background: "var(--co-rule)" }} />;
}

// ─── Pillars section ──────────────────────────────────────────────────────

function PillarSection({ pillars }: { pillars: Pillar[] }) {
  return (
    <section className="mb-12">
      <div className="flex items-baseline gap-3 mb-2">
        <h2 className="font-display text-[26px] font-semibold tracking-tight" style={{ color: "var(--co-ink)" }}>
          Content pillars
        </h2>
      </div>
      <p className="text-[14.5px] mb-6" style={{ color: "var(--co-ink-soft)" }}>
        Three topics. The more you post them, the more the right people associate them with you.
      </p>
      <div className="space-y-4">
        {pillars.map((p, i) => (
          <article key={p.title} className="rounded-2xl p-6 border" style={{ background: "var(--co-card)", borderColor: "var(--co-rule)" }}>
            <div className="flex items-start gap-4">
              <div className="font-display text-[28px] font-semibold tabular-nums" style={{ color: "var(--co-accent)" }}>
                {i + 1}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-[18px] mb-1" style={{ color: "var(--co-ink)" }}>
                  {p.title}
                </h3>
                <div className="text-[12px] uppercase tracking-wider mb-2" style={{ color: "var(--co-ink-mute)" }}>
                  {p.kicker}
                </div>
                <p className="text-[14.5px] leading-relaxed mb-3" style={{ color: "var(--co-ink-soft)" }}>{p.description}</p>
                <ul className="space-y-1">
                  {p.angles.map((a, j) => (
                    <li key={j} className="text-[13.5px] flex gap-2" style={{ color: "var(--co-ink)" }}>
                      <span style={{ color: "var(--co-accent)" }}>—</span>
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </article>
        ))}
      </div>
      <Hr />
    </section>
  );
}

// ─── Treadmill (10 angles × 3 pillars) ───────────────────────────────────

function TreadmillSection({ rows, pillars }: { rows: TreadmillRow[]; pillars: string[] }) {
  return (
    <section className="mb-12">
      <h2 className="font-display text-[26px] font-semibold tracking-tight mb-2" style={{ color: "var(--co-ink)" }}>
        The Treadmill — 10 angles × 3 pillars
      </h2>
      <p className="text-[14.5px] mb-5" style={{ color: "var(--co-ink-soft)" }}>
        30 post slots to keep you publishing without thinking from scratch.
      </p>
      <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: "var(--co-rule)", background: "var(--co-card)" }}>
        <table className="w-full text-[13.5px]">
          <thead>
            <tr style={{ background: "var(--co-paper-soft)" }}>
              <th className="text-left px-4 py-3 font-semibold border-b" style={{ borderColor: "var(--co-rule)", color: "var(--co-ink)" }}>Angle</th>
              {pillars.map((p) => (
                <th key={p} className="text-left px-4 py-3 font-semibold border-b text-[12.5px]" style={{ borderColor: "var(--co-rule)", color: "var(--co-ink)" }}>
                  {p}
                </th>
              ))}
              <th className="text-left px-4 py-3 font-semibold border-b" style={{ borderColor: "var(--co-rule)", color: "var(--co-ink)" }}>Category</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.angle}>
                <td className="px-4 py-2.5 font-medium border-b" style={{ borderColor: "var(--co-rule)", color: "var(--co-ink)" }}>{r.angle}</td>
                {pillars.map((p) => {
                  const fits = r.pillars.includes(p);
                  return (
                    <td key={p} className="px-4 py-2.5 border-b" style={{ borderColor: "var(--co-rule)" }}>
                      {fits && <span className="inline-block w-2 h-2 rounded-full" style={{ background: "var(--co-accent)" }} />}
                    </td>
                  );
                })}
                <td className="px-4 py-2.5 border-b text-[12.5px]" style={{ borderColor: "var(--co-rule)", color: "var(--co-ink-mute)" }}>{r.category}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Hr />
    </section>
  );
}

// ─── Weekly schedule ──────────────────────────────────────────────────────

function ScheduleSection({ week }: { week: ScheduleDay[] }) {
  return (
    <section className="mb-12">
      <h2 className="font-display text-[26px] font-semibold tracking-tight mb-2" style={{ color: "var(--co-ink)" }}>
        Weekly schedule
      </h2>
      <div className="text-[12px] uppercase tracking-wider mb-4" style={{ color: "var(--co-ink-mute)" }}>April 2026 · Week view</div>
      <div className="grid grid-cols-7 gap-2">
        {week.map((d) => (
          <div key={d.day} className="rounded-xl p-3 border" style={{ background: d.isToday ? "var(--co-accent-soft)" : "var(--co-card)", borderColor: d.isToday ? "var(--co-accent-line)" : "var(--co-rule)" }}>
            <div className="text-[10px] uppercase tracking-wider" style={{ color: "var(--co-ink-mute)" }}>
              {d.dow}
            </div>
            <div className="text-[16px] font-bold mb-2" style={{ color: d.isToday ? "var(--co-accent-ink)" : "var(--co-ink)" }}>
              {d.day}{d.isToday ? " · Today" : ""}
            </div>
            <div className="text-[11.5px] font-semibold leading-tight mb-1" style={{ color: "var(--co-ink)" }}>
              {d.angle}
            </div>
            <div className="text-[10.5px] mb-1.5 leading-snug" style={{ color: "var(--co-ink-mute)" }}>
              {d.pillar}
            </div>
            <div className="flex gap-1 flex-wrap">
              <span className="text-[9.5px] px-1.5 py-0.5 rounded" style={{ background: "var(--co-paper-soft)", color: "var(--co-ink-soft)" }}>{d.category}</span>
              <span className="text-[9.5px] px-1.5 py-0.5 rounded" style={{ background: "var(--co-paper-soft)", color: "var(--co-ink-soft)" }}>{d.funnel}</span>
            </div>
          </div>
        ))}
      </div>
      <Hr />
    </section>
  );
}

// ─── CTA library ──────────────────────────────────────────────────────────

function CTASection({ ctas }: { ctas: CTAGroup[] }) {
  return (
    <section className="mb-4">
      <h2 className="font-display text-[26px] font-semibold tracking-tight mb-2" style={{ color: "var(--co-ink)" }}>
        CTAs
      </h2>
      <p className="text-[14.5px] mb-5" style={{ color: "var(--co-ink-soft)" }}>
        Ready-to-paste closing PS lines, organized by intent.
      </p>
      <div className="space-y-5">
        {ctas.map((g) => (
          <div key={g.label}>
            <div className="text-[12px] uppercase tracking-wider mb-2 font-semibold" style={{ color: "var(--co-accent-ink)" }}>
              {g.label}
            </div>
            <ul className="space-y-2">
              {g.lines.map((line, i) => (
                <li key={i} className="rounded-xl p-3.5 text-[13.5px] leading-relaxed border" style={{ background: "var(--co-card)", borderColor: "var(--co-rule)", color: "var(--co-ink)" }}>
                  {line}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Document assembly (mock data + user inputs) ──────────────────────────

type Pillar = { title: string; kicker: string; description: string; angles: string[] };
type TreadmillRow = { angle: string; pillars: string[]; category: string };
type ScheduleDay = { day: number; dow: string; isToday?: boolean; angle: string; pillar: string; category: string; funnel: string };
type CTAGroup = { label: string; lines: string[] };

function assembleDocument(p: Profile) {
  const identityLine = p.identity || "GTM engineer working with early-stage SaaS startups";
  const positioning = p.positioningLine || "We fix your broken sales process so leads actually convert.";

  return {
    title: `Voice Profile: ${capitalize2(identityLine)}`,
    identity: {
      body: `A ${identityLine}. Not a sales coach, not a consultant with a framework to sell — an operator who builds the actual systems that make revenue happen. Positioned as the person who fixes broken go-to-market infrastructure, not the person who talks about it. Credibility anchored in hands-on work with some of Europe's biggest scaleups, particularly the French tech ecosystem. Currently deep in AI-assisted workflow automation, which shapes how he thinks about GTM infrastructure more broadly.`,
      positioning,
    },
    beliefs: {
      list: p.beliefs.length > 0 ? p.beliefs : [
        "Cold calling as a primary closing strategy is outdated thinking that wastes pipeline and burns reps",
        "Most early-stage founders confuse activity with architecture — they optimize the wrong layer",
        "GTM is an engineering problem, not a motivation problem",
        "Systems beat hustle, consistently",
        "The European (especially French) scaleup model has lessons most English-language GTM content ignores",
        "Automation isn't a shortcut — it's the actual job now",
      ],
      contrarianCore: "Everyone in sales is obsessed with the human touch of cold calls. The real lever is what happens before and after that call — the system around it.",
    },
    originStory: `Built GTM systems for a major French scaleup — not advised, not consulted, built. This is the defining credibility anchor. The experience of operating at real scale in a high-pressure European environment shaped a bias toward infrastructure over instinct, systems over scripts. The lesson wasn't theoretical — it was forged in the pressure of a company growing fast with no room for broken pipelines.`,
    mechanics: rhythmMechanics(p.rhythm ?? "balanced"),
    hardNos: {
      phrases: p.hardNos.length > 0 ? p.hardNos : [
        "Unlock your potential", "At the end of the day", "Move the needle", "Let's dive in",
        "Game-changer", "It's not rocket science", "Disruptive", "Thought leader",
      ],
      patterns: [
        "Fluffy motivational openers",
        "Excessive use of em-dashes for fake profundity",
        "Bullet-point-only posts that read like a Notion doc dump",
        "Passive voice dressed up as insight",
        "Hedging language that softens every claim",
        "Hype vocabulary (\"revolutionary,\" \"unprecedented,\" \"cutting-edge\")",
        "Asking weak engagement-bait questions at the end",
      ],
    },
    audience: [
      { label: "Primary reader:", body: p.audience || "Early-stage SaaS founder — pre-Series A, probably doing some GTM themselves, starting to feel the ceiling of founder-led sales, not yet sure whether they need to hire or build systems first." },
      { label: "What they're struggling with:", body: "Leads coming in but not converting, sales motion that worked at 10 customers breaking at 50, confusion between a process problem and a people problem." },
      { label: "What they need to hear:", body: "That the problem is probably architectural. That cold calling alone won't fix it. That there's a systems layer they haven't built yet." },
      { label: "Secondary reader:", body: "GTM hires at early-stage companies — the first sales hire or revenue ops person who suspects the founder's approach isn't scalable but doesn't have the language yet." },
    ],
    tone: [
      { label: "Formality level:", body: formalityLabel(p.formality) },
      { label: "Humor:", body: humorLabel(p.humor) },
      { label: "Swearing:", body: "Rare. Reserved for moments where it genuinely adds emphasis or authenticity." },
      { label: "How posts end:", body: "A bold, controversial statement. Not a question. Not a call to comment. A declarative close." },
    ],
    coffee: {
      quote: p.voiceSample || "Been working day and night on Claude Code and automating my workflows using it.",
      commentary: "This is the register to preserve: no preamble, no context-setting, straight to what's actually happening. Lowercase-casual energy translated into post format. Practical, current, slightly intense.",
    },
    application: {
      dos: [
        "Open with a hook that either makes them stop scrolling or makes them slightly uncomfortable",
        "Write in connected paragraphs that build — each sentence creates momentum into the next",
        "Use GTM/SaaS terminology naturally and without over-explanation",
        "Anchor credibility in specifics (real system builds, current tooling)",
        "End every post with a bold, declarative statement",
      ],
      donts: [
        "Use any phrase from the Hard Nos list — ever",
        "Write bullet-point lists as the primary format",
        "Add engagement-bait questions at the end",
        "Use motivational or coaching register",
        "Soften claims with hedges (\"it might be worth considering...\")",
      ],
      tension: "Technical operator credibility + plain spoken delivery. The posts should feel like they come from someone who has done this at scale, not someone who has studied it.",
      structure: [
        "Hook (observation, provocation, or rare dry humor)",
        "The problem as most people frame it",
        "Why that framing is wrong",
        "What the actual system/solution looks like",
        "Bold, controversial close",
      ],
      voiceCheck: "Does this sound like someone who built GTM systems at scale, or does it sound like a LinkedIn influencer?",
    },
    pillars: [
      {
        title: "Signal-Based Outbound",
        kicker: "What I do",
        description: "I build outbound systems that book meetings. Clay + Make + Lemlist — wired together so your pipeline doesn't depend on cold calling.",
        angles: [
          "Show founders how signal-based outbound actually works",
          "Break down the infrastructure behind booked meetings",
          "Position the 1:1 GTM build as the obvious next step",
        ],
      },
      {
        title: "AI-Native GTM Engineering",
        kicker: "My edge",
        description: "I'm building GTM tools with Claude Code. Replacing bloated stacks with custom-built systems that do more, cost less, and actually work.",
        angles: [
          "Show what's possible when you stop duct-taping tools together",
          "Challenge the Clay + Apollo + n8n orthodoxy",
          "Attract technical founders who want a better way",
        ],
      },
      {
        title: "Founder in the Trenches",
        kicker: "Who I am",
        description: "I went from building outbound for Europe's biggest scaleup to doing it for SaaS founders in the Middle East. This is what the journey looks like.",
        angles: [
          "Build trust through real stories and lessons",
          "Connect with SaaS founders who are in the same fight",
          "Make the brand human — not just a service page",
        ],
      },
    ],
    treadmill: [
      { angle: "Lesson",     pillars: ["Founder in the Trenches"], category: "Personal" },
      { angle: "Story",      pillars: ["Founder in the Trenches"], category: "Personal" },
      { angle: "Tips",       pillars: ["AI-Native GTM Engineering"], category: "Teach" },
      { angle: "Wins",       pillars: ["Signal-Based Outbound"], category: "Show" },
      { angle: "Education",  pillars: ["Signal-Based Outbound", "AI-Native GTM Engineering"], category: "Teach" },
      { angle: "Mistakes",   pillars: ["Founder in the Trenches"], category: "Show" },
      { angle: "Case study", pillars: ["Signal-Based Outbound", "AI-Native GTM Engineering"], category: "Show" },
      { angle: "Advantage",  pillars: ["AI-Native GTM Engineering"], category: "Teach" },
      { angle: "Opinion",    pillars: ["Founder in the Trenches"], category: "Personal" },
      { angle: "Strategy",   pillars: ["Signal-Based Outbound"], category: "Teach" },
    ],
    schedule: [
      { day: 27, dow: "Mon", angle: "Case study",  pillar: "Signal-Based Outbound", category: "Show/Invite", funnel: "Bottom" },
      { day: 28, dow: "Tue", isToday: true, angle: "Tips", pillar: "AI-Native GTM Engineering", category: "Teach", funnel: "Middle" },
      { day: 29, dow: "Wed", angle: "Wins",        pillar: "Signal-Based Outbound", category: "Show", funnel: "Middle" },
      { day: 30, dow: "Thu", angle: "Opinion",     pillar: "Founder in the Trenches", category: "Personal", funnel: "Top" },
      { day: 1,  dow: "Fri", angle: "Lead magnet", pillar: "Signal-Based Outbound", category: "Invite", funnel: "Bottom" },
      { day: 2,  dow: "Sat", angle: "Case study",  pillar: "AI-Native GTM Engineering", category: "Invite", funnel: "Bottom" },
      { day: 3,  dow: "Sun", angle: "Story",       pillar: "Founder in the Trenches", category: "Personal", funnel: "Top" },
    ],
    ctas: [
      {
        label: "Main offer",
        lines: [
          "PS. I build signal-based outbound systems for SaaS founders. Clay + Make + Lemlist — done with you in 4 weeks. DM me 'GTM' if you want in.",
          "PS. If you're a SaaS founder doing $500k–$5M and your pipeline is inconsistent — I fix that. 4-week GTM build. DM me.",
          "PS. I've built outbound infrastructure for 3+ startups and scaleups. Now I do it 1:1 with founders. DM 'BUILD' to talk.",
        ],
      },
      {
        label: "Newsletter",
        lines: [
          "PS. I break down GTM systems, outbound plays, and Claude Code builds every week. Subscribe → {newsletter_url}",
          "PS. Every week I share what's working in signal-based outbound. No fluff. Just systems. Join here → {newsletter_url}",
          "PS. I write about building outbound machines for SaaS founders. Get it in your inbox → {newsletter_url}",
        ],
      },
      {
        label: "Waitlist",
        lines: [
          "PS. I'm opening spots for the next GTM build cohort. Get on the waitlist → {lead_magnet_url}",
          "PS. The GTM build program is how SaaS founders go from zero outbound to booked meetings in 4 weeks. Waitlist is open → {lead_magnet_url}",
          "PS. Want me to build your outbound system with you? Waitlist is live → {lead_magnet_url}",
        ],
      },
    ],
  };
}

function rhythmMechanics(rhythm: NonNullable<Profile["rhythm"]>) {
  const map = {
    punchy: [
      { label: "Sentence rhythm:", body: "Short. Punchy. One idea per line. No long compound sentences trying to prove intelligence. Let the white space do work." },
      { label: "Paragraph style:", body: "Single sentences as paragraphs. Line breaks are intentional. Posts read more like punches than essays." },
      { label: "Vocabulary register:", body: "Plain, direct, operator-level language. Talks like a builder, not a marketer." },
      { label: "Structural tendency:", body: "Hook → blunt take → proof → bolder take. The white space is the rhythm." },
    ],
    balanced: [
      { label: "Sentence rhythm:", body: "Flowing paragraphs that build momentum. Sentences connect with cause and effect, building toward a point rather than listing around it." },
      { label: "Paragraph style:", body: "Medium-length paragraphs. Each one earns the next. No orphan one-liners for drama unless the post specifically builds to one." },
      { label: "Vocabulary register:", body: "Practitioner-level. Uses industry terms naturally without over-explaining them. No inflated consulting language." },
      { label: "Structural tendency:", body: "Hook → problem framing → system or insight → bold close. The work does the persuading, not the adjectives." },
    ],
    essayistic: [
      { label: "Sentence rhythm:", body: "Considered. Layered. Sentences breathe and connect across paragraphs. The reader follows a chain of thought, not a list." },
      { label: "Paragraph style:", body: "Long-form. Each paragraph develops one full idea before moving on. Indulgent in the best sense — earns the read." },
      { label: "Vocabulary register:", body: "Educated, but never academic. Uses precise language to describe nuance the reader hasn't articulated yet." },
      { label: "Structural tendency:", body: "Observation → unfolding → reframe → resolution. Reads like a column, not a post." },
    ],
  } as const;
  return map[rhythm];
}

function formalityLabel(v: number): string {
  if (v < 25) return "Coffee chat. Conversational, low-formality. Talks like a smart operator, not a LinkedIn influencer.";
  if (v < 60) return "Conversational-professional. Sounds like someone who knows their stuff deeply but doesn't need to prove it with jargon.";
  return "Boardroom-ready. Precise and structured, while still operator-direct.";
}

function humorLabel(v: number): string {
  if (v < 25) return "None. Plays it straight. The insight does all the work.";
  if (v < 65) return "Used sparingly and strategically — only in the hook, only when it lands. Dry observation, not jokes.";
  return "Dry and sharp. Mocks the practice (never the person). Earns the laugh by being specific.";
}

function capitalize2(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function FinalQ() {
  return (
    <div className="text-center py-4">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4" style={{ background: "var(--co-accent-soft)" }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--co-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <h3 className="modal-title">You&apos;re all set.</h3>
      <p className="modal-sub mx-auto max-w-[400px]">
        Your voice profile is locked in. Every draft from now on uses these calibrations.
      </p>
    </div>
  );
}

// ─── Footer ──────────────────────────────────────────────────────────────

function Footer({
  stage, stageIdx, questionIdx, totalQuestions, profile, onBack, onNext, onSkip, onSave,
}: {
  stage: StageId;
  stageIdx: number;
  questionIdx: number;
  totalQuestions: number;
  profile: Profile;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
  onSave: () => void;
}) {
  if (stage === "build") {
    return (
      <div className="modal-footer">
        <span className="text-[12.5px]" style={{ color: "var(--co-ink-mute)" }}>
          Hang tight…
        </span>
      </div>
    );
  }

  const canSkip = stage === "drop" || stage === "questions";
  const isLast = stage === "questions" && questionIdx >= totalQuestions;
  const canGo  = canAdvance(stage, questionIdx, profile);
  const ctaLabel = ctaText(stage, questionIdx, totalQuestions);

  return (
    <div className="modal-footer">
      <button onClick={onBack} disabled={stageIdx === 0 && questionIdx === 0} className="btn-skip disabled:opacity-30 disabled:no-underline">
        ← Back
      </button>
      <div className="flex items-center gap-3 flex-1 justify-end">
        {canSkip && !isLast && (
          <button onClick={onSkip} className="btn-skip">Skip</button>
        )}
        {!isLast && (
          <button onClick={onNext} disabled={!canGo} className="btn-pill" style={{ flex: "0 1 240px" }}>
            {ctaLabel}
          </button>
        )}
        {isLast && (
          <button onClick={onSave} className="btn-pill" style={{ flex: "0 1 240px" }}>
            Save profile
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Atoms ───────────────────────────────────────────────────────────────

function DotProgress({ stageIdx }: { stageIdx: number }) {
  return (
    <div className="dot-row">
      {STAGES.map((_, i) => {
        const cls = i < stageIdx ? "dot dot-done" : i === stageIdx ? "dot dot-active" : "dot";
        return <span key={i} className={cls} />;
      })}
    </div>
  );
}

function Slider({
  label, left, right, value, onChange,
}: { label: string; left: string; right: string; value: number; onChange: (v: number) => void }) {
  const trackRef = useRef<HTMLDivElement>(null);
  function setFromEvent(clientX: number) {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return;
    const v = Math.round(((clientX - rect.left) / rect.width) * 100);
    onChange(Math.max(0, Math.min(100, v)));
  }
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2.5">
        <span className="text-[14px] font-semibold" style={{ color: "var(--co-ink)" }}>{label}</span>
        <span className="text-[12px] tabular-nums" style={{ color: "var(--co-ink-mute)" }}>{value}</span>
      </div>
      <div
        ref={trackRef}
        className="tone-track"
        onMouseDown={(e) => {
          setFromEvent(e.clientX);
          const onMove = (ev: MouseEvent) => setFromEvent(ev.clientX);
          const onUp = () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
          };
          window.addEventListener("mousemove", onMove);
          window.addEventListener("mouseup", onUp);
        }}
      >
        <div className="tone-fill" style={{ width: `${value}%`, background: "var(--co-accent)" }} />
        <div className="tone-thumb" style={{ left: `${value}%`, borderColor: "var(--co-accent)" }} />
      </div>
      <div className="flex justify-between mt-1.5 text-[11.5px]" style={{ color: "var(--co-ink-mute)" }}>
        <span>{left}</span>
        <span>{right}</span>
      </div>
    </div>
  );
}

function FileIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--co-ink-mute)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

// ─── Validation + helpers ────────────────────────────────────────────────

function canAdvance(stage: StageId, qIdx: number, p: Profile): boolean {
  if (stage === "intro") return p.identity.trim().length > 5;
  if (stage === "drop") return true;
  if (stage === "build") return false;
  if (stage === "review") return p.identity.trim().length > 0;
  if (stage === "questions") {
    if (qIdx === 0) return p.rhythm !== null;
    if (qIdx === 1) return true;
    if (qIdx === 2) return true;
    if (qIdx === 3) return p.audience.trim().length > 5;
    if (qIdx === 4) return p.voiceSample.trim().length > 5;
  }
  return true;
}

function ctaText(stage: StageId, qIdx: number, total: number): string {
  if (stage === "intro")    return "Continue";
  if (stage === "drop")     return "Continue";
  if (stage === "review")   return "Looks good — Continue";
  if (stage === "questions") {
    if (qIdx === total - 1) return "Finish";
    return "Next";
  }
  return "Continue";
}

function deriveBeliefs(identity: string, positioning: string): string[] {
  const seed = (identity + " " + positioning).toLowerCase();
  if (!seed.trim()) {
    return [
      "Outbound is an engineering problem, not a hustle problem.",
      "If your system needs a hero rep, it's not a system. It's a prayer.",
      "Most GTM advice is recycled noise from people who never built anything from scratch.",
    ];
  }
  return [
    `${capitalize(coreNoun(identity))} is an engineering problem — not a hustle problem.`,
    "If your system needs a hero to function, it's not a system. It's a prayer.",
    "Most advice in this space is recycled noise from people who haven't shipped the actual thing.",
  ];
}

function coreNoun(s: string): string {
  const m = s.match(/(outbound|content|gtm|growth|sales|marketing|product)/i);
  return m ? m[1].toLowerCase() : "what we're talking about";
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
