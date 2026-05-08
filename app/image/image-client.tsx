"use client";

import { useState } from "react";

type Format = "1:1" | "4:5" | "9:16";

type ExcalidrawScene = {
  type?: string;
  elements: unknown[];
  appState?: Record<string, unknown>;
  files?: Record<string, unknown>;
};

const EXAMPLES = [
  {
    label: "GTM pipeline",
    brief:
      "Linear pipeline, left to right.\n\n1. Apify scrapes target companies → returns name, website, industry, headcount\n2. Fullenrich waterfall finds verified email → tries 4 providers in sequence\n3. Clay scores each lead against ICP criteria → outputs a score 1–10\n4. Claude Code writes a personalised cold email sequence → icebreaker + pain line + CTA per company\n5. Lemlist sends the campaign → tracks opens, replies, bounces\n\nShow the output of each step as a small label below the box.",
  },
  {
    label: "Content OS flow",
    brief:
      "Hub-and-spoke, centre outward.\n\nCentre: Claude Code (the brain)\n\nSpokes feeding IN:\n- Fireflies → meeting transcript\n- LinkedIn scraper → top posts\n- Reddit → trending threads\n\nSpokes going OUT:\n- Draft post → Content OS chat\n- Lead magnet → Notion\n- Idea queue → Slack\n\nEach spoke is an arrow with a 1-line label describing what moves along it.",
  },
  {
    label: "Outbound signal loop",
    brief:
      "Cycle / loop diagram, clockwise.\n\n1. Signal detected → hiring post on LinkedIn for SDR role\n2. Apify pulls the company → enriches with Fullenrich\n3. Clay scores intent → high score triggers sequence\n4. Lemlist sends 3-step sequence → day 1 / day 3 / day 7\n5. Reply received → routed to CRM (Breakcold)\n6. No reply → flagged for manual review → back to step 1\n\nArrows in periwinkle. Decision node at step 5 (reply vs no reply).",
  },
];

