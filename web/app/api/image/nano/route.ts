import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import os from "os";

// Pipeline: user brief → Claude Haiku expands into a designer's brief →
// Gemini 2.5 Flash Image renders the PNG with style references attached.
// The expander gives Gemini layout/palette/typography intent. The reference
// images (Yonathan-style frames) anchor the visual aesthetic.

type Composition = "comparison" | "flow" | "poster";

// Two reference frames per composition type. Comparison refs are dark/orbit
// style. Flow refs are light/numbered-step style. Poster refs are bold hero.
const REFS_BY_COMPOSITION: Record<Composition, string[]> = {
  comparison: [
    "03-claude-code-and-codex-are-not-the-same-thing.jpg",
    "05-claude-is-making-every-other-ai-tool-irrelevant.jpg",
  ],
  flow: [
    "06-stop-waiting-for-inbound-outbound-your.jpg",
    "07-turn-any-personal-email-into-a-full-lead.jpg",
  ],
  poster: [
    "01-clone-yourself-to-qualify-prospects-on-your.jpg",
    "10-face-to-face-ai-closes-3x-more-than-voice.jpg",
  ],
};

async function loadStyleRefs(
  composition: Composition
): Promise<{ mimeType: string; data: string }[]> {
  const dir = path.join(process.cwd(), "public", "examples", "yonathan");
  const refs: { mimeType: string; data: string }[] = [];
  for (const name of REFS_BY_COMPOSITION[composition]) {
    try {
      const buf = await fs.readFile(path.join(dir, name));
      refs.push({ mimeType: "image/jpeg", data: buf.toString("base64") });
    } catch {
      // skip missing refs silently
    }
  }
  return refs;
}

let cachedGemini: string | null = null;
let cachedAnthropic: string | null = null;

async function getGeminiKey(): Promise<string> {
  if (cachedGemini) return cachedGemini;
  if (process.env.GEMINI_API_KEY) {
    cachedGemini = process.env.GEMINI_API_KEY;
    return cachedGemini;
  }
  const envPath = path.join(os.homedir(), ".vectorlabs", ".env");
  try {
    const raw = await fs.readFile(envPath, "utf-8");
    for (const line of raw.split("\n")) {
      if (line.startsWith("GEMINI_API_KEY=")) {
        cachedGemini = line.split("=", 2)[1].trim();
        return cachedGemini;
      }
    }
  } catch {
    // fall through
  }
  throw new Error("GEMINI_API_KEY not found");
}

async function getAnthropicKey(): Promise<string> {
  if (cachedAnthropic) return cachedAnthropic;
  if (process.env.ANTHROPIC_API_KEY) {
    cachedAnthropic = process.env.ANTHROPIC_API_KEY;
    return cachedAnthropic;
  }
  const candidates = [
    path.join(process.cwd(), ".keys.json"),
    path.join(process.cwd(), "..", "..", "outbound-os", "web", ".keys.json"),
    "/Users/salim/Desktop/vectorlabs-os/outbound-os/web/.keys.json",
  ];
  for (const p of candidates) {
    try {
      const raw = await fs.readFile(p, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed.ANTHROPIC_API_KEY) {
        cachedAnthropic = parsed.ANTHROPIC_API_KEY;
        return cachedAnthropic;
      }
    } catch {
      // try next path
    }
  }
  throw new Error("ANTHROPIC_API_KEY not found");
}

const EXPANDER_SYSTEM = `You are a senior visual designer writing briefs for an image generation model. The output must look like a top creative agency made it — Apple keynote × Stripe Press × viral LinkedIn carousel cover. NOT clean corporate, NOT minimal hairline, NOT generic SaaS.

Default mood: BOLD, CINEMATIC, HIGH-CONTRAST, MOTION-FILLED. Drama by default, not restraint.

Take the user's short brief and expand it into a 12–20 line designer's prompt covering:

1. LAYOUT — concrete spatial instructions. Where does each element sit? Columns, grids, dividers, jagged rips, diagonal splits.
2. PALETTE — saturated, confident colors with hex codes. Use gradients. ("deep navy #0a1029 → electric purple #6b21a8 → warm orange #f97316"). Avoid pale corporate grays unless the user asks.
3. TYPOGRAPHY — massive, bold sans-serif. State weight, mood, treatment. ("80px ultra-bold sans-serif, distressed grey with film grain, soft white glow halo").
4. MOTION & EFFECTS — REQUIRED. Particle effects, motion blur, light streaks, glow halos, drop shadows, dissolves, pixel scatter, lens flares, gradient depth. The image must feel alive.
5. STYLE ANCHORS — name 2–3 real design references. ("Apple keynote × Stripe Press × Behance editorial poster", "Linear changelog × Figma 2024 launch graphic", "viral LinkedIn carousel hook cover").
6. ASPECT — match the requested aspect ratio.

EXAMPLE of the caliber you should hit (for a before/after stack):

"A high-end editorial before/after graphic. Two columns split by a jagged diagonal lightning-rip. LEFT 'BEFORE' — desaturated, film-grain greyscale, ghosted icons. RIGHT 'NOW' — vibrant gradient (deep navy #0a1029 → electric purple #6b21a8 → warm orange #f97316), full saturation, glowing halos. 4 horizontal rows, each row a tool-pair: old app (faded, dusty) → new app (sharp, glow halo, drop shadow). Motion-blurred arrows with speed lines connecting each pair, particle dissolve across the divide as if old tools are pixelating into the new ones. HEADERS: 'BEFORE' in 96px distressed grey, 'NOW' in 96px bright white with soft glow. Tag below NOW: 'the new stack' in 16px lowercase. Footer: '— upgrade your stack' in 14px. Style: Apple keynote × Stripe Press × viral LinkedIn carousel cover. Square 1:1, retina-sharp."

HARD RULES:
- Keep user content FAITHFUL. If they listed 4 rows, return 4. Use their exact tool/brand names verbatim. Never invent items, captions, claims.
- Design decisions (layout, palette, type, motion, references) ARE your job — pick confidently.
- Default to BOLD. Restraint only if the user explicitly asks for minimal/clean.
- Output ONLY the brief — no preamble, no markdown headers, no quotes.`;

