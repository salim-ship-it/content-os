"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ContentLanguage, Industry, RecommendedCreator } from "@/lib/recommended-creators";

type Step = "language" | "level" | "pick" | "paste";

const TOTAL_STEPS = 3;
const STEP_NUMBER: Record<Step, number> = {
  language: 1,
  level: 2,
  pick: 2,
  paste: 2,
};

const POST_COUNT_OPTIONS = [10, 20, 50, 100] as const;
const DEFAULT_POST_COUNT = 20;

type Props = {
  industries: Industry[];
  maxCreators: number;
  existingUrls: string[];
};

type SelectedCreator = { name: string; url: string };

function normalizeLinkedInUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const withProtocol = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
    const u = new URL(withProtocol);
    if (!u.hostname.endsWith("linkedin.com")) return null;
    if (!u.pathname.startsWith("/in/")) return null;
    return `https://www.linkedin.com${u.pathname.replace(/\/+$/, "")}/`;
  } catch {
    return null;
  }
}

function nameFromUrl(url: string): string {
  try {
    const slug = new URL(url).pathname.replace("/in/", "").replace(/\/+$/, "");
    return slug
      .replace(/-/g, " ")
      .replace(/\d+/g, "")
      .trim()
      .replace(/\s+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  } catch {
    return url;
  }
}

const AVATAR_COLORS = [
  "ea580c", "0ea5e9", "8b5cf6", "10b981",
  "f59e0b", "ef4444", "ec4899", "14b8a6",
  "6366f1", "84cc16",
];

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function initialsAvatarUrl(name: string): string {
  const color = avatarColor(name);
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${color}&color=fff&bold=true&size=128&format=png&length=2`;
}

function primaryAvatarUrl(c: { name: string; url: string; image?: string }): string {
  return c.image ?? initialsAvatarUrl(c.name);
}

export function CreatorsOnboardingClient({ industries, maxCreators, existingUrls }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("language");
  const [language, setLanguage] = useState<ContentLanguage>("en");
  const filteredIndustries = useMemo(
    () =>
      industries.map((i) => ({
        ...i,
        creators: i.creators.filter((c) => (c.language ?? "en") === language),
      })),
    [industries, language]
  );
  const [activeIndustry, setActiveIndustry] = useState<string>(industries[0]?.id ?? "");
  const [selected, setSelected] = useState<SelectedCreator[]>([]);
  const [pasteRows, setPasteRows] = useState<string[]>(["", "", "", ""]);
  const [postsPerCreator, setPostsPerCreator] = useState<number>(DEFAULT_POST_COUNT);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remaining = Math.max(0, maxCreators - selected.length);
  const industry = useMemo(
    () => filteredIndustries.find((i) => i.id === activeIndustry),
    [filteredIndustries, activeIndustry]
  );

  function chooseLanguage(lang: ContentLanguage) {
    setLanguage(lang);
    setSelected([]);
    setError(null);
    setStep("level");
  }

  function isSelected(url: string) {
    return selected.some((c) => c.url === url);
  }

  function toggleCreator(c: RecommendedCreator) {
    setError(null);
    if (isSelected(c.url)) {
      setSelected((prev) => prev.filter((x) => x.url !== c.url));
      return;
    }
    if (selected.length >= maxCreators) {
      setError(`You can pick up to ${maxCreators} creators. Remove one to add another.`);
      return;
    }
    setSelected((prev) => [...prev, { name: c.name, url: c.url }]);
  }

  function updatePasteRow(i: number, value: string) {
    setPasteRows((prev) => prev.map((row, idx) => (idx === i ? value : row)));
  }

  async function handleSubmitBeginner() {
    if (selected.length === 0) {
      setError("Pick at least one creator to continue.");
      return;
    }
    await save(selected);
  }

  async function handleSubmitExperienced() {
    const cleaned: SelectedCreator[] = [];
    const seen = new Set<string>();
    for (const raw of pasteRows) {
      const normalized = normalizeLinkedInUrl(raw);
      if (!normalized) continue;
      if (seen.has(normalized)) continue;
      seen.add(normalized);
      cleaned.push({ name: nameFromUrl(normalized), url: normalized });
    }
    if (cleaned.length === 0) {
      setError("Add at least one valid LinkedIn URL (https://www.linkedin.com/in/...).");
      return;
    }
    if (cleaned.length > maxCreators) {
      setError(`You can add up to ${maxCreators} creators.`);
      return;
    }
    await save(cleaned);
  }

  async function save(creators: SelectedCreator[]) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding/creators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creators, postsPerCreator, language }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Could not save");
      }
      router.push("/onboarding/voice");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSubmitting(false);
    }
  }

  // -- Step 1: Language ------------------------------------------------------
  if (step === "language") {
    return (
      <Shell>
        <Header
          title="What language will you create content in?"
          subtitle="We'll surface creators in that language and tune your posts to it."
          stepNumber={STEP_NUMBER.language}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          <ChoiceCard
            title="English"
            body="I want to write and publish my LinkedIn posts in English."
            cta="Continue in English"
            onClick={() => chooseLanguage("en")}
          />
          <ChoiceCard
            title="Arabic / العربية"
            body="أريد إنشاء منشورات لينكدإن باللغة العربية."
            cta="المتابعة بالعربية"
            onClick={() => chooseLanguage("ar")}
          />
        </div>
      </Shell>
    );
  }

  // -- Step 2: Beginner vs Experienced ---------------------------------------
  if (step === "level") {
    return (
      <Shell>
        <Header
          title="Pick the creators you'll learn from"
          subtitle="We'll watch their posts daily and surface ideas in your inbox."
          stepNumber={STEP_NUMBER.level}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          <ChoiceCard
            title="I'm new to LinkedIn"
            body="See a recommended set of top creators, picked by industry. Pick up to 4."
            cta="Show me recommendations"
            onClick={() => setStep("pick")}
          />
          <ChoiceCard
            title="I already have favorites"
            body={`Paste up to ${maxCreators} LinkedIn profile URLs of creators you follow.`}
            cta="Paste my own list"
            onClick={() => setStep("paste")}
          />
        </div>
        <BackLink onClick={() => setStep("language")} />
        {existingUrls.length > 0 && (
          <p
            className="mt-6 text-xs"
            style={{ color: "var(--vl-text-muted)" }}
          >
            You already follow {existingUrls.length} creator{existingUrls.length === 1 ? "" : "s"}.
            Adding new ones won't remove them.
          </p>
        )}
      </Shell>
    );
  }

  // -- Step 2a: Beginner — recommended grid ----------------------------------
  if (step === "pick") {
    return (
      <Shell>
        <Header
          title="Pick up to 4 creators"
          subtitle="Choose an industry, then tap a creator to add or remove."
          stepNumber={STEP_NUMBER.pick}
          right={
            <span
              className="text-xs px-3 py-1.5 rounded-full"
              style={{
                border: "1px solid var(--vl-border)",
                color: remaining === 0 ? "var(--vl-accent)" : "var(--vl-text-muted)",
              }}
            >
              {selected.length} / {maxCreators} picked
            </span>
          }
        />

        <div className="flex flex-wrap gap-2 mt-6">
          {filteredIndustries.map((i) => {
            const active = i.id === activeIndustry;
            return (
              <button
                key={i.id}
                type="button"
                onClick={() => setActiveIndustry(i.id)}
                className="text-xs px-3 py-2 rounded-full transition-colors"
                style={{
                  border: `1px solid ${active ? "var(--vl-accent)" : "var(--vl-border)"}`,
                  background: active ? "var(--vl-accent-glow)" : "transparent",
                  color: active ? "var(--vl-accent)" : "var(--vl-text-heading)",
                }}
              >
                {i.label}
              </button>
            );
          })}
          <span
            className="text-xs px-3 py-2 rounded-full inline-flex items-center gap-1.5 cursor-not-allowed"
            style={{
              border: "1px dashed var(--vl-border)",
              color: "var(--vl-text-muted)",
              opacity: 0.7,
            }}
            title="We're adding more industries and creators soon."
          >
            More industries & creators
            <span
              className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded"
              style={{ color: "var(--vl-accent)", background: "var(--vl-accent-glow)" }}
            >
              Soon
            </span>
          </span>
        </div>

        {industry && (
          <p className="mt-4 text-sm" style={{ color: "var(--vl-text-muted)" }}>
            {industry.description}
          </p>
        )}

        {industry && industry.creators.length === 0 && (
          <div
            className="mt-6 p-6 rounded-xl text-sm"
            style={{
              border: "1px dashed var(--vl-border)",
              background: "var(--vl-bg-card)",
              color: "var(--vl-text-muted)",
            }}
          >
            No recommended creators in this language yet. Go back and paste your own LinkedIn profile URLs instead.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-6">
          {industry?.creators.map((c) => {
            const picked = isSelected(c.url);
            return (
              <button
                key={c.url}
                type="button"
                onClick={() => toggleCreator(c)}
                className="text-left p-4 rounded-xl transition-all"
                style={{
                  border: `1px solid ${picked ? "var(--vl-accent)" : "var(--vl-border)"}`,
                  background: picked ? "var(--vl-accent-glow)" : "var(--vl-bg-card)",
                }}
              >
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={primaryAvatarUrl(c)}
                    alt={c.name}
                    width={44}
                    height={44}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const el = e.currentTarget;
                      const fallback = initialsAvatarUrl(c.name);
                      if (el.src !== fallback) el.src = fallback;
                    }}
                    className="shrink-0 rounded-full object-cover"
                    style={{ background: "var(--vl-bg)" }}
                  />
                  <div className="min-w-0 flex-1">
                    <div
                      className="text-sm font-semibold truncate"
                      style={{ color: "var(--vl-text-heading)" }}
                    >
                      {c.name}
                    </div>
                    <div
                      className="text-xs mt-0.5 truncate"
                      style={{ color: "var(--vl-text-muted)" }}
                    >
                      {c.url.replace("https://www.linkedin.com", "")}
                    </div>
                  </div>
                  <div
                    className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold"
                    style={{
                      background: picked ? "var(--vl-accent)" : "transparent",
                      border: `1px solid ${picked ? "var(--vl-accent)" : "var(--vl-border)"}`,
                      color: picked ? "#fff" : "var(--vl-text-muted)",
                    }}
                  >
                    {picked ? "✓" : ""}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <PostCountSelector value={postsPerCreator} onChange={setPostsPerCreator} />

        {error && (
          <p className="mt-4 text-sm" style={{ color: "#dc2626" }}>
            {error}
          </p>
        )}

        <Footer
          onBack={() => setStep("level")}
          onNext={handleSubmitBeginner}
          nextLabel={submitting ? "Saving…" : "Continue"}
          nextDisabled={submitting || selected.length === 0}
        />
      </Shell>
    );
  }

  // -- Step 2b: Experienced — paste URLs -------------------------------------
  return (
    <Shell>
      <Header
        title="Paste up to 4 LinkedIn profiles"
        subtitle="Just the URL of each creator's profile (e.g. https://www.linkedin.com/in/justinwelsh)."
        stepNumber={STEP_NUMBER.paste}
      />

      <div className="space-y-3 mt-8">
        {pasteRows.map((row, i) => (
          <input
            key={i}
            type="text"
            value={row}
            onChange={(e) => updatePasteRow(i, e.target.value)}
            placeholder={`https://www.linkedin.com/in/creator-${i + 1}`}
            className="w-full px-4 py-3 rounded-lg text-sm"
            style={{
              border: "1px solid var(--vl-border)",
              background: "var(--vl-bg-card)",
              color: "var(--vl-text-heading)",
            }}
          />
        ))}
      </div>

      <PostCountSelector value={postsPerCreator} onChange={setPostsPerCreator} />

      {error && (
        <p className="mt-4 text-sm" style={{ color: "#dc2626" }}>
          {error}
        </p>
      )}

      <Footer
        onBack={() => setStep("level")}
        onNext={handleSubmitExperienced}
        nextLabel={submitting ? "Saving…" : "Continue"}
        nextDisabled={submitting}
      />
    </Shell>
  );
}

function PostCountSelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="mt-8">
      <div
        className="text-[11px] uppercase tracking-[0.2em] mb-2"
        style={{ color: "var(--vl-text-muted)" }}
      >
        Posts to scrape per creator
      </div>
      <div className="flex flex-wrap gap-2">
        {POST_COUNT_OPTIONS.map((n) => {
          const active = n === value;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className="text-xs px-4 py-2 rounded-full transition-colors"
              style={{
                border: `1px solid ${active ? "var(--vl-accent)" : "var(--vl-border)"}`,
                background: active ? "var(--vl-accent-glow)" : "transparent",
                color: active ? "var(--vl-accent)" : "var(--vl-text-heading)",
              }}
            >
              {n} posts
            </button>
          );
        })}
      </div>
      <p className="text-xs mt-2" style={{ color: "var(--vl-text-muted)" }}>
        We'll start scraping right after you continue. New posts arrive 1× per day after that.
      </p>
    </div>
  );
}

// -- Layout helpers ----------------------------------------------------------

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex items-start justify-center px-6 py-16"
      style={{ background: "var(--vl-bg)" }}
    >
      <div className="w-full max-w-3xl">{children}</div>
    </div>
  );
}

function Header({
  title,
  subtitle,
  right,
  stepNumber,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  stepNumber: number;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div
          className="text-[11px] uppercase tracking-[0.2em] mb-3"
          style={{ color: "var(--vl-text-muted)" }}
        >
          Onboarding · Step {stepNumber} of {TOTAL_STEPS}
        </div>
        <h1
          className="text-3xl font-bold"
          style={{
            fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
            color: "var(--vl-text-heading)",
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 text-sm" style={{ color: "var(--vl-text-muted)" }}>
            {subtitle}
          </p>
        )}
      </div>
      {right}
    </div>
  );
}

