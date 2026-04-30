import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

// Reads the user's prompt, calls Claude (Haiku 4.5) with a structured-output tool,
// and returns the OrbitConfig the renderer expects. No image rendering happens here —
// just text → structured JSON.

let cachedKey: string | null = null;

async function getAnthropicKey(): Promise<string> {
  if (cachedKey) return cachedKey;
  if (process.env.ANTHROPIC_API_KEY) {
    cachedKey = process.env.ANTHROPIC_API_KEY;
    return cachedKey;
  }
  // Fallback: read from the outbound-os keys file (Salim's existing setup)
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
        cachedKey = parsed.ANTHROPIC_API_KEY;
        return cachedKey;
      }
    } catch {
      // try next path
    }
  }
  throw new Error("ANTHROPIC_API_KEY not found");
}

const ORBIT_TOOL = {
  name: "render_orbit",
  description:
    "Use ONLY when the user is COMPARING two products/topics/concepts. Returns config for an orbit-comparison: two circles with 4 contrasting traits each.",
  input_schema: {
    type: "object" as const,
    properties: {
      topTitle: { type: "string", description: "Top product/topic name (≤18 chars)." },
      topLabels: {
        type: "array",
        items: { type: "string" },
        minItems: 4,
        maxItems: 4,
        description: "Exactly 4 short trait labels (≤16 chars each).",
      },
      topAccent: { type: "string", description: "Hex color, e.g. #f97316." },
      bottomTitle: { type: "string", description: "Bottom product/topic name." },
      bottomLabels: {
        type: "array",
        items: { type: "string" },
        minItems: 4,
        maxItems: 4,
        description: "4 contrasting traits.",
      },
      bottomAccent: { type: "string" },
    },
    required: [
      "topTitle",
      "topLabels",
      "topAccent",
      "bottomTitle",
      "bottomLabels",
      "bottomAccent",
    ],
  },
};

const FLOW_TOOL = {
  name: "render_flow",
  description:
    "Use when the user describes a SEQUENTIAL PROCESS, PIPELINE, or WORKFLOW. Returns a step-by-step flow with 3–10 stages.",
  input_schema: {
    type: "object" as const,
    properties: {
      title: {
        type: "string",
        description: "Short title at the top (≤40 chars). State the workflow's outcome.",
      },
      accent: {
        type: "string",
        description: "Accent hex color. Pick one that fits the topic.",
      },
      steps: {
        type: "array",
        minItems: 3,
        maxItems: 10,
        items: {
          type: "object",
          properties: {
            label: {
              type: "string",
              description: "Short step name (≤30 chars). Imperative, action-focused.",
            },
            sub: {
              type: "string",
              description:
                "Optional sublabel (≤80 chars). One concrete tool, source, or detail per step.",
            },
            icon: {
              type: "string",
              description:
                "Optional single emoji that captures the step (e.g. 🔍, 📋, 🎯, ⚡).",
            },
          },
          required: ["label"],
        },
        description: "Steps in order. Use as many as the user's brief actually has.",
      },
    },
    required: ["title", "accent", "steps"],
  },
};

const SYSTEM_PROMPT = `You generate configs for LinkedIn-style workflow GIFs.

Two tools available:
- render_orbit — for comparing TWO things side-by-side
- render_flow — for SEQUENTIAL processes / pipelines / step-by-step workflows

Pick the right tool based on the user's intent. If they describe steps in order (first X, then Y, then Z), use render_flow. If they describe a comparison (X vs Y), use render_orbit.

Rules:
- Be FAITHFUL to what the user actually wrote. Don't invent steps or sides they didn't mention.
- If they listed 8 steps, return 8 — not 4.
- Use specific tool/brand names from their brief verbatim (e.g. "Crustdata", "Betterenrich").
- Pick an accent color that fits the topic; brand colors if a known brand is named.
- Always call exactly one tool. No prose.`;

export async function POST(req: NextRequest) {
  let body: { prompt?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt) return NextResponse.json({ error: "Missing prompt" }, { status: 400 });

  let key: string;
  try {
    key = await getAnthropicKey();
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "API key error" },
      { status: 500 }
    );
  }

  const apiRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      tools: [ORBIT_TOOL, FLOW_TOOL],
      tool_choice: { type: "any" },
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!apiRes.ok) {
    const errorText = await apiRes.text();
    return NextResponse.json(
      { error: `Anthropic API ${apiRes.status}: ${errorText.slice(0, 300)}` },
      { status: 502 }
    );
  }

  const data = await apiRes.json();
  const toolUse = (data.content as { type: string; name?: string; input?: unknown }[])?.find(
    (c) => c.type === "tool_use" && (c.name === "render_orbit" || c.name === "render_flow")
  );
  if (!toolUse || !toolUse.input || typeof toolUse.input !== "object") {
    return NextResponse.json(
      { error: "Claude did not return a valid tool call." },
      { status: 502 }
    );
  }

  if (toolUse.name === "render_orbit") {
    const cfg = toolUse.input as {
      topTitle?: string;
      topLabels?: string[];
      topAccent?: string;
      bottomTitle?: string;
      bottomLabels?: string[];
      bottomAccent?: string;
    };
    if (
      !cfg.topTitle ||
      !cfg.bottomTitle ||
      !Array.isArray(cfg.topLabels) ||
      !Array.isArray(cfg.bottomLabels) ||
      cfg.topLabels.length !== 4 ||
      cfg.bottomLabels.length !== 4
    ) {
      return NextResponse.json(
        { error: "Orbit config is missing fields or wrong shape." },
        { status: 502 }
      );
    }
    return NextResponse.json({
      format: "orbit",
      config: {
        topTitle: cfg.topTitle,
        topLabels: cfg.topLabels.slice(0, 4),
        topAccent: cfg.topAccent || "#f97316",
        bottomTitle: cfg.bottomTitle,
        bottomLabels: cfg.bottomLabels.slice(0, 4),
        bottomAccent: cfg.bottomAccent || "#8b5cf6",
      },
    });
  }

  // render_flow
  const cfg = toolUse.input as {
    title?: string;
    accent?: string;
    steps?: { label?: string; sub?: string; icon?: string }[];
  };
  if (!cfg.title || !Array.isArray(cfg.steps) || cfg.steps.length < 2) {
    return NextResponse.json(
      { error: "Flow config is missing title or steps." },
      { status: 502 }
    );
  }
  return NextResponse.json({
    format: "flow",
    config: {
      title: cfg.title,
      accent: cfg.accent || "#f97316",
      steps: cfg.steps
        .filter((s) => typeof s?.label === "string" && s.label.trim().length > 0)
        .map((s) => ({
          label: s.label!,
          sub: typeof s.sub === "string" ? s.sub : undefined,
          icon: typeof s.icon === "string" ? s.icon : undefined,
        })),
    },
  });
}
