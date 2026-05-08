"use client";

import { useState } from "react";

type Format = "1:1" | "4:5" | "9:16";
type Mode = "post" | "brief";

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
  const [mode, setMode] = useState<Mode>("post");
  const [post, setPost] = useState("");
  const [brief, setBrief] = useState("");
  const [format, setFormat] = useState<Format>("4:5");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<"analyzing" | "generating" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pngUrl, setPngUrl] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState<number | null>(null);

  async function generate() {
    const t0 = Date.now();
    setLoading(true);
    setError(null);
    setPngUrl(null);
    setElapsed(null);

    try {
      let finalBrief = brief.trim();

      if (mode === "post") {
        const postText = post.trim();
        if (!postText) return;

        // Step 1: analyze the post → get a brief
        setLoadingStep("analyzing");
        const analyzeRes = await fetch("/api/image/analyze-post", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ post: postText }),
        });
        if (!analyzeRes.ok) {
          const err = await analyzeRes.json().catch(() => ({ error: `HTTP ${analyzeRes.status}` }));
          throw new Error(err.error || `Analysis failed: ${analyzeRes.status}`);
        }
        const { brief: generatedBrief } = (await analyzeRes.json()) as { brief: string };
        finalBrief = generatedBrief;
      }

      if (!finalBrief) return;

      // Step 2: kick off the diagram job
      setLoadingStep("generating");
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

      // Step 3: poll until done
      const scene = await pollForScene(jobId);

      // Step 4: render client-side
      const url = await renderExcalidrawToPngUrl(scene);
      setPngUrl(url);
      setElapsed(Date.now() - t0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
      setLoadingStep(null);
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

  const canGenerate = mode === "post" ? post.trim().length > 0 : brief.trim().length > 0;

  return (
    <div className="max-w-[960px] mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold mb-2" style={{ color: "var(--vl-text-heading)" }}>
          Image
        </h1>
        <p className="text-sm" style={{ color: "var(--vl-text-muted)" }}>
          Turn a post into a diagram, or write your own brief.
        </p>
      </header>

      {/* Mode tabs */}
      <div
        className="flex gap-1 p-1 rounded-xl mb-5 w-fit"
        style={{ background: "var(--vl-bg-card)", border: "1px solid var(--vl-border)" }}
      >
        {(["post", "brief"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            disabled={loading}
            className="px-4 py-1.5 rounded-lg text-[13px] font-medium transition-colors"
            style={{
              background: mode === m ? "var(--vl-accent)" : "transparent",
              color: mode === m ? "#fff" : "var(--vl-text-muted)",
            }}
          >
            {m === "post" ? "From post" : "From brief"}
          </button>
        ))}
      </div>

      {/* Input area */}
      <div
        className="rounded-2xl border p-5 mb-6"
        style={{ borderColor: "var(--vl-border)", background: "var(--vl-bg-card)" }}
      >
        {mode === "post" ? (
          <>
            <p className="text-[12px] mb-3" style={{ color: "var(--vl-text-muted)" }}>
              Paste your LinkedIn post. Claude will pick the best diagram type and generate it automatically.
            </p>
            <textarea
              value={post}
              onChange={(e) => setPost(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Paste your post here…"
              disabled={loading}
              rows={8}
              className="w-full bg-transparent outline-none resize-none text-[14px] leading-[1.6]"
              style={{ color: "var(--vl-text-heading)" }}
            />
          </>
        ) : (
          <>
            <p className="text-[12px] mb-3" style={{ color: "var(--vl-text-muted)" }}>
              Describe the diagram directly. Specify the pattern (fork / pipeline / hub / cycle), real labels, and what each step outputs.
            </p>
            <textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={`Example: Two-path fork, top to bottom.\n\nLeft path (red): Power user onboarding → friction → Day 10, they're gone\nRight path (green): First win by Day 3 → belief → retention\n\nArrows in periwinkle. All text lowercase.`}
              disabled={loading}
              rows={8}
              className="w-full bg-transparent outline-none resize-none text-[14px] leading-[1.6]"
              style={{ color: "var(--vl-text-heading)" }}
            />
          </>
        )}

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
            disabled={loading || !canGenerate}
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
          style={{ borderColor: "var(--vl-border)", background: "var(--vl-bg-card)", color: "var(--vl-accent)" }}
        >
          ⚠ {error}
        </div>
      )}

      {loading && (
        <div
          className="rounded-xl border p-8 text-center text-[13px]"
          style={{ borderColor: "var(--vl-border)", background: "var(--vl-bg-card)", color: "var(--vl-text-muted)" }}
        >
          <div
            className="inline-block w-2 h-2 rounded-full mr-2 align-middle"
            style={{ background: "var(--vl-accent)", animation: "pulse 1.2s ease-in-out infinite" }}
          />
          {loadingStep === "analyzing"
            ? "Analysing post and picking the best diagram…"
            : "Claude is drawing the scene… (~30–60s)"}
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
