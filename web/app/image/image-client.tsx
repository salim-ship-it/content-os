"use client";

import { useState, useRef, useEffect } from "react";

// ─── Types ─────────────────────────────────────────────────────────────

type Format = "1:1" | "4:5" | "9:16";
type Mode = "image" | "diagram";

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
  // exportToBlob lives on the package root export
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

// Configs returned by /api/image/generate after Claude reads the prompt.
type OrbitConfig = {
  topTitle: string;
  topLabels: [string, string, string, string];
  topAccent: string;
  bottomTitle: string;
  bottomLabels: [string, string, string, string];
  bottomAccent: string;
};

type FlowConfig = {
  title: string;
  accent: string;
  steps: { label: string; sub?: string; icon?: string }[];
};

type RenderFormat = "orbit" | "flow";

type Asset = { id: string; label: string };

type Turn =
  | {
      id: string;
      role: "user";
      text: string;
      format: Format;
      ts: string;
    }
  | {
      id: string;
      role: "assistant";
      status: "loading" | "done" | "error";
      intro: string;
      assets: Asset[];
      format: Format;
      renderFormat?: RenderFormat;
      orbitConfig?: OrbitConfig;
      flowConfig?: FlowConfig;
      nanoUrl?: string;
      error?: string;
    };

// Yonathan's scraped GIFs — shown in the right rail as a static gallery,
// purely for visual reference. Not interactive.
const GALLERY: { file: string; alt: string }[] = [
  { file: "03-claude-code-and-codex-are-not-the-same-thing.gif", alt: "Claude vs Codex" },
  { file: "01-clone-yourself-to-qualify-prospects-on-your.gif", alt: "Clone yourself" },
  { file: "06-stop-waiting-for-inbound-outbound-your.gif", alt: "Stop waiting outbound" },
  { file: "10-face-to-face-ai-closes-3x-more-than-voice.gif", alt: "Face-to-face AI" },
  { file: "05-claude-is-making-every-other-ai-tool-irrelevant.gif", alt: "Claude vs others" },
  { file: "02-curate-the-best-viral-content-from-x-and.gif", alt: "Viral curation" },
  { file: "04-tiktok-is-not-just-for-gen-z-this-workflow.gif", alt: "TikTok workflow" },
  { file: "07-turn-any-personal-email-into-a-full-lead.gif", alt: "Email → lead profile" },
  { file: "08-stop-guessing-what-your-competitors-spend.gif", alt: "Competitor ad spend" },
  { file: "09-find-qualified-leads-wherever-you-already.gif", alt: "Find leads everywhere" },
];

const ASSET_NAMES = ["Editorial", "Bold serif", "Minimal", "On-brand"];

// ─── Root ──────────────────────────────────────────────────────────────

