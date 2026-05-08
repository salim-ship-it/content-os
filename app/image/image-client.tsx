"use client";

import { useState } from "react";

type Format = "1:1" | "4:5" | "9:16";

type ExcalidrawScene = {
  type?: string;
  elements: unknown[];
  appState?: Record<string, unknown>;
  files?: Record<string, unknown>;
};

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
    appState: { ...(scene.appState ?? {}), exportBackground: true, exportEmbedScene: false },
    files: scene.files ?? {},
    mimeType: "image/png",
    quality: 1,
    exportPadding: 60,
  });
  return URL.createObjectURL(blob);
}

export function ImageClient() {
  const [post, setPost] = useState("");
  const [brief, setBrief] = useState("");
  const [format, setFormat] = useState<Format>("4:5");
  const [analyzing, setAnalyzing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pngUrl, setPngUrl] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState<number | null>(null);

  async function analyzePost() {
    const postText = post.trim();
    if (!postText) return;
    setAnalyzing(true);
    setError(null);
    setBrief("");
    setPngUrl(null);
    try {
      const res = await fetch("/api/image/analyze-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post: postText }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(err.error || `Analysis failed: ${res.status}`);
      }
      const { brief: generatedBrief } = (await res.json()) as { brief: string };
      setBrief(generatedBrief);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  }

  async function generateDiagram() {
    const finalBrief = brief.trim();
    if (!finalBrief) return;
    const t0 = Date.now();
    setGenerating(true);
    setError(null);
    setPngUrl(null);
    setElapsed(null);
    try {
      const startRes = await fetch("/api/image/excalidraw/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief: finalBrief, format }),
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
      setGenerating(false);
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

  const loading = analyzing || generating;

  return (
    <div className="max-w-[960px] mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold mb-2" style={{ color: "var(--vl-text-heading)" }}>
          Image
        </h1>
        <p className="text-sm" style={{ color: "var(--vl-text-muted)" }}>
          Paste a post, analyze it to get a brief, then generate the diagram.
        </p>
      </header>

      {/* Step 1: Post input */}
      <div
        className="rounded-2xl border p-5 mb-4"
        style={{ borderColor: "var(--vl-border)", background: "var(--vl-bg-card)" }}
      >
        <p className="text-[12px] mb-3 font-medium" style={{ color: "var(--vl-text-muted)" }}>
          Step 1 — paste your LinkedIn post
        </p>
        <textarea
          value={post}
          onChange={(e) => setPost(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              analyzePost();
            }
          }}
          placeholder="Paste your post here…"
          disabled={loading}
          rows={7}
          className="w-full bg-transparent outline-none resize-none text-[14px] leading-[1.6]"
          style={{ color: "var(--vl-text-heading)" }}
        />
        <div className="flex justify-end pt-3 mt-2 border-t" style={{ borderColor: "var(--vl-border)" }}>
          <button
            onClick={analyzePost}
            disabled={loading || !post.trim()}
            className="px-4 py-2 rounded-md text-[13px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "var(--vl-accent)", color: "#fff" }}
          >
            {analyzing ? "Analyzing…" : "Analyze post"}
          </button>
        </div>
      </div>

      {/* Step 2: Brief (editable) + Generate */}
      <div
        className="rounded-2xl border p-5 mb-6"
        style={{
          borderColor: brief ? "var(--vl-accent)" : "var(--vl-border)",
          background: "var(--vl-bg-card)",
          opacity: brief || !post.trim() ? 1 : 0.5,
        }}
      >
        <p className="text-[12px] mb-3 font-medium" style={{ color: "var(--vl-text-muted)" }}>
          Step 2 — review the brief, then generate
        </p>
        <textarea
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              generateDiagram();
            }
          }}
          placeholder="Brief will appear here after you analyze the post. You can also type one manually."
          disabled={generating}
          rows={6}
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
            onClick={generateDiagram}
            disabled={loading || !brief.trim()}
            className="px-4 py-2 rounded-md text-[13px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "var(--vl-accent)", color: "#fff" }}
          >
            {generating ? "Generating…" : "Generate diagram"}
          </button>
        </div>
      </div>

      {error && (
        <div
          className="rounded-xl border p-4 text-[13px] mb-6"
          style={{ borderColor: "var(--vl-border)", background: "var(--vl-bg-card)", color: "var(--vl-accent)" }}
        >
          ⚠ {error}
        </div>
      )}

      {generating && (
        <div
          className="rounded-xl border p-8 text-center text-[13px]"
          style={{ borderColor: "var(--vl-border)", background: "var(--vl-bg-card)", color: "var(--vl-text-muted)" }}
        >
          <div
            className="inline-block w-2 h-2 rounded-full mr-2 align-middle"
            style={{ background: "var(--vl-accent)", animation: "pulse 1.2s ease-in-out infinite" }}
          />
          Claude is drawing the scene… (~30–60s)
        </div>
      )}

      {pngUrl && !generating && (
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
