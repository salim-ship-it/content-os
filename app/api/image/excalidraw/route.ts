import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

// Pipeline:
//   1. Claude (Sonnet 4.6) reads the brief and emits Excalidraw scene JSON
//      following the AY Automate hand-drawn aesthetic baked into SYSTEM_PROMPT.
//   2. Return the JSON to the client. The browser renders to PNG via the
//      `@excalidraw/excalidraw` package (exportToBlob).
//
// Vercel-safe: no Chromium, no spawned processes. Just a Claude call.

export const runtime = "nodejs";
export const maxDuration = 300;

const REPO_ROOT = process.cwd();

async function getAnthropicKey(): Promise<string> {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
  try {
    const envPath = path.join(REPO_ROOT, ".env.local");
    const env = await fs.readFile(envPath, "utf-8");
    for (const line of env.split("\n")) {
      if (line.startsWith("ANTHROPIC_API_KEY=")) {
        return line.split("=", 2)[1].trim().replace(/^['"]|['"]$/g, "");
      }
    }
  } catch {}
  throw new Error("ANTHROPIC_API_KEY not found");
}

const SYSTEM_PROMPT = `You generate Excalidraw scene JSON for hand-drawn diagrams used in LinkedIn content.

Visual style (always apply):
- Background: #14141c (dark mode)
- Accent: Periwinkle #8182C1 (never generic blue or purple)
- Font: fontFamily: 1 (Virgil, handwritten) for ALL text
- Boxes: strokeStyle "dotted", roughness 2, roundness {"type":3}, strokeWidth 2
- Arrows: strokeStyle "solid", roughness 1, periwinkle stroke
- Titles: lowercase, free-floating text (no container), color #A3A4D8, fontSize 32-40
- Subtitles: free-floating, color #7a7580, fontSize 16-18
- Labels inside boxes: color #f0edee, fontSize 18-24, centered
- Evidence/sub text under boxes: free-floating, color #7a7580, fontSize 13-15

Color semantics for box strokes:
- Process steps: #8182C1 (periwinkle)
- AI/agent steps: #A3A4D8 (lighter periwinkle)
- Start/end success: #4ade80 (green)
- Decision: #A3A4D8
- Warning: #f87171

Layout principles:
- Pick the right pattern: fan-out (1→many), convergence (many→1), assembly line (linear), tree (hierarchy), cycle (loop)
- Use evidence: under each box, add a 1-2 line free-floating text describing what actually happens (real tool names, real outputs, not abstract labels)
- Whitespace = importance. Hero elements get more space.
- Lowercase everything in labels for natural feel

Critical JSON requirements:
- Top-level: { "type": "excalidraw", "version": 2, "source": "https://excalidraw.com", "elements": [...], "appState": { "viewBackgroundColor": "#14141c", "gridSize": 20 }, "files": {} }
- Every element needs: id, type, x, y, width, height, strokeColor, backgroundColor, fillStyle, strokeWidth, strokeStyle, roughness, opacity, angle, seed, version, versionNonce, isDeleted, groupIds, boundElements, link, locked
- Text elements ALSO need: text, originalText, fontSize, fontFamily, textAlign, verticalAlign, containerId, lineHeight
- Rectangles ALSO need: roundness
- Arrows need: points, startBinding, endBinding, startArrowhead, endArrowhead
- For text inside a rectangle: rectangle's boundElements lists the text id, text's containerId references the rectangle id

Canvas size hint: design within {{CANVAS_WIDTH}}×{{CANVAS_HEIGHT}}px. Place elements with positive coordinates inside this canvas.

Be FAITHFUL to the brief. Don't invent steps the user didn't mention.

Output ONLY by calling the create_excalidraw_diagram tool. No prose.`;

const TOOL = {
  name: "create_excalidraw_diagram",
  description:
    "Emit a complete Excalidraw scene as a JSON string. The string must parse as a valid Excalidraw v2 scene with elements, appState, and files.",
  input_schema: {
    type: "object" as const,
    properties: {
      excalidraw_json: {
        type: "string",
        description:
          "Full Excalidraw scene JSON, stringified. Must be parseable by JSON.parse and follow the v2 schema described in the system prompt.",
      },
      design_notes: {
        type: "string",
        description:
          "One short line describing the visual pattern chosen and why (for debugging).",
      },
    },
    required: ["excalidraw_json"],
  },
};

function canvasFromFormat(format: string | undefined): {
  width: number;
  height: number;
} {
  switch (format) {
    case "4:5":
      return { width: 1080, height: 1350 };
    case "9:16":
      return { width: 1080, height: 1920 };
    case "1:1":
    default:
      return { width: 1080, height: 1080 };
  }
}

export async function POST(req: NextRequest) {
  let body: { brief?: unknown; format?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const brief = typeof body.brief === "string" ? body.brief.trim() : "";
  const format = typeof body.format === "string" ? body.format : "1:1";
  if (!brief) return NextResponse.json({ error: "Missing brief" }, { status: 400 });

  let key: string;
  try {
    key = await getAnthropicKey();
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "API key error" },
      { status: 500 }
    );
  }

  const canvas = canvasFromFormat(format);
  const system = SYSTEM_PROMPT.replace("{{CANVAS_WIDTH}}", String(canvas.width)).replace(
    "{{CANVAS_HEIGHT}}",
    String(canvas.height)
  );

  // Step 1: Claude → Excalidraw JSON
  const apiRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 16384,
      system,
      tools: [TOOL],
      tool_choice: { type: "tool", name: "create_excalidraw_diagram" },
      messages: [{ role: "user", content: brief }],
    }),
  });

  if (!apiRes.ok) {
    const errText = await apiRes.text();
    return NextResponse.json(
      { error: `Anthropic API ${apiRes.status}: ${errText.slice(0, 400)}` },
      { status: 502 }
    );
  }

  const data = await apiRes.json();
  const toolUse = (data.content as { type: string; name?: string; input?: unknown }[])?.find(
    (c) => c.type === "tool_use" && c.name === "create_excalidraw_diagram"
  ) as { input?: { excalidraw_json?: string; design_notes?: string } } | undefined;

  if (!toolUse?.input?.excalidraw_json) {
    console.error("[excalidraw] Claude response:", JSON.stringify(data).slice(0, 1500));
    return NextResponse.json(
      {
        error: "Claude did not return an Excalidraw JSON.",
        stop_reason: data.stop_reason,
        debug: JSON.stringify(data).slice(0, 600),
      },
      { status: 502 }
    );
  }

  // Step 2: validate + write to temp
  let scene: unknown;
  try {
    scene = JSON.parse(toolUse.input.excalidraw_json);
  } catch (e) {
    return NextResponse.json(
      { error: `Invalid Excalidraw JSON from model: ${(e as Error).message}` },
      { status: 502 }
    );
  }
  if (!scene || typeof scene !== "object" || (scene as { type?: string }).type !== "excalidraw") {
    return NextResponse.json(
      { error: "Excalidraw JSON missing required type='excalidraw'." },
      { status: 502 }
    );
  }

  return NextResponse.json({
    scene,
    notes: (toolUse.input.design_notes ?? "").slice(0, 200),
  });
}