export function ImageClient() {
  const [draft, setDraft] = useState("");
  const [format, setFormat] = useState<Format>("1:1");
  const [mode, setMode] = useState<Mode>("image");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const credits = 247;

  const threadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
  }, [turns.length]);

  async function generate() {
    const text = draft.trim();
    if (!text) return;

    const now = Date.now();
    const ts = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }).toLowerCase();

    const userTurn: Turn = {
      id: `u-${now}`,
      role: "user",
      text,
      format,
      ts,
    };
    const loadingId = `a-${now + 1}`;
    const loading: Turn = {
      id: loadingId,
      role: "assistant",
      status: "loading",
      intro: "Reading your brief…",
      assets: ASSET_NAMES.map((label, i) => ({ id: `${now + 1}-${i}`, label })),
      format,
    };

    setTurns((prev) => [...prev, userTurn, loading]);
    setDraft("");

    const startedAt = Date.now();
    try {
      let url: string;
      if (mode === "diagram") {
        const res = await fetch("/api/image/excalidraw", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ brief: text, format }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Unknown error" }));
          throw new Error(err.error || `Server returned ${res.status}`);
        }
        const data = (await res.json()) as { scene: ExcalidrawScene };
        url = await renderExcalidrawToPngUrl(data.scene);
      } else {
        const res = await fetch("/api/image/nano", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: text, format }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Unknown error" }));
          throw new Error(err.error || `Server returned ${res.status}`);
        }
        const blob = await res.blob();
        url = URL.createObjectURL(blob);
      }
      const elapsedMs = Date.now() - startedAt;
      setTurns((prev) =>
        prev.map((t) =>
          t.id === loadingId && t.role === "assistant"
            ? {
                ...t,
                status: "done",
                nanoUrl: url,
                intro: `Generated · ${(elapsedMs / 1000).toFixed(1)}s`,
              }
            : t
        )
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Generation failed";
      setTurns((prev) =>
        prev.map((t) =>
          t.id === loadingId && t.role === "assistant"
            ? { ...t, status: "error", intro: "Generation failed", error: msg }
            : t
        )
      );
    }
  }

  function toggleSelect(assetId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(assetId)) next.delete(assetId);
      else next.add(assetId);
      return next;
    });
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Conversation + composer */}
      <div className="flex-1 flex flex-col min-w-0" style={{ background: "var(--co-paper)" }}>
        <Thread
          threadRef={threadRef}
          turns={turns}
          selected={selected}
          toggleSelect={toggleSelect}
        />
        <Composer
          draft={draft}
          setDraft={setDraft}
          format={format}
          setFormat={setFormat}
          mode={mode}
          setMode={setMode}
          credits={credits}
          onGenerate={generate}
        />
      </div>

      {/* Right rail */}
      <RightRail credits={credits} />
    </div>
  );
}

// ─── Thread ────────────────────────────────────────────────────────────

function Thread({
  threadRef,
  turns,
  selected,
  toggleSelect,
}: {
  threadRef: React.RefObject<HTMLDivElement | null>;
  turns: Turn[];
  selected: Set<string>;
  toggleSelect: (id: string) => void;
}) {
  return (
    <div ref={threadRef} className="flex-1 overflow-y-auto">
      <div className="max-w-[860px] mx-auto px-8 py-10 flex flex-col gap-8">
        <header>
          <h1
            className="font-display text-[32px] font-semibold tracking-tight"
            style={{ color: "var(--co-ink)" }}
          >
            New session
          </h1>
          <div className="text-[12.5px] mt-1" style={{ color: "var(--co-ink-mute)" }}>
            auto-saved · started just now
          </div>
        </header>

        {turns.length === 0 && <EmptyStarter />}

        {turns.map((t) =>
          t.role === "user" ? (
            <UserBubble key={t.id} turn={t} />
          ) : (
            <ResultBlock
              key={t.id}
              turn={t}
              selected={selected}
              toggleSelect={toggleSelect}
            />
          )
        )}
      </div>
    </div>
  );
}

function EmptyStarter() {
  return (
    <div className="animate-rise">
      <div
        className="rounded-2xl border p-6"
        style={{ borderColor: "var(--co-rule)", background: "var(--co-card)" }}
      >
        <div className="flex items-center gap-2 mb-2">
          <SparkleIcon />
          <span
            className="text-[12px] uppercase tracking-wider font-semibold"
            style={{ color: "var(--co-ink-mute)" }}
          >
            Content OS
          </span>
        </div>
        <p
          className="font-display text-[20px] leading-relaxed"
          style={{ color: "var(--co-ink)" }}
        >
          Pick a template on the right, or describe what you want.
        </p>
        <p className="text-[13.5px] mt-2" style={{ color: "var(--co-ink-soft)" }}>
          I'll generate 4 variations and you pick the one to ship.
        </p>
      </div>
    </div>
  );
}

// ─── User bubble ───────────────────────────────────────────────────────

