import { getSupabaseServer } from "@/lib/supabase-server";
import type { VoiceDraft } from "@/lib/voice-questions";
import { claudeFetch } from "@/lib/claude-fetch";

export type Pillar = {
  name: string;
  role: "what_i_do" | "my_edge" | "who_i_am";
  description: string;
  purposes: string[];
};

export type TreadmillRow = {
  angle: string;
  category: string;
  ideas: { pillar_1: string; pillar_2: string; pillar_3: string };
};

export type ScheduleRow = {
  day: string;
  angle: string;
  pillar: string;
  category: string;
  funnel: string;
};

export type Pillars = {
  pillars: Pillar[];
  treadmill: TreadmillRow[];
  weekly_schedule: ScheduleRow[];
  ctas: {
    main_offer: string[];
    newsletter: string[];
    waitlist: string[];
  };
};

export type Onboarding = {
  name?: string;
  main_service?: string;
  main_offer?: string;
  target_audience?: string;
  newsletter_url?: string;
  lead_magnet_url?: string;
  waitlist_label?: string;
  contrarian_edge?: string;
};

const SYSTEM_PROMPT = `You generate a content strategy for a creator based on their voice profile and business inputs.

Output a JSON object with this exact shape:

{
  "pillars": [
    {"name": "...", "role": "what_i_do" | "my_edge" | "who_i_am", "description": "1-2 sentences in the creator's voice", "purposes": ["...", "...", "..."]}
  ],
  "treadmill": [
    {"angle": "Lesson", "category": "Personal", "ideas": {"pillar_1": "...", "pillar_2": "...", "pillar_3": "..."}},
    {"angle": "Story", "category": "Personal", "ideas": {...}},
    {"angle": "Tips", "category": "Teach", "ideas": {...}},
    {"angle": "Wins", "category": "Show", "ideas": {...}},
    {"angle": "Education", "category": "Teach", "ideas": {...}},
    {"angle": "Mistakes", "category": "Show", "ideas": {...}},
    {"angle": "Case study", "category": "Show", "ideas": {...}},
    {"angle": "Advantage", "category": "Teach", "ideas": {...}},
    {"angle": "Opinion", "category": "Personal", "ideas": {...}},
    {"angle": "Strategy", "category": "Teach", "ideas": {...}}
  ],
  "weekly_schedule": [
    {"day": "Mon", "angle": "Case study", "pillar": "{pillar_name}", "category": "Show/Invite", "funnel": "Bottom"},
    {"day": "Tue", "angle": "Tips", "pillar": "{pillar_name}", "category": "Teach", "funnel": "Middle"},
    {"day": "Wed", "angle": "Wins", "pillar": "{pillar_name}", "category": "Show", "funnel": "Middle"},
    {"day": "Thu", "angle": "Opinion", "pillar": "{pillar_name}", "category": "Personal", "funnel": "Top"},
    {"day": "Fri", "angle": "Lead magnet / Newsletter promo", "pillar": "{pillar_name}", "category": "Invite", "funnel": "Bottom"},
    {"day": "Sat", "angle": "Case study", "pillar": "{pillar_name}", "category": "Invite", "funnel": "Bottom"},
    {"day": "Sun", "angle": "Story", "pillar": "{pillar_name}", "category": "Personal", "funnel": "Top"}
  ],
  "ctas": {
    "main_offer": ["PS. ...", "PS. ...", "PS. ..."],
    "newsletter": ["PS. ...", "PS. ...", "PS. ..."],
    "waitlist": ["PS. ...", "PS. ...", "PS. ..."]
  }
}

Rules:
- Pillars: exactly 3. One = main service (what I do). Two = key skill / contrarian edge. Three = identity / founder life.
- Each treadmill idea is a concrete post hook — not a category label. Written like the creator would pitch the post.
- Treadmill ideas stay in the creator's voice: sentence length, register, avoid banned phrases from the profile.
- Weekly schedule uses ONLY the pillars you generated. Friday is always the lead magnet / newsletter promo slot.
- CTAs: use the creator's real offer, newsletter URL, waitlist if provided. If a URL is missing, use a placeholder like {link_in_bio}.
- Output raw JSON only. No markdown fences. No prose before or after.`;

