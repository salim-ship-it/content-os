import { type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { claudeFetch } from "@/lib/claude-fetch";
import { readVoiceProfile } from "@/lib/voice-storage";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const userId = await requireUser();
  const body = await request.json().catch(() => null);
  const topic = String(body?.topic ?? "").trim();
  const audience = String(body?.audience ?? "").trim();
  const assetType = String(body?.assetType ?? "Guide").trim();

  if (!topic) return Response.json({ error: "topic required" }, { status: 400 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return Response.json({ error: "ANTHROPIC_API_KEY missing" }, { status: 500 });

  const voiceProfile = await readVoiceProfile(userId);

  const system = `You generate viral-potential lead magnet titles.

Patterns that make lead magnet titles spread:
- A specific number ("7 signals", "5 hooks", "12-point checklist")
- A concrete outcome or transformation ("that got me 10k followers", "that 3x'd my reply rate")
- A contrarian or insider angle ("what most founders get wrong", "the one thing X never tell you")
- A named proprietary concept ("The 3-Variable Personalization Model", "The ATL/BTL Framework")
- Time-bounded specificity ("in 30 minutes", "before your next call", "in 2026")
- Identity-forward ("for solo founders", "for Claude Code users")

Rules:
- Each title must feel ownable, not generic.
- No buzzwords ("ultimate", "essential", "comprehensive", "game-changing", "unleash", "leverage").
- No question-mark titles.
- Keep to 5-11 words each.
- Tie to the creator's voice if a profile is provided.

Output a JSON array of exactly 5 strings. No commentary, JSON only.`;

  const userPrompt = `IDEA / TOPIC: ${topic}
AUDIENCE: ${audience || "(not specified)"}
ASSET TYPE: ${assetType}
${voiceProfile ? `\nCREATOR VOICE (mirror tone):\n${voiceProfile.slice(0, 1500)}` : ""}

Generate 5 viral-potential titles. Return raw JSON array.`;

  const res = await claudeFetch(apiKey, {
    model: "claude-haiku-4-5-20251001",
    max_tokens: 500,
    system,
    messages: [{ role: "user", content: userPrompt }],
  });

  if (!res.ok) {
    const err = await res.text();
    return Response.json({ error: `Claude API ${res.status}: ${err.slice(0, 200)}` }, { status: 500 });
  }

  const data = await res.json();
  const raw: string = data.content?.[0]?.text?.trim() ?? "";
  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) return Response.json({ error: "could not parse response" }, { status: 500 });

  let titles: string[] = [];
  try {
    const parsed = JSON.parse(match[0]);
    if (Array.isArray(parsed)) titles = parsed.filter((t) => typeof t === "string" && t.trim()).slice(0, 5);
  } catch {
    return Response.json({ error: "invalid JSON from Claude" }, { status: 500 });
  }

  if (titles.length === 0) return Response.json({ error: "no titles generated" }, { status: 500 });
  return Response.json({ titles });
}
