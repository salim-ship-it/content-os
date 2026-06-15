import { getSupabaseServer } from "@/lib/supabase-server";
import { claudeFetch } from "@/lib/claude-fetch";
import { readVoiceProfile } from "@/lib/voice-storage";
import { REPO_ROOT } from "@/lib/paths";
import { promises as fs } from "fs";
import path from "path";

export type AssetType =
  | "Guide"
  | "Framework"
  | "Swipe File"
  | "Template"
  | "Playbook"
  | "Checklist"
  | "Tool / Script"
  | "Email course";

export type OutputFormat =
  | "notion-markdown"
  | "vercel-mdx"
  | "newsletter-plaintext"
  | "google-doc-markdown"
  | "miro-outline";

export const ASSET_TYPES: AssetType[] = [
  "Guide",
  "Framework",
  "Swipe File",
  "Template",
  "Playbook",
  "Checklist",
  "Tool / Script",
  "Email course",
];

export const OUTPUT_FORMATS: { id: OutputFormat; label: string; ext: string }[] = [
  { id: "notion-markdown", label: "Markdown (Notion)", ext: "md" },
  { id: "vercel-mdx", label: "MDX (Vercel site)", ext: "mdx" },
  { id: "newsletter-plaintext", label: "Plain text (newsletter)", ext: "txt" },
  { id: "google-doc-markdown", label: "Markdown (Google Doc)", ext: "md" },
  { id: "miro-outline", label: "Miro outline", ext: "md" },
];

export type Section = {
  id: string;
  name: string;
  description: string;
  defaultOn: boolean;
};

export const ASSET_SECTIONS: Record<AssetType, Section[]> = {
  Guide: [
    { id: "hook", name: "Hook + promise", description: "Opening hook and what the reader walks away with", defaultOn: true },
    { id: "problem", name: "The problem", description: "Why this matters, who struggles with it", defaultOn: true },
    { id: "steps", name: "Step-by-step", description: "The actual walkthrough", defaultOn: true },
    { id: "example", name: "Worked example", description: "One concrete run-through with real numbers/outputs", defaultOn: true },
    { id: "mistakes", name: "Common mistakes", description: "What people get wrong + how to avoid", defaultOn: true },
    { id: "author_intro", name: "Author intro page", description: "Who you are + why listen to you", defaultOn: false },
    { id: "cta", name: "Closing CTA", description: "Closing call to action — user picks the destination", defaultOn: false },
  ],
  Framework: [
    { id: "name_explainer", name: "The framework (named)", description: "Framework name + one-line definition + why it exists", defaultOn: true },
    { id: "components", name: "Each component", description: "Each of the 3-5 components with what/why/how", defaultOn: true },
    { id: "connections", name: "How they connect", description: "Text diagram of the flow between components", defaultOn: true },
    { id: "when_to_use", name: "When to use it", description: "The situations this framework applies to", defaultOn: true },
    { id: "example", name: "Worked example", description: "One full application of the framework", defaultOn: true },
    { id: "author_intro", name: "Author intro page", description: "Who you are + why listen to you", defaultOn: false },
    { id: "cta", name: "Closing CTA", description: "Closing call to action — user picks the destination", defaultOn: false },
  ],
  "Swipe File": [
    { id: "intro", name: "Intro + how to use", description: "What this swipe file is and how to pick from it", defaultOn: true },
    { id: "examples", name: "The examples (10-20)", description: "Each example: raw text + one-line why-it-works", defaultOn: true },
    { id: "tags", name: "Categorization / index", description: "Tags or groupings so the reader can find by situation", defaultOn: false },
    { id: "author_intro", name: "Author intro page", description: "Who you are + why listen to you", defaultOn: false },
    { id: "cta", name: "Closing CTA", description: "Closing call to action — user picks the destination", defaultOn: false },
  ],
  Template: [
    { id: "intro", name: "What this template is for", description: "Problem it solves + ideal use case", defaultOn: true },
    { id: "how_to_use", name: "How to use it", description: "Step-by-step instructions", defaultOn: true },
    { id: "template", name: "The template", description: "Fill-in-the-blanks with [BRACKETS] for variables", defaultOn: true },
    { id: "examples", name: "2-3 worked examples", description: "Filled-in examples showing variations", defaultOn: true },
    { id: "author_intro", name: "Author intro page", description: "Who you are + why listen to you", defaultOn: false },
    { id: "cta", name: "Closing CTA", description: "Closing call to action — user picks the destination", defaultOn: false },
  ],
  Playbook: [
    { id: "when", name: "When to run this playbook", description: "Triggering situation + prerequisites", defaultOn: true },
    { id: "plays", name: "The plays", description: "Each play: trigger → action → expected result → measure", defaultOn: true },
    { id: "measurement", name: "How to measure success", description: "Concrete metrics + cadence", defaultOn: true },
    { id: "combining", name: "Combining plays", description: "How the plays interact / escalate", defaultOn: false },
    { id: "author_intro", name: "Author intro page", description: "Who you are + why listen to you", defaultOn: false },
    { id: "cta", name: "Closing CTA", description: "Closing call to action — user picks the destination", defaultOn: false },
  ],
  Checklist: [
    { id: "intro", name: "Intro + how to use", description: "Why this checklist, when to run it", defaultOn: true },
    { id: "items", name: "The checklist items", description: "10-30 checkable items grouped into 2-5 sections", defaultOn: true },
    { id: "scoring", name: "Scoring / rubric", description: "Optional scoring so users can grade themselves", defaultOn: false },
    { id: "author_intro", name: "Author intro page", description: "Who you are + why listen to you", defaultOn: false },
    { id: "cta", name: "Closing CTA", description: "Closing call to action — user picks the destination", defaultOn: false },
  ],
  "Tool / Script": [
    { id: "intro", name: "What this tool does", description: "Problem it solves + end state", defaultOn: true },
    { id: "prereqs", name: "Prerequisites", description: "What the user needs before running", defaultOn: true },
    { id: "code", name: "The code / commands", description: "The actual tool (fenced code blocks)", defaultOn: true },
    { id: "run", name: "How to run", description: "Step-by-step run instructions", defaultOn: true },
    { id: "output", name: "Expected output", description: "What success looks like", defaultOn: true },
    { id: "adapt", name: "How to adapt", description: "Pointers for customizing", defaultOn: false },
    { id: "author_intro", name: "Author intro page", description: "Who you are + why listen to you", defaultOn: false },
    { id: "cta", name: "Closing CTA", description: "Closing call to action — user picks the destination", defaultOn: false },
  ],
  "Email course": [
    { id: "overview", name: "Course overview", description: "What the course covers + lesson outline", defaultOn: true },
    { id: "day1", name: "Day 1 lesson", description: "Lesson 1 email: hook, teach, action", defaultOn: true },
    { id: "day2", name: "Day 2 lesson", description: "Lesson 2 email: hook, teach, action", defaultOn: true },
    { id: "day3", name: "Day 3 lesson", description: "Lesson 3 email: hook, teach, action", defaultOn: true },
    { id: "day4", name: "Day 4 lesson", description: "Lesson 4 email: hook, teach, action", defaultOn: true },
    { id: "day5", name: "Day 5 lesson", description: "Lesson 5 email: hook, teach, action, final CTA", defaultOn: true },
    { id: "author_intro", name: "Author intro (day 0)", description: "Opening welcome email introducing you", defaultOn: false },
  ],
};

