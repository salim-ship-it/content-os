import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { claudeFetch } from "@/lib/claude-fetch";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";

async function getApiKey(): Promise<string> {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
  try {
    const env = await fs.readFile(path.join(process.cwd(), ".env.local"), "utf-8");
    for (const line of env.split("\n")) {
      if (line.startsWith("ANTHROPIC_API_KEY=")) {
        return line.split("=", 2)[1].trim().replace(/^['"]|['"]$/g, "");
      }
    }
  } catch {}
  throw new Error("ANTHROPIC_API_KEY not found");
}

const SYSTEM = `You are a diagram strategist. Given a LinkedIn post, write a visual brief that tells the diagram generator exactly what to draw.

Your brief should describe:
1. The layout — how many columns (1–3), what each column represents
2. The nodes — every box: its label (3–6 words from the post), sublabel (meaning/outcome), stat (any number or metric), and color
3. The connections — which boxes flow into which
4. Any column headings (for contrasts or multi-track systems)

Color coding:
- Red #f87171 — bad path, wrong way, friction, churn
- Green #4ade80 — good path, fix, result, win
- Purple #8182C1 — neutral, process step, system component
- Yellow #fbbf24 — warning, transition, pivot

Layout guidance:
- Contrast (wrong vs right, before vs after): 2 columns, shared start + end
- Linear story or process: 1 column, steps flow down
- System with parallel tracks: 2–3 columns, each is a track
- Framework or breakdown: 2–3 columns, each is a category

Be specific. Use the exact words from the post. Don't invent content.
Output ONLY the brief. No preamble, no explanation.`;

export async function POST(req: NextRequest) {
  await requireUser();

  let body: { post?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const post = typeof body.post === "string" ? body.post.trim() : "";
  if (!post) {
    return NextResponse.json({ error: "Missing post" }, { status: 400 });
  }

  const apiKey = await getApiKey();
  const response = await claudeFetch(apiKey, {
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: SYSTEM,
    messages: [{ role: "user", content: `Post:\n\n${post}` }],
  });

  if (!response.ok) {
    const text = await response.text();
    return NextResponse.json(
      { error: `Claude API ${response.status}: ${text.slice(0, 200)}` },
      { status: 500 }
    );
  }

  const data = await response.json();
  const brief = data?.content?.[0]?.text ?? "";

  return NextResponse.json({ brief });
}
