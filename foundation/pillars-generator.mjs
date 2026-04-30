#!/usr/bin/env node

/**
 * pillars-generator.mjs
 *
 * Reads voice-draft.json + onboarding.json, asks Claude to produce:
 *   - 3 content pillars (what I do / my edge / who I am)
 *   - 30-idea treadmill (10 angles × 3 pillars)
 *   - Weekly schedule with 1 lead-magnet slot (Friday)
 *   - CTAs by goal
 *
 * Outputs:
 *   - content-os/foundation/pillars-draft.json
 *   - content-os/foundation/content-pillars.md
 *
 * Usage:
 *   ANTHROPIC_API_KEY=... node content-os/foundation/pillars-generator.mjs
 */

import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FOUNDATION_DIR = __dirname;

const MODEL = 'claude-opus-4-6';
const API_URL = 'https://api.anthropic.com/v1/messages';

const SYSTEM_PROMPT = `You generate content strategy for a creator based on their voice profile and business inputs.

Your output is a JSON object with this exact shape:

{
  "pillars": [
    {"name": "...", "role": "what_i_do" | "my_edge" | "who_i_am", "description": "1-2 sentences in the creator's voice", "purposes": ["...", "...", "..."]},
    ...
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
- Pillars: exactly 3. One = main service / what they do. Two = key skill / contrarian edge. Three = identity / founder life.
- Each pillar idea in the treadmill must be a concrete post hook — not a category label. Write it like the creator would pitch the post.
- Treadmill ideas stay in the creator's voice: sentence length, register, and avoid their banned phrases. Use their rhythm.
- Weekly schedule uses ONLY the pillars you generated. Friday is always the lead magnet / newsletter promo slot.
- CTAs: use the creator's real offer, newsletter URL, waitlist if provided. If a URL is missing, use a placeholder like {link_in_bio}.
- Output raw JSON only. No markdown fences. No prose before or after.`;

function buildUserPrompt({ voice, onboarding }) {
  return `VOICE PROFILE (raw answers):
${JSON.stringify(voice.answers, null, 2)}

BUSINESS INPUTS:
${JSON.stringify(onboarding, null, 2)}

Generate the content pillars JSON now.`;
}

async function callClaude({ voice, onboarding, apiKey }) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildUserPrompt({ voice, onboarding }) }],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Claude API ${res.status}: ${body}`);
  }

  const data = await res.json();
  const text = data.content?.[0]?.text?.trim();
  if (!text) throw new Error('Empty response from Claude');

  const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
  return JSON.parse(cleaned);
}

function renderMarkdown({ user, pillars, treadmill, weekly_schedule, ctas }) {
  const p1 = pillars[0], p2 = pillars[1], p3 = pillars[2];

  const pillarBlock = (p, tagline) => `### Pillar — ${p.name} *(${tagline})*

${p.description}

**I use this pillar to:**
${p.purposes.map((x) => `- ${x}`).join('\n')}`;

  const treadmillRows = treadmill
    .map((row, i) => {
      const a = row.ideas.pillar_1 || row.ideas[p1.name] || '';
      const b = row.ideas.pillar_2 || row.ideas[p2.name] || '';
      const c = row.ideas.pillar_3 || row.ideas[p3.name] || '';
      return `| ${i + 1} | ${row.angle} | ${a} | ${b} | ${c} | ${row.category} |`;
    })
    .join('\n');

  const scheduleRows = weekly_schedule
    .map((r) => `| ${r.day} | ${r.angle} | ${r.pillar} | ${r.category} | ${r.funnel} |`)
    .join('\n');

  const ctaBlock = (label, arr) =>
    `**→ ${label}**\n${arr.map((c) => `> ${c}`).join('\n>\n')}`;

  return `# Content Pillars — ${user}

Three topics. The more you post about them, the more the right people associate them with you.

---

## Pillars

${pillarBlock(p1, 'What I do')}

${pillarBlock(p2, 'My edge')}

${pillarBlock(p3, 'Who I am')}

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

${ctaBlock('Drive to main offer', ctas.main_offer)}

${ctaBlock('Drive to newsletter', ctas.newsletter)}

${ctaBlock('Drive to waitlist', ctas.waitlist)}
`;
}

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('Missing ANTHROPIC_API_KEY env var.');
    process.exit(1);
  }

  const voicePath = resolve(FOUNDATION_DIR, 'voice-draft.json');
  const onboardingPath = resolve(FOUNDATION_DIR, 'onboarding.json');

  const voice = JSON.parse(await readFile(voicePath, 'utf8'));

  let onboarding;
  try {
    onboarding = JSON.parse(await readFile(onboardingPath, 'utf8'));
  } catch {
    console.error(
      `Missing ${onboardingPath}. Create it with fields: name, main_service, main_offer, target_audience, newsletter_url, lead_magnet_url, waitlist_label.`,
    );
    process.exit(1);
  }

  console.log(`Generating pillars for ${onboarding.name}...`);
  const result = await callClaude({ voice, onboarding, apiKey });

  const jsonOut = resolve(FOUNDATION_DIR, 'pillars-draft.json');
  await writeFile(jsonOut, JSON.stringify(result, null, 2));
  console.log(`→ ${jsonOut}`);

  const md = renderMarkdown({ user: onboarding.name, ...result });
  const mdOut = resolve(FOUNDATION_DIR, 'content-pillars.md');
  await writeFile(mdOut, md);
  console.log(`→ ${mdOut}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