export type CtaType =
  | "newsletter"
  | "book-a-call"
  | "waitlist"
  | "product"
  | "community"
  | "freebie"
  | "custom";

export const CTA_TYPES: { id: CtaType; label: string; verb: string }[] = [
  { id: "newsletter", label: "Newsletter", verb: "subscribe to my newsletter" },
  { id: "book-a-call", label: "Book a call", verb: "book a call with me" },
  { id: "waitlist", label: "Waitlist", verb: "join the waitlist" },
  { id: "product", label: "Product / Course", verb: "check out my product" },
  { id: "community", label: "Community", verb: "join the community" },
  { id: "freebie", label: "Another free asset", verb: "grab the next free resource" },
  { id: "custom", label: "Custom", verb: "take the next step" },
];

export type GenerateInput = {
  title: string;
  topic: string;
  audience: string;
  assetType: AssetType;
  outputFormat: OutputFormat;
  angle?: string;
  sections: string[];
  context?: string;
  ctaType?: CtaType;
  ctaDestination?: string;
};

export type StoredLeadMagnet = {
  id: string;
  title: string;
  topic: string;
  asset_type: AssetType;
  output_format: OutputFormat;
  content: string;
  created_at: string;
};

function formatGuidance(format: OutputFormat): string {
  switch (format) {
    case "notion-markdown":
      return `Output clean Markdown ready to paste into a new Notion page.
Use # H1 for the title, ## H2 for sections, ### H3 for sub-sections.
Use bullet lists ("- item"), numbered lists, bold (**x**), callouts as "> ...".
Tables allowed. No frontmatter. No MDX. No React components.`;

    case "vercel-mdx":
      return `Output MDX with YAML frontmatter ready to drop into a Next.js App Router site.
Start with a frontmatter block:
---
title: "<title>"
description: "<one-sentence hook>"
cover: ""
published: true
---

Then the body in Markdown (MDX-compatible). Use H1 only for the main title, H2 for sections.
No React components (no <Callout>, no <Button>). Keep it portable Markdown inside MDX.`;

    case "newsletter-plaintext":
      return `Output as plain email-newsletter text.
NO markdown syntax. No #, no **, no -, no tables.
Use blank lines between paragraphs. Short paragraphs (1-3 sentences each).
ALL CAPS allowed for section headers (e.g. "THE 3 STEPS").
Write like a founder emailing their list at 6am. Personal. Direct.`;

    case "google-doc-markdown":
      return `Output Markdown optimized for pasting into a blank Google Doc.
Google Docs respects: # headings, **bold**, *italic*, bullet lists, numbered lists, links.
AVOID: tables (paste breaks), code fences (paste as plain text), callout blockquotes.
Use clear headings and lists. Paragraphs between them.`;

    case "miro-outline":
      return `Output as a structured outline for a Miro board, in Markdown, with two sections:

## Nodes
A flat numbered list. Each node = one sticky note on the board. Format:
1. [Node name] — short description
2. [Node name] — short description
...

## Connections
Describe the flow between nodes as arrows. Format:
- Node 1 → Node 2 (why)
- Node 2 → Node 3 (why)
...

## Swimlanes (optional)
If the concept groups into categories, list the groupings:
- Lane A: Node 1, Node 2
- Lane B: Node 3, Node 4

This is an outline the user will manually arrange in Miro. Be concrete and visual.`;
  }
}