function BackLink({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-8 text-xs uppercase tracking-[0.18em] hover:opacity-70 transition-opacity"
      style={{ color: "var(--vl-text-muted)" }}
    >
      ← Back
    </button>
  );
}

function ChoiceCard({
  title,
  body,
  cta,
  onClick,
}: {
  title: string;
  body: string;
  cta: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left p-6 rounded-xl transition-all hover:shadow-md"
      style={{
        border: "1px solid var(--vl-border)",
        background: "var(--vl-bg-card)",
      }}
    >
      <div
        className="text-base font-semibold mb-2"
        style={{ color: "var(--vl-text-heading)" }}
      >
        {title}
      </div>
      <p className="text-sm mb-4" style={{ color: "var(--vl-text-muted)" }}>
        {body}
      </p>
      <span
        className="text-xs font-medium"
        style={{ color: "var(--vl-accent)" }}
      >
        {cta} →
      </span>
    </button>
  );
}

function Footer({
  onBack,
  onNext,
  nextLabel,
  nextDisabled,
}: {
  onBack: () => void;
  onNext: () => void;
  nextLabel: string;
  nextDisabled: boolean;
}) {
  return (
    <div className="flex items-center justify-between mt-10 pt-6" style={{ borderTop: "1px solid var(--vl-border)" }}>
      <button
        type="button"
        onClick={onBack}
        className="text-xs uppercase tracking-[0.18em] hover:opacity-70 transition-opacity"
        style={{ color: "var(--vl-text-muted)" }}
      >
        ← Back
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={nextDisabled}
        className="px-5 py-2.5 rounded-lg text-sm font-medium transition-opacity disabled:opacity-40"
        style={{ background: "var(--vl-accent)", color: "#fff" }}
      >
        {nextLabel}
      </button>
    </div>
  );
}