function UserBubble({ turn }: { turn: Extract<Turn, { role: "user" }> }) {
  return (
    <div className="self-end max-w-[78%] animate-rise">
      <div
        className="rounded-2xl px-4 py-3 border"
        style={{ borderColor: "var(--co-rule-strong)", background: "var(--co-paper-soft)" }}
      >
        <div className="flex items-baseline gap-2 mb-1.5">
          <span className="text-[11px] font-semibold" style={{ color: "var(--co-ink-mute)" }}>
            you
          </span>
          <span className="text-[10px] tabular-nums" style={{ color: "var(--co-ink-mute)" }}>
            · {turn.ts}
          </span>
        </div>
        <div className="text-[14px] leading-[1.55]" style={{ color: "var(--co-ink)" }}>
          {turn.text}
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono"
            style={{
              border: "1px solid var(--co-rule-strong)",
              color: "var(--co-ink-soft)",
            }}
          >
            {turn.format}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Result block ──────────────────────────────────────────────────────

function ResultBlock({
  turn,
  selected,
  toggleSelect,
}: {
  turn: Extract<Turn, { role: "assistant" }>;
  selected: Set<string>;
  toggleSelect: (id: string) => void;
}) {
  const loading = turn.status === "loading";
  return (
    <div className="self-start w-full max-w-full animate-rise">
      <div className="flex items-baseline gap-2 mb-3 pl-1">
        <SparkleIcon />
        <span className="text-[12.5px] font-semibold" style={{ color: "var(--co-ink-soft)" }}>
          Content OS
        </span>
        <span className="text-[12.5px]" style={{ color: "var(--co-ink-mute)" }}>
          {turn.intro}
        </span>
        {loading && (
          <span
            className="text-[10px] font-mono ml-1 inline-flex items-center gap-1"
            style={{ color: "var(--co-accent-ink)" }}
          >
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{ background: "var(--co-accent)", animation: "co-pulse-dot 1.2s ease-in-out infinite" }}
            />
            working
          </span>
        )}
      </div>

      {turn.status === "error" ? (
        <div
          className="rounded-xl border p-4 text-[13px]"
          style={{
            borderColor: "var(--co-rule-strong)",
            background: "var(--co-paper-soft)",
            color: "var(--co-ink-soft)",
          }}
        >
          ⚠ {turn.error ?? "Something went wrong."}
        </div>
      ) : (
        <NanoTile turn={turn} loading={loading} />
      )}

      {!loading && (
        <div className="flex items-center gap-2 mt-3 pl-1">
          <ChipButton>↻ regenerate all</ChipButton>
          <ChipButton>✎ refine with prompt</ChipButton>
          <span className="flex-1" />
          <span className="text-[11.5px]" style={{ color: "var(--co-ink-mute)" }}>
            variations · 4 credits
          </span>
        </div>
      )}
    </div>
  );
}

function NanoTile({
  turn,
  loading,
}: {
  turn: Extract<Turn, { role: "assistant" }>;
  loading: boolean;
}) {
  const aspect =
    turn.format === "1:1"
      ? "aspect-square"
      : turn.format === "4:5"
        ? "aspect-[4/5]"
        : "aspect-[9/16]";

  function handleDownload() {
    if (!turn.nanoUrl) return;
    const a = document.createElement("a");
    a.href = turn.nanoUrl;
    a.download = `nano-${turn.id}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function handleOpen() {
    if (turn.nanoUrl) window.open(turn.nanoUrl, "_blank");
  }

  return (
    <div className="max-w-[520px]">
      <div
        className={`relative rounded-xl overflow-hidden border ${aspect}`}
        style={{
          borderColor: "var(--co-rule-strong)",
          background: "var(--co-card)",
          opacity: loading ? 0.5 : 1,
          transition: "opacity .3s",
        }}
      >
        {turn.nanoUrl ? (
          <img
            src={turn.nanoUrl}
            alt="Generated image"
            className="w-full h-full object-cover block"
            draggable={false}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: "var(--co-paper-soft)" }}
          >
            <span
              className="text-[11px] font-mono inline-flex items-center gap-1.5"
              style={{ color: "var(--co-ink-mute)" }}
            >
              <span
                className="inline-block w-1.5 h-1.5 rounded-full"
                style={{
                  background: "var(--co-accent)",
                  animation: "co-pulse-dot 1.2s ease-in-out infinite",
                }}
              />
              rendering your visual…
            </span>
          </div>
        )}
      </div>
      {turn.nanoUrl && (
        <div className="flex flex-wrap gap-1 mt-2">
          <AssetAction icon="⤢" label="open" onClick={handleOpen} />
          <AssetAction icon="↓" label="png" onClick={handleDownload} />
        </div>
      )}
    </div>
  );
}

function AssetTile({
  asset,
  index,
  format,
  loading,
  isSelected,
  onToggle,
  renderFormat,
  orbitConfig,
  flowConfig,
}: {
  asset: Asset;
  index: number;
  format: Format;
  loading: boolean;
  isSelected: boolean;
  onToggle: () => void;
  renderFormat?: RenderFormat;
  orbitConfig?: OrbitConfig;
  flowConfig?: FlowConfig;
}) {
  const [hover, setHover] = useState(false);
  const showActions = !loading && (hover || isSelected);
  const aspect = format === "1:1" ? "aspect-square" : format === "4:5" ? "aspect-[4/5]" : "aspect-[9/16]";

  const styles: OrbitStyle[] = ["editorial", "bold", "minimal", "brand"];
  const tileStyle = styles[index % 4];

  const dimensions =
    format === "1:1" ? { width: 1080, height: 1080 } : format === "4:5" ? { width: 1080, height: 1350 } : { width: 1080, height: 1920 };

  // Per-tile refinement: when set, this overrides the turn-level config so
  // only THIS tile changes when the user types a tweak.
  const [refinedFlow, setRefinedFlow] = useState<FlowConfig | undefined>(undefined);
  const [refinedOrbit, setRefinedOrbit] = useState<OrbitConfig | undefined>(undefined);
  const [refining, setRefining] = useState(false);
  const [tweak, setTweak] = useState("");
  const [refineLoading, setRefineLoading] = useState(false);
  const [refineError, setRefineError] = useState<string | null>(null);
  const [revisionCount, setRevisionCount] = useState(0);

  const effectiveFlow = refinedFlow ?? flowConfig;
  const effectiveOrbit = refinedOrbit ?? orbitConfig;

  // Build per-format API body
  const endpoint =
    renderFormat === "flow" ? "/api/image/flow/png" : "/api/image/orbit/png";

  const apiBody =
    renderFormat === "flow" && effectiveFlow
      ? {
          width: dimensions.width,
          height: dimensions.height,
          bg: "#faf7f1",
          style: tileStyle,
          title: effectiveFlow.title,
          accent: effectiveFlow.accent,
          steps: effectiveFlow.steps,
        }
      : renderFormat === "orbit" && effectiveOrbit
        ? {
            width: dimensions.width,
            height: dimensions.height,
            bg: "#0f0e0c",
            style: tileStyle,
            top: { title: effectiveOrbit.topTitle, labels: effectiveOrbit.topLabels, accent: effectiveOrbit.topAccent, sweep: 0.18 },
            bottom: { title: effectiveOrbit.bottomTitle, labels: effectiveOrbit.bottomLabels, accent: effectiveOrbit.bottomAccent, sweep: 0.55 },
          }
        : null;

  const downloadName =
    renderFormat === "flow" && effectiveFlow
      ? `flow-${effectiveFlow.title}-${tileStyle}.png`
      : renderFormat === "orbit" && effectiveOrbit
        ? `orbit-${effectiveOrbit.topTitle}-vs-${effectiveOrbit.bottomTitle}-${tileStyle}.png`
        : `output-${tileStyle}.png`;

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!apiBody) return;
    let cancelled = false;
    let objectUrl: string | null = null;
    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(apiBody),
    })
      .then((r) => r.blob())
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setPreviewUrl(objectUrl);
      })
      .catch((err) => console.error("Preview fetch failed:", err));
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(apiBody), endpoint]);

  async function handleDownload() {
    if (!apiBody) return;
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiBody),
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = downloadName.toLowerCase().replace(/[^a-z0-9-.]+/g, "-");
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
      alert("Download failed. Check console.");
    }
  }

  function handleOpen() {
    if (previewUrl) window.open(previewUrl, "_blank");
  }

  const [gifLoading, setGifLoading] = useState(false);
  const [gifError, setGifError] = useState<string | null>(null);

  async function handleDownloadGif() {
    if (!apiBody || renderFormat !== "flow") return;
    setGifLoading(true);
    setGifError(null);
    try {
      const res = await fetch("/api/image/flow/gif", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiBody),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `Server returned ${res.status}` }));
        throw new Error(err.error || `Server returned ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = downloadName.replace(/\.png$/i, ".gif").toLowerCase().replace(/[^a-z0-9-.]+/g, "-");
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "GIF render failed";
      setGifError(msg);
      console.error("GIF download failed:", err);
    } finally {
      setGifLoading(false);
    }
  }

  async function handleRefine() {
    const t = tweak.trim();
    if (!t || !renderFormat) return;
    const currentConfig =
      renderFormat === "flow" ? effectiveFlow : effectiveOrbit;
    if (!currentConfig) return;
    setRefineLoading(true);
    setRefineError(null);
    try {
      const res = await fetch("/api/image/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format: renderFormat,
          config: currentConfig,
          tweak: t,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown" }));
        throw new Error(err.error || `Server returned ${res.status}`);
      }
      const data = (await res.json()) as
        | { format: "flow"; config: FlowConfig }
        | { format: "orbit"; config: OrbitConfig };
      if (data.format === "flow") setRefinedFlow(data.config);
      else setRefinedOrbit(data.config);
      setRevisionCount((n) => n + 1);
      setTweak("");
      setRefining(false);
    } catch (e) {
      setRefineError(e instanceof Error ? e.message : "Refine failed");
    } finally {
      setRefineLoading(false);
    }
  }

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="relative idea-card"
    >
      <div
        className={`relative rounded-xl overflow-hidden border ${aspect}`}
        style={{
          borderColor: isSelected ? "var(--co-accent)" : "var(--co-rule-strong)",
          background: "var(--co-card)",
          opacity: loading ? 0.5 : 1,
          boxShadow: isSelected ? "0 0 0 3px var(--co-accent-soft)" : undefined,
          transition: "border-color .2s, box-shadow .2s, opacity .3s",
        }}
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={`${tileStyle} variation`}
            className="w-full h-full object-cover block"
            draggable={false}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: "var(--co-paper-soft)" }}
          >
            <span className="text-[10px] font-mono" style={{ color: "var(--co-ink-mute)" }}>
              rendering…
            </span>
          </div>
        )}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[11px] font-mono" style={{ color: "var(--co-ink-mute)" }}>
              generating…
            </span>
          </div>
        )}
        {isSelected && (
          <div
            className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-semibold"
            style={{ background: "var(--co-accent)", color: "var(--co-paper)" }}
          >
            ✓ selected
          </div>
        )}
        {revisionCount > 0 && (
          <div
            className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-semibold"
            style={{
              background: "var(--co-paper)",
              color: "var(--co-ink)",
              border: "1px solid var(--co-rule-strong)",
            }}
          >
            ✎ v{revisionCount + 1}
          </div>
        )}
      </div>

      <div className="text-[12.5px] mt-2 px-0.5" style={{ color: "var(--co-ink-soft)" }}>
        <span className="font-semibold" style={{ color: "var(--co-ink)" }}>
          {String.fromCharCode(65 + index)}
        </span>{" "}
        · {asset.label}
      </div>

      <div
        className="flex flex-wrap gap-1 mt-1.5 transition-opacity"
        style={{ opacity: showActions ? 1 : 0, pointerEvents: showActions ? "auto" : "none" }}
      >
        <AssetAction icon="★" label="save" onClick={onToggle} active={isSelected} />
        <AssetAction icon="⤢" label="open" onClick={handleOpen} />
        <AssetAction icon="↓" label="png" onClick={handleDownload} />
        {renderFormat === "flow" && (
          <AssetAction
            icon={gifLoading ? "⏳" : "▶"}
            label={gifLoading ? "rendering…" : "gif"}
            onClick={handleDownloadGif}
            active={gifLoading}
          />
        )}
        <AssetAction icon="↻" label="regen" />
        <AssetAction
          icon="✨"
          label="refine"
          onClick={() => setRefining((r) => !r)}
          active={refining}
        />
      </div>
      {gifError && (
        <div
          className="mt-1 text-[11px] px-1"
          style={{ color: "#c33" }}
        >
          GIF: {gifError}
        </div>
      )}

      {refining && (
        <div
          className="mt-2 rounded-lg border p-2"
          style={{
            borderColor: "var(--co-rule-strong)",
            background: "var(--co-card)",
          }}
        >
          <textarea
            value={tweak}
            onChange={(e) => setTweak(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                handleRefine();
              }
              if (e.key === "Escape") setRefining(false);
            }}
            placeholder="Tweak this tile only — e.g. 'shorter step labels', 'swap step 3 to Apollo', 'darker accent'"
            disabled={refineLoading}
            className="w-full bg-transparent outline-none resize-none text-[12.5px] leading-[1.4]"
            style={{ color: "var(--co-ink)", minHeight: 44 }}
            rows={2}
            autoFocus
          />
          <div className="flex items-center gap-1.5 mt-1.5">
            <button
              onClick={handleRefine}
              disabled={!tweak.trim() || refineLoading}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold transition-colors"
              style={{
                background: tweak.trim() && !refineLoading ? "var(--co-accent)" : "var(--co-rule-strong)",
                color: tweak.trim() && !refineLoading ? "var(--co-paper)" : "var(--co-ink-mute)",
              }}
            >
              {refineLoading ? "refining…" : "apply ⌘↵"}
            </button>
            <button
              onClick={() => {
                setRefining(false);
                setTweak("");
                setRefineError(null);
              }}
              className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px]"
              style={{
                color: "var(--co-ink-mute)",
                border: "1px solid var(--co-rule-strong)",
              }}
            >
              cancel
            </button>
            {revisionCount > 0 && (
              <button
                onClick={() => {
                  setRefinedFlow(undefined);
                  setRefinedOrbit(undefined);
                  setRevisionCount(0);
                  setRefining(false);
                  setTweak("");
                }}
                className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px]"
                style={{ color: "var(--co-ink-mute)" }}
              >
                ↺ reset to original
              </button>
            )}
            {refineError && (
              <span className="text-[11px]" style={{ color: "#c33" }}>
                {refineError}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AssetAction({
  icon,
  label,
  onClick,
  active,
}: {
  icon: string;
  label: string;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] transition-colors"
      style={{
        border: `1px solid ${active ? "var(--co-accent-line)" : "var(--co-rule-strong)"}`,
        background: active ? "var(--co-accent-soft)" : "var(--co-card)",
        color: active ? "var(--co-accent-ink)" : "var(--co-ink-soft)",
      }}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function ChipButton({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[12px] transition-colors"
      style={{
        border: "1px solid var(--co-rule-strong)",
        background: "var(--co-card)",
        color: "var(--co-ink-soft)",
      }}
    >
      {children}
    </button>
  );
}

// ─── Composer ──────────────────────────────────────────────────────────

function Composer({
  draft,
  setDraft,
  format,
  setFormat,
  mode,
  setMode,
  credits,
  onGenerate,
}: {
  draft: string;
  setDraft: (s: string) => void;
  format: Format;
  setFormat: (f: Format) => void;
  mode: Mode;
  setMode: (m: Mode) => void;
  credits: number;
  onGenerate: () => void;
}) {
  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      onGenerate();
    }
  }

  const canSend = draft.trim().length > 0;

  return (
    <div
      className="border-t px-8 pt-4 pb-6"
      style={{ borderColor: "var(--co-rule)", background: "var(--co-paper-soft)" }}
    >
      <div className="max-w-[860px] mx-auto">
        <div
          className="rounded-2xl border p-3.5"
          style={{ borderColor: "var(--co-rule-strong)", background: "var(--co-card)" }}
        >
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Describe what you want — e.g. compare Apollo vs Lemlist for outbound, 4 traits each."
            className="w-full bg-transparent outline-none resize-none text-[14.5px] leading-[1.55]"
            style={{ color: "var(--co-ink)", minHeight: 60 }}
            rows={2}
          />

          <div
            className="flex items-center gap-2 pt-3 mt-1 border-t"
            style={{ borderColor: "var(--co-rule)" }}
          >
            <ModePill value="image" label="image" active={mode === "image"} onClick={() => setMode("image")} />
            <ModePill value="diagram" label="diagram" active={mode === "diagram"} onClick={() => setMode("diagram")} />
            <span className="mx-1 h-4 w-px" style={{ background: "var(--co-rule-strong)" }} />
            <FormatPill value="1:1" active={format === "1:1"} onClick={() => setFormat("1:1")} />
            <FormatPill value="4:5" active={format === "4:5"} onClick={() => setFormat("4:5")} />
            <FormatPill value="9:16" active={format === "9:16"} onClick={() => setFormat("9:16")} />
            <span className="flex-1" />
            <span className="text-[11px] font-mono" style={{ color: "var(--co-ink-mute)" }}>
              {credits} credits
            </span>
            <button
              onClick={onGenerate}
              disabled={!canSend}
              className="btn-primary"
              style={{ padding: "10px 18px", fontSize: 14 }}
            >
              <SparkleIcon light /> Generate
            </button>
          </div>
        </div>
        <div className="text-[11.5px] mt-2 text-center" style={{ color: "var(--co-ink-mute)" }}>
          {mode === "diagram"
            ? "Tip: ⌘↵ · diagram mode — Claude designs an Excalidraw scene and renders it"
            : "Tip: ⌘↵ to generate · Claude reads your brief and renders 4 variations"}
        </div>
      </div>
    </div>
  );
}

function ToolbarChip({ icon, label }: { icon: string; label: string }) {
  return (
    <button
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] transition-colors"
      style={{
        border: "1px solid var(--co-rule-strong)",
        background: "transparent",
        color: "var(--co-ink-soft)",
      }}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function ModePill({
  value,
  label,
  active,
  onClick,
}: {
  value: string;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={value}
      className="px-2.5 py-1 rounded-md text-[11.5px] font-semibold transition-colors"
      style={{
        border: `1px solid ${active ? "var(--co-accent)" : "var(--co-rule-strong)"}`,
        background: active ? "var(--co-accent)" : "transparent",
        color: active ? "var(--co-paper)" : "var(--co-ink-soft)",
      }}
    >
      {label}
    </button>
  );
}

function FormatPill({
  value,
  active,
  onClick,
}: {
  value: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="px-2.5 py-1 rounded-md text-[11.5px] font-mono transition-colors"
      style={{
        border: `1px solid ${active ? "var(--co-ink)" : "var(--co-rule-strong)"}`,
        background: active ? "var(--co-ink)" : "transparent",
        color: active ? "var(--co-paper)" : "var(--co-ink-soft)",
      }}
    >
      {value}
    </button>
  );
}

// ─── Right rail ────────────────────────────────────────────────────────

function RightRail({ credits }: { credits: number }) {
  const [tab, setTab] = useState<"examples" | "recent" | "saved">("examples");

  return (
    <aside
      className="w-[320px] shrink-0 border-l flex flex-col"
      style={{ borderColor: "var(--co-rule)", background: "var(--co-paper-soft)" }}
    >
      {/* Tabs */}
      <div
        className="px-5 pt-5 pb-3 border-b flex items-center gap-5"
        style={{ borderColor: "var(--co-rule)" }}
      >
        <RailTab label="Examples" active={tab === "examples"} onClick={() => setTab("examples")} />
        <RailTab label="Recent" active={tab === "recent"} onClick={() => setTab("recent")} />
        <RailTab label="Saved" count={0} active={tab === "saved"} onClick={() => setTab("saved")} />
        <span className="flex-1" />
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono"
          style={{ border: "1px solid var(--co-rule-strong)", color: "var(--co-ink-soft)" }}
        >
          ⚡ {credits}
        </span>
      </div>

      {/* Brand-kit context */}
      <div className="px-5 py-4 border-b" style={{ borderColor: "var(--co-rule)" }}>
        <div className="flex items-center mb-2">
          <span className="font-display text-[14.5px] font-semibold" style={{ color: "var(--co-ink)" }}>
            Brand kit
          </span>
          <span className="flex-1" />
          <button
            className="text-[11.5px] underline-offset-2 hover:underline"
            style={{ color: "var(--co-ink-mute)" }}
          >
            edit
          </button>
        </div>
        <div className="flex items-center gap-1.5">
          {["#1a1814", "#f97316", "#fde88a", "#faf8f3"].map((c) => (
            <span
              key={c}
              className="w-4 h-4 rounded-sm"
              style={{ background: c, border: "1px solid var(--co-rule-strong)" }}
            />
          ))}
          <span
            className="text-[10px] font-mono ml-2"
            style={{ color: "var(--co-ink-mute)" }}
          >
            Inter · Fraunces
          </span>
        </div>
      </div>

      {/* Library */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {tab === "examples" && (
          <Section
            title="Workflow GIFs"
            count={GALLERY.length}
            sub="Reference style — what good looks like"
          >
            <Gallery />
          </Section>
        )}
        {tab === "recent" && (
          <div
            className="text-[12.5px] py-8 text-center"
            style={{ color: "var(--co-ink-mute)" }}
          >
            No generations yet. Try the composer ↓
          </div>
        )}
        {tab === "saved" && (
          <div
            className="text-[12.5px] py-8 text-center"
            style={{ color: "var(--co-ink-mute)" }}
          >
            Nothing saved yet. Hit ★ on any variation.
          </div>
        )}
      </div>
    </aside>
  );
}

function RailTab({
  label,
  active,
  count,
  onClick,
}: {
  label: string;
  active: boolean;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="text-[12.5px] font-semibold pb-1 transition-colors relative"
      style={{
        color: active ? "var(--co-ink)" : "var(--co-ink-mute)",
        borderBottom: `2px solid ${active ? "var(--co-accent)" : "transparent"}`,
      }}
    >
      {label}
      {typeof count === "number" && (
        <span className="ml-1 font-mono" style={{ color: "var(--co-ink-mute)" }}>
          ({count})
        </span>
      )}
    </button>
  );
}

function Section({
  title,
  count,
  sub,
  children,
}: {
  title: string;
  count: number;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline mb-1">
        <span className="font-display text-[14px] font-semibold" style={{ color: "var(--co-ink)" }}>
          {title}
        </span>
        <span className="ml-1 text-[11px]" style={{ color: "var(--co-ink-mute)" }}>
          ({count})
        </span>
        <span className="flex-1" />
      </div>
      {sub && (
        <div className="text-[10.5px] mb-2.5" style={{ color: "var(--co-ink-mute)" }}>
          {sub}
        </div>
      )}
      {children}
    </div>
  );
}

function Gallery() {
  return (
    <div className="grid grid-cols-2 gap-2">
      {GALLERY.map((g) => (
        <div
          key={g.file}
          className="rounded-xl overflow-hidden border bg-black"
          style={{ borderColor: "var(--co-rule-strong)" }}
        >
          <div className="aspect-[4/5] relative">
            <img
              src={`/examples/yonathan/${g.file}`}
              alt={g.alt}
              className="w-full h-full object-cover block"
              draggable={false}
              loading="lazy"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

type OrbitStyle = "editorial" | "bold" | "minimal" | "brand";


// ─── Tiny shared icons ─────────────────────────────────────────────────

function SparkleIcon({ light }: { light?: boolean }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3l1.8 6.2L20 11l-6.2 1.8L12 19l-1.8-6.2L4 11l6.2-1.8L12 3z"
        fill={light ? "var(--co-paper)" : "var(--co-accent)"}
      />
    </svg>
  );
}