function bannedPhrasesReminder(): string {
  return `Anti-AI voice rules:
- No "it's not X, it's Y" reveals.
- No rhetorical questions as transitions ("But what does this really mean?").
- No symmetrical sentence pairs stacked back to back.
- No closing morals ("Because at the end of the day...").
- No parallel bullet lists where every line is the same length.
- No fake stats. If a number isn't real, frame as personal observation ("7 out of 10 emails I get..." not "73% of B2B emails...").
- No "delve", "tapestry", "elevate", "robust", "seamless", "cutting-edge", "leverage" (as a verb), "unleash".`;
}

async function loadApiKey(): Promise<string> {
  let apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) return apiKey;
  try {
    const envPath = path.join(REPO_ROOT, ".env.local");
    const envRaw = await fs.readFile(envPath, "utf-8");
    for (const line of envRaw.split("\n")) {
      const match = line.match(/^ANTHROPIC_API_KEY\s*=\s*(.+)$/);
      if (match) {
        apiKey = match[1].trim().replace(/^["']|["']$/g, "");
        break;
      }
    }
  } catch { /* ignore */ }
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not found");
  return apiKey;
}

function resolveSections(assetType: AssetType, ids: string[]): Section[] {
  const all = ASSET_SECTIONS[assetType];
  const byId = new Map(all.map((s) => [s.id, s]));
  const ordered = all.filter((s) => ids.includes(s.id));
  for (const id of ids) {
    if (!byId.has(id)) continue;
  }
  return ordered;
}

export async function generateLeadMagnet(
  userId: string,
  input: GenerateInput,
): Promise<string> {
  const apiKey = await loadApiKey();
  const voiceProfile = await readVoiceProfile(userId);
  const enabledSections = resolveSections(input.assetType, input.sections);
  if (enabledSections.length === 0) {
    throw new Error("At least one section must be enabled");
  }

  const ctaInfo = CTA_TYPES.find((c) => c.id === input.ctaType);

  const sectionPlan = enabledSections
    .map((s, i) => {
      if (s.id === "cta" && ctaInfo) {
        const dest = input.ctaDestination?.trim();
        return `${i + 1}. Closing CTA: invite the reader to ${ctaInfo.verb}${dest ? ` — destination: ${dest}` : ""}. Write this in the creator's voice. Keep it short (2-4 sentences). Do NOT use the heading "CTA" or "Call to action"; use a natural heading that fits the document.`;
      }
      return `${i + 1}. ${s.description}`;
    })
    .join("\n");

  const hasContext = !!(input.context && input.context.trim().length >= 20);

  const groundingRule = hasContext
    ? `PERSONAL CONTEXT RULE (STRICT — THIS IS THE MOST IMPORTANT INSTRUCTION):
All stats, numbers, client names, outcomes, case stories, example messages, scripts, dollar figures, timeframes, and specific tactics MUST come ONLY from the user's context block below. Do NOT invent any data point, example, client, quote, or metric that isn't explicitly in the context.
If the context doesn't cover a section, write that section shorter, from the creator's POV, WITHOUT making up specifics. Use "in my own work" / "from what I've seen" phrasing — never a fabricated number like "73%" or a fake client name.
Quote directly from the context where possible. Lift the creator's actual examples, scripts, and phrasing and use them verbatim where it fits.
If you need a number and the context doesn't have one, say "a lot", "most", "almost always" — don't invent a statistic.`
    : `NO CONTEXT PROVIDED:
The user didn't paste any specific stats, stories, or examples. This is a constraint. Do NOT invent data points, client names, or specific metrics to fill the gap. Keep the asset principle-first and explicitly point out that real examples come from the creator's own work. Phrases allowed: "in my own work", "from what I've seen", "when I run this with clients". Phrases banned: anything like "73% of founders", "one client got 3x", "X company saw". Keep the doc shorter and more principle-focused rather than fabricating specifics.`;

  const system = `You are a ghostwriter producing a lead magnet for a creator.
Output the ASSET ITSELF — not an outline, not a pitch, not a preamble. Skip all meta-commentary.
Write in the creator's voice as described by their voice profile. Stay concrete, specific, and useful.

${groundingRule}

ASSET TYPE: ${input.assetType}

INTERNAL STRUCTURE (use this as your outline, in this order):
${sectionPlan}

Critical: the numbered points above are the internal scaffolding I want you to follow — they are NOT the headings. Write natural, topic-specific headings that belong in a real ${input.assetType.toLowerCase()} about this topic. Never write a heading like "Hook + Promise", "The Problem", "Step-by-Step", "Author Intro", "CTA to Newsletter". Those are template labels. Use headings a reader would expect in a real document.

Follow the order of the structure. Do not add sections beyond it. Do not skip any listed point.

OUTPUT FORMAT: ${input.outputFormat}
${formatGuidance(input.outputFormat)}

${bannedPhrasesReminder()}

Length: aim for ~200-500 words per section. Email course day lessons can run 300-600 words each.`;

  const voiceBlock = voiceProfile
    ? `## Creator voice profile (mirror this exactly)\n\n${voiceProfile}`
    : `## Creator voice profile\n\n(No voice profile saved yet — write in clear, direct, practical tone.)`;

  const contextBlock = hasContext
    ? `\n## USER CONTEXT (source of truth — use these facts only)\n\n${input.context!.trim()}\n`
    : "";

  const userPrompt = `${voiceBlock}

## This lead magnet

- **Title**: ${input.title}
- **Topic**: ${input.topic}
- **Audience**: ${input.audience}
- **Asset type**: ${input.assetType}
- **Output format**: ${input.outputFormat}
${input.angle ? `- **Angle / hook**: ${input.angle}` : ""}
${contextBlock}

Write the asset now. Output ONLY the asset content in the requested format — no preamble, no closing note, no "here is your lead magnet". Follow the internal structure, use natural topic-specific headings, and ground every specific claim in the user context above.`;

  const res = await claudeFetch(apiKey, {
    model: "claude-haiku-4-5-20251001",
    max_tokens: 8000,
    system,
    messages: [{ role: "user", content: userPrompt }],
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude API ${res.status}: ${err.slice(0, 300)}`);
  }

  const data = await res.json();
  const content = data.content?.[0]?.text?.trim();
  if (!content) throw new Error("Empty response from Claude");
  return content;
}

export async function saveLeadMagnet(
  userId: string,
  input: GenerateInput,
  content: string,
): Promise<StoredLeadMagnet> {
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from("user_lead_magnets")
    .insert({
      user_id: userId,
      title: input.title,
      topic: input.topic,
      asset_type: input.assetType,
      output_format: input.outputFormat,
      content,
    })
    .select("*")
    .single();
  if (error) throw new Error(`Supabase insert failed: ${error.message}`);
  return data as StoredLeadMagnet;
}

export async function listLeadMagnets(userId: string): Promise<StoredLeadMagnet[]> {
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from("user_lead_magnets")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Supabase select failed: ${error.message}`);
  return (data as StoredLeadMagnet[]) ?? [];
}

export async function deleteLeadMagnet(userId: string, id: string): Promise<void> {
  const supabase = await getSupabaseServer();
  const { error } = await supabase
    .from("user_lead_magnets")
    .delete()
    .eq("user_id", userId)
    .eq("id", id);
  if (error) throw new Error(`Supabase delete failed: ${error.message}`);
}

export async function getLeadMagnet(
  userId: string,
  id: string,
): Promise<StoredLeadMagnet | null> {
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from("user_lead_magnets")
    .select("*")
    .eq("user_id", userId)
    .eq("id", id)
    .single();
  return (data as StoredLeadMagnet) ?? null;
}
