import { inngest } from "@/lib/inngest";
import { getSupabase } from "@/lib/supabase";
import { promises as fs } from "fs";
import path from "path";

// Background job that calls Claude (Sonnet 4.6) to generate an Excalidraw
// scene from a brief, then updates the image_jobs row in Supabase.
//
// Runs on Inngest infra → not bound by Vercel's 60s function timeout.

const SYSTEM_PROMPT = `You generate Excalidraw v2 scene JSON for hand-drawn LinkedIn diagrams.

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
- Use multi-zoom: a summary flow at one level + section boundaries + detail/evidence inside sections
- Whitespace = importance. Hero elements get more space.
- Lowercase everything in labels for natural feel
- Size boxes generously so labels never overflow — width = max(120, label_chars * fontSize * 0.6)

Critical JSON requirements:
- Top-level: { "type": "excalidraw", "version": 2, "source": "https://excalidraw.com", "elements": [...], "appState": { "viewBackgroundColor": "#14141c", "gridSize": 20 }, "files": {} }
- Every element needs: id, type, x, y, width, height, strokeColor, backgroundColor, fillStyle, strokeWidth, strokeStyle, roughness, opacity, angle, seed, version, versionNonce, isDeleted, groupIds, boundElements, link, locked
- Text elements ALSO need: text, originalText, fontSize, fontFamily, textAlign, verticalAlign, containerId, lineHeight
- Rectangles ALSO need: roundness
- Arrows need: points, startBinding, endBinding, startArrowhead, endArrowhead
- For text inside a rectangle: rectangle's boundElements lists the text id, text's containerId references the rectangle id

Canvas: design within {{CANVAS_WIDTH}}×{{CANVAS_HEIGHT}}px. Place elements with positive coordinates inside this canvas.

Be FAITHFUL to the brief. Don't invent steps. Use real tool names from the brief verbatim.

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
          "One short line describing the visual pattern chosen and why.",
      },
    },
    required: ["excalidraw_json"],
  },
};

const REPO_ROOT = process.cwd();

async function getAnthropicKey(): Promise<string> {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
  try {
    const env = await fs.readFile(path.join(REPO_ROOT, ".env.local"), "utf-8");
    for (const line of env.split("\n")) {
      if (line.startsWith("ANTHROPIC_API_KEY=")) {
        return line.split("=", 2)[1].trim().replace(/^['"]|['"]$/g, "");
      }
    }
  } catch {}
  throw new Error("ANTHROPIC_API_KEY not found");
}

function canvasFromFormat(format: string): { width: number; height: number } {
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

async function markJobError(jobId: string, message: string) {
  const supabase = await getSupabase();
  await supabase
    .from("image_jobs")
    .update({
      status: "error",
      error: message.slice(0, 500),
      updated_at: new Date().toISOString(),
    })
    .eq("id", jobId);
}

export const generateExcalidraw = inngest.createFunction(
  {
    id: "generate-excalidraw",
    retries: 1,
    triggers: [{ event: "image/excalidraw.requested" }],
    // On terminal failure (after retries), mark the job errored so the client
    // polling sees the failure instead of waiting forever.
    onFailure: async ({ event, error }) => {
      const original = (event as unknown as {
        data: { event: { data: { jobId: string } } };
      }).data?.event?.data;
      if (original?.jobId) {
        await markJobError(original.jobId, error?.message ?? "Unknown error");
      }
    },
  },
  async ({ event, step }) => {
    const { jobId, brief, format } = event.data;

    // Step 1: Claude → Excalidraw JSON
    const scene = await step.run("call-claude", async () => {
      const key = await getAnthropicKey();
      const canvas = canvasFromFormat(format);
      const system = SYSTEM_PROMPT.replace(
        "{{CANVAS_WIDTH}}",
        String(canvas.width)
      ).replace("{{CANVAS_HEIGHT}}", String(canvas.height));

      const apiRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 16384,
          system,
          tools: [TOOL],
          tool_choice: { type: "tool", name: "create_excalidraw_diagram" },
          messages: [{ role: "user", content: brief }],
        }),
      });

      if (!apiRes.ok) {
        const text = await apiRes.text();
        throw new Error(`Anthropic ${apiRes.status}: ${text.slice(0, 400)}`);
      }
      const data = await apiRes.json();
      const toolUse = (
        data.content as { type: string; name?: string; input?: unknown }[]
      )?.find(
        (c) => c.type === "tool_use" && c.name === "create_excalidraw_diagram"
      ) as { input?: { excalidraw_json?: string } } | undefined;

      if (!toolUse?.input?.excalidraw_json) {
        throw new Error("Claude did not return an Excalidraw JSON tool call.");
      }
      const parsed = JSON.parse(toolUse.input.excalidraw_json);
      if (
        !parsed ||
        typeof parsed !== "object" ||
        parsed.type !== "excalidraw"
      ) {
        throw new Error("Excalidraw JSON missing required type='excalidraw'.");
      }
      return parsed;
    });

    // Step 2: persist result to Supabase
    await step.run("save-result", async () => {
      const supabase = await getSupabase();
      const { error } = await supabase
        .from("image_jobs")
        .update({
          status: "complete",
          scene,
          updated_at: new Date().toISOString(),
        })
        .eq("id", jobId);
      if (error) throw new Error(`Supabase update failed: ${error.message}`);
    });

    return { ok: true, jobId };
  }
);

// Sweep content_posts every 5 minutes for any image_url still pointing to
// LinkedIn's signed CDN (which expires in ~3 weeks). Download the bytes,
// upload to Supabase Storage, and rewrite image_url to a permanent URL.
// Already-expired LinkedIn URLs are cleared so the UI stops trying to load them.
import { archivePendingPosts } from "@/lib/post-image-archive";

export const archivePostImages = inngest.createFunction(
  {
    id: "archive-post-images",
    retries: 0,
  },
  { cron: "*/5 * * * *" },
  async ({ step }) => {
    const result = await step.run("archive-batch", async () => {
      return archivePendingPosts({ batchSize: 50 });
    });
    return result;
  }
);