export async function readOnboarding(userId: string): Promise<Onboarding | null> {
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from("user_onboarding")
    .select("state")
    .eq("user_id", userId)
    .single();
  return data?.state ?? null;
}

export async function writeOnboarding(userId: string, onboarding: Onboarding): Promise<void> {
  const supabase = await getSupabaseServer();
  await supabase
    .from("user_onboarding")
    .upsert({ user_id: userId, state: onboarding, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
}

export async function writePillars(userId: string, pillars: Pillars): Promise<void> {
  const supabase = await getSupabaseServer();
  await supabase
    .from("user_pillars")
    .upsert({ user_id: userId, draft: pillars, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
}

export async function writePillarsMarkdown(userId: string, markdown: string): Promise<void> {
  const supabase = await getSupabaseServer();
  await supabase
    .from("user_pillars")
    .upsert({ user_id: userId, pillars_markdown: markdown, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
}

export async function generatePillars(
  voice: VoiceDraft,
  onboarding: Onboarding | null,
  apiKey: string,
  language: "en" | "ar" = "en",
): Promise<Pillars> {
  const userPrompt = `VOICE PROFILE (raw answers):
${JSON.stringify(voice.answers, null, 2)}

BUSINESS INPUTS:
${JSON.stringify(onboarding ?? { name: "Unknown" }, null, 2)}

Generate the content pillars JSON now.`;

  const system = language === "ar"
    ? `## CRITICAL LANGUAGE RULE\nاكتب كل قيم النصوص في JSON الناتج باللغة العربية الفصحى الواضحة (الأسماء، الأوصاف، الأهداف، الزوايا، الأفكار، الدعوات للفعل). أبقِ مفاتيح JSON والقيم المُعدّدة (مثل what_i_do, my_edge, who_i_am) بالإنجليزية كما هي.\n\n${SYSTEM_PROMPT}`
    : SYSTEM_PROMPT;

  const res = await claudeFetch(apiKey, {
    model: "claude-haiku-4-5",
    max_tokens: 4000,
    system,
    messages: [{ role: "user", content: userPrompt }],
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Claude API ${res.status}: ${body}`);
  }

  const data = await res.json();
  const text: string = data.content?.[0]?.text?.trim() ?? "";
  if (!text) throw new Error("Empty pillars response");

  const cleaned = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
  return JSON.parse(cleaned);
}

export function renderPillarsMarkdown(userName: string, p: Pillars): string {
  const [p1, p2, p3] = p.pillars;

  const pillarBlock = (pp: Pillar, tagline: string) => `### Pillar — ${pp.name} *(${tagline})*

${pp.description}

**I use this pillar to:**
${pp.purposes.map((x) => `- ${x}`).join("\n")}`;

  const treadmillRows = p.treadmill
    .map((row, i) => {
      const a = row.ideas.pillar_1 ?? "";
      const b = row.ideas.pillar_2 ?? "";
      const c = row.ideas.pillar_3 ?? "";
      return `| ${i + 1} | ${row.angle} | ${a} | ${b} | ${c} | ${row.category} |`;
    })
    .join("\n");

  const scheduleRows = p.weekly_schedule
    .map((r) => `| ${r.day} | ${r.angle} | ${r.pillar} | ${r.category} | ${r.funnel} |`)
    .join("\n");

  const ctaBlock = (label: string, arr: string[]) =>
    `**→ ${label}**\n${arr.map((c) => `> ${c}`).join("\n>\n")}`;

  return `# Content Pillars — ${userName}

Three topics. The more you post about them, the more the right people associate them with you.

---

## Pillars

${pillarBlock(p1, "What I do")}

${pillarBlock(p2, "My edge")}

${pillarBlock(p3, "Who I am")}

---

## The Treadmill × Pillars (30 ideas)

10 angles × 3 pillars. Fill once, post forever.

| # | Angle | ${p1.name} | ${p2.name} | ${p3.name} | Category |
|---|---|---|---|---|---|
${treadmillRows}

---

## Weekly Schedule

| Day | Angle | Pillar | Category | Funnel |
|---|---|---|---|---|
${scheduleRows}

---

## CTAs by Goal

${ctaBlock("Drive to main offer", p.ctas.main_offer)}

${ctaBlock("Drive to newsletter", p.ctas.newsletter)}

${ctaBlock("Drive to waitlist", p.ctas.waitlist)}
`;
}
