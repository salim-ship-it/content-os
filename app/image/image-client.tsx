"use client";

import { useState } from "react";

type Format = "1:1" | "4:5" | "9:16";

type ExcalidrawScene = {
  type?: string;
  elements: unknown[];
  appState?: Record<string, unknown>;
  files?: Record<string, unknown>;
};

// Dynamic import keeps the ~2MB Excalidraw bundle out of the SSR / initial
// page weight — only loads the first time a user actually generates a diagram.
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

  async function generate() {
    const text = brief.trim();
    if (!text) return;
    setLoading(true);
    setError(null);
    setPngUrl(null);
    setElapsed(null);
    const t0 = Date.now();
    try {
      const res = await fetch("/api/image/excalidraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief: text, format }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(err.error || `Server returned ${res.status}`);
      }
      const data = (await res.json()) as { scene: ExcalidrawScene };
      const url = await renderExcalidrawToPngUrl(data.scene);
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
          Describe a diagram. Claude designs the structure, your browser renders it as a hand-drawn Excalidraw scene.
        </p>
      </header>

      <div
        className="rounded-2xl border p-5 mb-6"
        style={{ borderColor: "var(--vl-border)", background: "var(--vl-bg-card)" }}
      >
        <textarea
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="e.g. From call to campaign: fireflies pulls the transcript, claude code reads it, signals surface, lemlist fires the sequence."
          disabled={loading}
          rows={3}
          className="w-full bg-transparent outline-none resize-none text-[15px] leading-[1.55]"
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
            style={{
              background: "var(--vl-accent)",
              color: "#fff",
            }}
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
              style={{
                background: "var(--vl-accent)",
                color: "#fff",
              }}
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