async function pollForScene(jobId: string): Promise<ExcalidrawScene> {
  const POLL_MS = 2500;
  const MAX_WAIT_MS = 5 * 60 * 1000;
  const started = Date.now();

  while (Date.now() - started < MAX_WAIT_MS) {
    await new Promise((r) => setTimeout(r, POLL_MS));
    const res = await fetch(`/api/image/excalidraw/status/${jobId}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      throw new Error(err.error || `Status check failed: ${res.status}`);
    }
    const data = (await res.json()) as {
      status: "pending" | "complete" | "error";
      scene: ExcalidrawScene | null;
      error: string | null;
    };
    if (data.status === "error") throw new Error(data.error ?? "Generation failed");
    if (data.status === "complete" && data.scene) return data.scene;
  }
  throw new Error("Timed out after 5 minutes — try again with a simpler brief.");
}

async function renderExcalidrawToPngUrl(scene: ExcalidrawScene): Promise<string> {
  const mod = await import("@excalidraw/excalidraw");
  const exportToBlob = (mod as unknown as { exportToBlob: (opts: unknown) => Promise<Blob> })
    .exportToBlob;
  const blob = await exportToBlob({
    elements: scene.elements,
    appState: {
      ...(scene.appState ?? {}),
      exportBackground: true,
      exportEmbedScene: false,
    },
    files: scene.files ?? {},
    mimeType: "image/png",
    quality: 1,
    exportPadding: 60,
  });
  return URL.createObjectURL(blob);
}

export function ImageClient() {
  const [brief, setBrief] = useState("");
  const [format, setFormat] = useState<Format>("1:1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pngUrl, setPngUrl] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState<number | null>(null);
  const [tipsOpen, setTipsOpen] = useState(false);

  async function generate() {
    const text = brief.trim();
    if (!text) return;
    setLoading(true);
    setError(null);
    setPngUrl(null);
    setElapsed(null);
    const t0 = Date.now();
    try {
      const startRes = await fetch("/api/image/excalidraw/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief: text, format }),
      });
      if (!startRes.ok) {
        const err = await startRes.json().catch(() => ({ error: `HTTP ${startRes.status}` }));
        throw new Error(err.error || `Server returned ${startRes.status}`);
      }
      const { jobId } = (await startRes.json()) as { jobId: string };
      const scene = await pollForScene(jobId);
      const url = await renderExcalidrawToPngUrl(scene);
      setPngUrl(url);
      setElapsed(Date.now() - t0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  function download() {
    if (!pngUrl) return;
    const a = document.createElement("a");
    a.href = pngUrl;
    a.download = `diagram-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      generate();
    }
  }

  return (
    <div className="max-w-[960px] mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold mb-2" style={{ color: "var(--vl-text-heading)" }}>
          Image
        </h1>
        <p className="text-sm" style={{ color: "var(--vl-text-muted)" }}>
          Describe a diagram. Claude designs the structure, your browser renders it as a hand-drawn scene.
        </p>
      </header>

      {/* Tips panel */}
      <div
        className="rounded-xl border mb-4 overflow-hidden"
        style={{ borderColor: "var(--vl-border)", background: "var(--vl-bg-card)" }}
      >
        <button
          onClick={() => setTipsOpen((o) => !o)}
          className="w-full flex items-center justify-between px-4 py-3 text-left"
        >
          <span className="text-[13px] font-semibold" style={{ color: "var(--vl-text-heading)" }}>
            How to write a good brief
          </span>
          <span className="text-[11px] font-mono" style={{ color: "var(--vl-text-muted)" }}>
            {tipsOpen ? "▲ hide" : "▼ show"}
          </span>
        </button>

        {tipsOpen && (
          <div
            className="px-4 pb-4 text-[13px] leading-relaxed border-t"
            style={{ borderColor: "var(--vl-border)", color: "var(--vl-text-muted)" }}
          >
            <p className="mb-3 mt-3" style={{ color: "var(--vl-text-heading)" }}>
              The more specific you are, the better the diagram. Three things make a brief great:
            </p>
            <div className="space-y-3">
              <div>
                <span className="font-semibold" style={{ color: "var(--vl-text-heading)" }}>
                  1. The flow shape
                </span>
                <p className="mt-0.5">
                  Tell Claude what pattern to use: <em>linear pipeline</em> (steps left to right),{" "}
                  <em>hub-and-spoke</em> (centre with spokes in/out), <em>cycle</em> (loop with a decision),
                  or <em>tree</em> (hierarchy / breakdown).
                </p>
              </div>
              <div>
                <span className="font-semibold" style={{ color: "var(--vl-text-heading)" }}>
                  2. Real tool names at each step
                </span>
                <p className="mt-0.5">
                  Don&apos;t write &ldquo;enrichment tool&rdquo; — write &ldquo;Fullenrich waterfall&rdquo;. Don&apos;t write
                  &ldquo;send emails&rdquo; — write &ldquo;Lemlist sends 3-step sequence&rdquo;. Real names = real labels on the diagram.
                </p>
              </div>
              <div>
                <span className="font-semibold" style={{ color: "var(--vl-text-heading)" }}>
                  3. What each step outputs
                </span>
                <p className="mt-0.5">
                  Add a short output after each step using →. Example: &ldquo;Clay scores each lead → outputs a score
                  1–10&rdquo;. This becomes the evidence text under each box.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Example briefs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {EXAMPLES.map((ex) => (
          <button
            key={ex.label}
            onClick={() => setBrief(ex.brief)}
            disabled={loading}
            className="px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors disabled:opacity-50"
            style={{
              border: "1px solid var(--vl-border)",
              background: brief === ex.brief ? "var(--vl-accent)" : "var(--vl-bg-card)",
              color: brief === ex.brief ? "#fff" : "var(--vl-text-muted)",
            }}
          >
            {ex.label}
          </button>
        ))}
        <span className="text-[11px] self-center pl-1" style={{ color: "var(--vl-text-muted)" }}>
          click to pre-fill an example
        </span>
      </div>

      {/* Main input */}
      <div
        className="rounded-2xl border p-5 mb-6"
        style={{ borderColor: "var(--vl-border)", background: "var(--vl-bg-card)" }}
      >
        <textarea
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={`Describe your diagram. Include:\n- Flow shape: linear pipeline / hub-and-spoke / cycle / tree\n- Each step with real tool names (Apify, Clay, Lemlist…)\n- What each step outputs → use arrows to show it\n\nExample: "Linear pipeline. 1. Apify scrapes companies → returns name, website, headcount. 2. Fullenrich finds email → verified contact. 3. Claude Code writes sequence → personalised per company. 4. Lemlist launches campaign."`}
          disabled={loading}
          rows={7}
          className="w-full bg-transparent outline-none resize-none text-[14px] leading-[1.6]"
          style={{ color: "var(--vl-text-heading)" }}
        />

        <div
          className="flex items-center gap-2 pt-3 mt-2 border-t"
          style={{ borderColor: "var(--vl-border)" }}
        >
          {(["1:1", "4:5", "9:16"] as Format[]).map((f) => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              disabled={loading}
              className="px-2.5 py-1 rounded-md text-[12px] font-mono transition-colors"
              style={{
                border: `1px solid ${format === f ? "var(--vl-text-heading)" : "var(--vl-border)"}`,
                background: format === f ? "var(--vl-text-heading)" : "transparent",
                color: format === f ? "var(--vl-bg)" : "var(--vl-text-muted)",
              }}
            >
              {f}
            </button>
          ))}
          <span className="flex-1" />
          <span className="text-[11px] font-mono" style={{ color: "var(--vl-text-muted)" }}>
            ⌘↵ to generate
          </span>
          <button
            onClick={generate}
            disabled={loading || !brief.trim()}
            className="px-4 py-2 rounded-md text-[13px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "var(--vl-accent)", color: "#fff" }}
          >
            {loading ? "Generating…" : "Generate diagram"}
          </button>
        </div>
      </div>

      {error && (
        <div
          className="rounded-xl border p-4 text-[13px] mb-6"
          style={{
            borderColor: "var(--vl-border)",
            background: "var(--vl-bg-card)",
            color: "var(--vl-accent)",
          }}
        >
          ⚠ {error}
        </div>
      )}

      {loading && (
        <div
          className="rounded-xl border p-8 text-center text-[13px]"
          style={{
            borderColor: "var(--vl-border)",
            background: "var(--vl-bg-card)",
            color: "var(--vl-text-muted)",
          }}
        >
          <div
            className="inline-block w-2 h-2 rounded-full mr-2 align-middle"
            style={{ background: "var(--vl-accent)", animation: "pulse 1.2s ease-in-out infinite" }}
          />
          Claude is designing the scene… (~30–60s)
        </div>
      )}

      {pngUrl && !loading && (
        <div>
          <div
            className="rounded-xl overflow-hidden border"
            style={{ borderColor: "var(--vl-border)", background: "#14141c" }}
          >
            <img src={pngUrl} alt="Generated diagram" className="w-full h-auto block" />
          </div>
          <div className="flex items-center gap-3 mt-3">
            <button
              onClick={download}
              className="px-3 py-1.5 rounded-md text-[12px] font-semibold"
              style={{ background: "var(--vl-accent)", color: "#fff" }}
            >
              Download PNG
            </button>
            {elapsed !== null && (
              <span className="text-[11px] font-mono" style={{ color: "var(--vl-text-muted)" }}>
                rendered in {(elapsed / 1000).toFixed(1)}s
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
