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

const SYSTEM = `You are a visual diagram strategist. Given a LinkedIn post, you:
1. Identify the core concept (a process, a contrast, a journey, a framework, a breakdown)
2. Pick the single best diagram pattern for it
3. Write a detailed Excalidraw brief that will produce a compelling companion visual

Diagram patterns:
- fork: one starting point splits into two contrasting paths (good for "wrong way vs right way", "before vs after", "most people vs the fix")
- linear pipeline: steps flow left to right or top to bottom (good for processes, workflows, sequences)
- hub-and-spoke: one centre with inputs or outputs radiating out (good for "one thing that drives many", "many sources feeding one output")
- cycle: a loop with a decision point (good for repeating processes, feedback loops)
- timeline: events along a horizontal axis with markers (good for journeys, day-by-day progressions)

Brief format rules:
- State the pattern first: "Pattern: fork" / "Pattern: linear pipeline" etc.
- Name every box with the exact words from the post — don't invent labels
- After each box, add "→ label below: [what this step produces or means]"
- For fork diagrams: label the left column (wrong/bad path) and right column (right/fix path) clearly
- Specify box stroke colors: red (#f87171) for bad path, green (#4ade80) for good path, periwinkle (#8182C1) for neutral steps
- End with: "Arrows in periwinkle. All text lowercase. Dark background."

Output ONLY the brief. No explanation, no preamble.`;

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
    model: "claude-haiku-4-5",
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
