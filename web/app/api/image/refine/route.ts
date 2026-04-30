import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

// Refines an existing flow/orbit config based on a free-text tweak.
// Reuses the same Claude tools as /api/image/generate so the output shape
// is identical — the only difference is the model gets the previous config
// as context and is instructed to modify it minimally.

let cachedKey: string | null = null;

async function getAnthropicKey(): Promise<string> {
  if (cachedKey) return cachedKey;
  if (process.env.ANTHROPIC_API_KEY) {
    cachedKey = process.env.ANTHROPIC_API_KEY;
    return cachedKey;
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
  description: "Returns the modified orbit config (two products being compared with 4 traits each).",
  input_schema: {
    type: "object" as const,
    properties: {
      topTitle: { type: "string" },
      topLabels: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 4 },
      topAccent: { type: "string" },
      bottomTitle: { type: "string" },
      bottomLabels: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 4 },
      bottomAccent: { type: "string" },
    },
    required: ["topTitle", "topLabels", "topAccent", "bottomTitle", "bottomLabels", "bottomAccent"],
  },
};

const FLOW_TOOL = {
  name: "render_flow",
  description: "Returns the modified flow config (sequential step-by-step workflow with 3-10 stages).",
  input_schema: {
    type: "object" as const,
    properties: {
      title: { type: "string" },
      accent: { type: "string" },
      steps: {
        type: "array",
        minItems: 3,
        maxItems: 10,
        items: {
          type: "object",
          properties: {
            label: { type: "string" },
            sub: { type: "string" },
            icon: { type: "string" },
          },
          required: ["label"],
        },
      },
    },
    required: ["title", "accent", "steps"],
  },
};

const SYSTEM_PROMPT = `You refine an existing LinkedIn workflow/comparison config.

You will get:
- The CURRENT config (as JSON)
- A USER TWEAK (free-text instruction)

Rules:
- Apply ONLY the user's tweak. Don't redesign or rewrite the rest.
- Keep every field the user didn't ask you to change exactly as-is.
- If the user asks for something the data model can't express (e.g. "make it animated", "add motion"), still return the closest config-level interpretation, but don't invent extra steps just to fill space.
- Use the same tool the original config used (render_flow if it has steps; render_orbit if it has top/bottom).
- Always call exactly one tool. No prose.`;

export async function POST(req: NextRequest) {
  let body: {
    format?: unknown;
    config?: unknown;
    tweak?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const format = body.format === "flow" || body.format === "orbit" ? body.format : null;
  const config = body.config && typeof body.config === "object" ? body.config : null;
  const tweak = typeof body.tweak === "string" ? body.tweak.trim() : "";

  if (!format) return NextResponse.json({ error: "Missing/invalid format" }, { status: 400 });
  if (!config) return NextResponse.json({ error: "Missing config" }, { status: 400 });
  if (!tweak) return NextResponse.json({ error: "Missing tweak" }, { status: 400 });

  let key: string;
  try {
    key = await getAnthropicKey();
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "API key error" },
      { status: 500 }
    );
  }

  const userMessage = `CURRENT CONFIG (${format}):
${JSON.stringify(config, null, 2)}

USER TWEAK:
${tweak}

Apply the tweak and return the updated config via the ${format === "flow" ? "render_flow" : "render_orbit"} tool.`;

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
      tool_choice: { type: "tool", name: format === "flow" ? "render_flow" : "render_orbit" },
      messages: [{ role: "user", content: userMessage }],
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
    (c) => c.type === "tool_use"
  );
  if (!toolUse || !toolUse.input || typeof toolUse.input !== "object") {
    return NextResponse.json(
      { error: "Claude did not return a valid tool call." },
      { status: 502 }
    );
  }

  if (format === "orbit") {
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
      return NextResponse.json({ error: "Refined orbit config has wrong shape." }, { status: 502 });
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

  const cfg = toolUse.input as {
    title?: string;
    accent?: string;
    steps?: { label?: string; sub?: string; icon?: string }[];
  };
  if (!cfg.title || !Array.isArray(cfg.steps) || cfg.steps.length < 2) {
    return NextResponse.json({ error: "Refined flow config is missing fields." }, { status: 502 });
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