async function expandBrief(
  userPrompt: string,
  format: string,
  key: string
): Promise<{ brief: string; composition: Composition }> {
  const aspectLine = `Aspect ratio: ${format}.`;
  const apiRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: EXPANDER_SYSTEM,
      tools: [
        {
          name: "render_image",
          description: "Output the designer's brief plus the composition type for picking style references.",
          input_schema: {
            type: "object" as const,
            properties: {
              composition: {
                type: "string",
                enum: ["comparison", "flow", "poster"],
                description:
                  "comparison = side-by-side or before/after. flow = sequential steps / pipeline / workflow. poster = single hero statement / quote / announcement.",
              },
              brief: {
                type: "string",
                description: "The 12-20 line designer's brief for the image generator.",
              },
            },
            required: ["composition", "brief"],
          },
        },
      ],
      tool_choice: { type: "tool", name: "render_image" },
      messages: [
        {
          role: "user",
          content: `User brief: ${userPrompt}\n\n${aspectLine}\n\nClassify the composition type, then write the designer's brief.`,
        },
      ],
    }),
  });
  if (!apiRes.ok) {
    const errText = await apiRes.text();
    throw new Error(`Anthropic ${apiRes.status}: ${errText.slice(0, 300)}`);
  }
  const data = (await apiRes.json()) as {
    content?: { type: string; name?: string; input?: { composition?: string; brief?: string } }[];
  };
  const toolUse = data.content?.find((c) => c.type === "tool_use" && c.name === "render_image");
  const composition = toolUse?.input?.composition as Composition | undefined;
  const brief = toolUse?.input?.brief?.trim();
  if (!brief || !composition) throw new Error("Haiku returned empty expansion");
  return { brief, composition };
}

export async function POST(req: NextRequest) {
  let body: { prompt?: unknown; format?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  const format = typeof body.format === "string" ? body.format : "1:1";
  if (!prompt) return NextResponse.json({ error: "Missing prompt" }, { status: 400 });

  let geminiKey: string;
  let anthropicKey: string;
  try {
    [geminiKey, anthropicKey] = await Promise.all([getGeminiKey(), getAnthropicKey()]);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "API key error" },
      { status: 500 }
    );
  }

  let expansion: { brief: string; composition: Composition };
  try {
    expansion = await expandBrief(prompt, format, anthropicKey);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Expansion failed" },
      { status: 502 }
    );
  }
  const { brief: expanded, composition } = expansion;

  const styleRefs = await loadStyleRefs(composition);
  const refIntro =
    styleRefs.length > 0
      ? `STYLE REFERENCES — match the visual aesthetic of these images (composition style: ${composition}). Copy their typography weight, color palette, spacing rhythm, icon treatment, and overall poster vibe. Do NOT copy their content — only the look:\n\n`
      : "";

  const parts: ({ text: string } | { inlineData: { mimeType: string; data: string } })[] = [];
  if (refIntro) parts.push({ text: refIntro });
  for (const ref of styleRefs) {
    parts.push({ inlineData: ref });
  }
  parts.push({ text: `\n\nNOW GENERATE THIS IMAGE:\n\n${expanded}` });

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${encodeURIComponent(geminiKey)}`;
  const apiRes = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts }],
    }),
  });

  if (!apiRes.ok) {
    const errText = await apiRes.text();
    return NextResponse.json(
      { error: `Gemini API ${apiRes.status}: ${errText.slice(0, 400)}` },
      { status: 502 }
    );
  }

  const data = (await apiRes.json()) as {
    candidates?: { content?: { parts?: { inlineData?: { mimeType?: string; data?: string } }[] } }[];
  };

  const part = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
  const b64 = part?.inlineData?.data;
  if (!b64) {
    return NextResponse.json(
      { error: "No image returned by Gemini." },
      { status: 502 }
    );
  }

  const buf = Buffer.from(b64, "base64");
  return new Response(new Uint8Array(buf), {
    status: 200,
    headers: {
      "Content-Type": part?.inlineData?.mimeType || "image/png",
      "Cache-Control": "no-store",
      "X-Composition": composition,
      "X-Refs-Used": String(styleRefs.length),
      "X-Expanded-Brief": Buffer.from(expanded).toString("base64").slice(0, 1024),
    },
  });
}
