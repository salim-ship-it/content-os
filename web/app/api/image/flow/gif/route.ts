import { NextRequest, NextResponse } from "next/server";
import puppeteer, { Browser } from "puppeteer";
import { spawn } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import os from "os";

// Animated GIF version of the flow renderer. Reuses puppeteer to render
// an HTML scene with CSS pulse animations on each card, captures frames,
// and encodes the loop to a GIF via ffmpeg.

export const runtime = "nodejs";
export const maxDuration = 60;

type FlowStep = { label: string; sub?: string; icon?: string };
type FlowStyle = "editorial" | "bold" | "minimal" | "brand";

type FlowConfig = {
  width: number;
  height: number;
  bg: string;
  style: FlowStyle;
  title: string;
  accent: string;
  steps: FlowStep[];
};

// Reuse a single chromium instance across requests so we don't pay the
// ~1s launch tax per render.
let browserPromise: Promise<Browser> | null = null;
function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-dev-shm-usage"],
    });
  }
  return browserPromise;
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const cfg = parseConfig(body);
  if (!cfg) {
    return NextResponse.json(
      { error: "Pass { width, height, bg, style, title, accent, steps[] }" },
      { status: 400 }
    );
  }

  // Render the GIF at half-res to keep file size reasonable for LinkedIn,
  // regardless of what the PNG was rendered at.
  const W = Math.min(cfg.width, 720);
  const H = Math.round((cfg.height / cfg.width) * W);
  const FPS = 15;
  const CYCLE_S = 2.4;
  const FRAME_COUNT = Math.round(FPS * CYCLE_S);

  const html = buildHtml({ ...cfg, width: W, height: H });

  const browser = await getBrowser();
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "flow-gif-"));
  try {
    await page.setContent(html, { waitUntil: "networkidle0" });
    // Let fonts settle and the entrance animations complete before we
    // start capturing the looping pulse.
    await new Promise((r) => setTimeout(r, 700));

    const frameInterval = 1000 / FPS;
    for (let i = 0; i < FRAME_COUNT; i++) {
      const buf = await page.screenshot({ type: "png", omitBackground: false });
      await fs.writeFile(
        path.join(tmpDir, `f${String(i).padStart(4, "0")}.png`),
        buf
      );
      await new Promise((r) => setTimeout(r, frameInterval));
    }

    await page.close();

    const outPath = path.join(tmpDir, "out.gif");
    await encodeGif(tmpDir, outPath, FPS);
    const gif = await fs.readFile(outPath);

    return new NextResponse(new Uint8Array(gif), {
      status: 200,
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    try {
      await page.close();
    } catch {}
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Render failed" },
      { status: 500 }
    );
  } finally {
    fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}

function parseConfig(body: unknown): FlowConfig | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  if (
    typeof b.width !== "number" ||
    typeof b.height !== "number" ||
    typeof b.bg !== "string" ||
    typeof b.title !== "string" ||
    typeof b.accent !== "string" ||
    !Array.isArray(b.steps)
  ) {
    return null;
  }
  const styleVal = typeof b.style === "string" ? b.style : "editorial";
  const style: FlowStyle =
    styleVal === "bold" || styleVal === "minimal" || styleVal === "brand"
      ? styleVal
      : "editorial";
  const steps = (b.steps as unknown[])
    .filter(
      (s): s is { label: string; sub?: string; icon?: string } =>
        !!s && typeof s === "object" && typeof (s as { label?: unknown }).label === "string"
    )
    .map((s) => ({
      label: s.label,
      sub: typeof s.sub === "string" ? s.sub : undefined,
      icon: typeof s.icon === "string" ? s.icon : undefined,
    }));
  if (steps.length < 2) return null;
  return {
    width: b.width,
    height: b.height,
    bg: b.bg,
    style,
    title: b.title,
    accent: b.accent,
    steps,
  };
}

function encodeGif(tmpDir: string, outPath: string, fps: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = [
      "-y",
      "-framerate",
      String(fps),
      "-i",
      path.join(tmpDir, "f%04d.png"),
      "-vf",
      // Two-pass palette generation gives a much cleaner GIF than the
      // default global palette.
      "split[a][b];[a]palettegen=stats_mode=full[p];[b][p]paletteuse=dither=bayer:bayer_scale=5",
      "-loop",
      "0",
      outPath,
    ];
    const ff = spawn("ffmpeg", args);
    let stderr = "";
    ff.stderr.on("data", (d) => {
      stderr += d.toString();
    });
    ff.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited ${code}: ${stderr.slice(-400)}`));
    });
    ff.on("error", reject);
  });
}

// ─── HTML template (mirrors the PNG layout, plus pulse animation) ─────

function buildHtml(cfg: FlowConfig): string {
  const { width: W, height: H, accent, title, steps, style } = cfg;

  const bg = "#faf7f1";
  const ink = "#0a0a0a";
  const inkSoft = "#6b7280";
  const cardBg = style === "minimal" ? "rgba(255,255,255,0.6)" : "#ffffff";
  const cardBorder = "#e7e2d6";
  const labelBlue = style === "brand" ? accent : "#1d4ed8";
  const iconBg = style === "brand" ? withAlpha(accent, 0.12) : "#eaf0ff";
  const iconBorder = style === "brand" ? withAlpha(accent, 0.28) : "#dbe4ff";
  const connectorColor =
    style === "brand"
      ? withAlpha(accent, 0.55)
      : style === "minimal"
        ? "#cfd8f4"
        : "#b9c8ff";

  const padX = W * 0.07;
  const padTop = H * 0.06;
  const padBottom = H * 0.05;
  const longTitle = title.length > 32;
  const titleSize = longTitle ? W * 0.058 : W * 0.072;
  const titleFamily = style === "editorial" ? "Fraunces" : "Inter";
  const titleCase = style === "editorial" ? "none" : "uppercase";
  const titleBlockH = H * (longTitle ? 0.18 : 0.16);
  const stageTop = padTop + titleBlockH;
  const stageH = H - stageTop - padBottom;
  const stepSlot = stageH / steps.length;
  const cardW = (W - padX * 2) * 0.48;
  const cardH = stepSlot * 0.74;
  const cardRadius = W * 0.018;
  const iconSize = Math.min(cardH * 0.62, W * 0.06);
  const iconRadius = iconSize * 0.26;
  const labelSize = W * 0.013;
  const cardTitleSize = Math.min(cardH * 0.28, W * 0.026);
  const cardSubSize = Math.min(cardH * 0.18, W * 0.017);
  const cardPad = W * 0.018;
  const cardGap = W * 0.018;
  const dotR = Math.max(2, W * 0.0028);

  // Card positions
  const positions = steps.map((_, i) => {
    const isLeft = i % 2 === 0;
    const x = isLeft ? padX : W - padX - cardW;
    const top = stageTop + stepSlot * i + (stepSlot - cardH) / 2;
    return { x, top, cy: top + cardH / 2, isLeft };
  });

  // Bezier-sampled connector dots
  const dots: { x: number; y: number }[] = [];
  positions.slice(0, -1).forEach((p) => {
    const next = positions[positions.indexOf(p) + 1];
    const sx = p.isLeft ? p.x + cardW : p.x;
    const ex = next.isLeft ? next.x + cardW : next.x;
    const sy = p.cy;
    const ey = next.cy;
    const c1x = sx + (ex - sx) * 0.5;
    const c1y = sy;
    const c2x = sx + (ex - sx) * 0.5;
    const c2y = ey;
    for (let k = 1; k < 22; k++) {
      const t = k / 22;
      const u = 1 - t;
      dots.push({
        x: u * u * u * sx + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * ex,
        y: u * u * u * sy + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * ey,
      });
    }
  });

  // Stagger so the entire pulse loop completes in CYCLE_S=2.4s.
  // Each card pulses once per cycle, evenly distributed.
  const N = steps.length;
  const cycleS = 2.4;
  const stagger = cycleS / N;

  const cardsHtml = steps
    .map((s, i) => {
      const pos = positions[i];
      const delay = i * stagger;
      return `
        <div class="card" style="
          position:absolute;
          top:${pos.top}px; left:${pos.x}px;
          width:${cardW}px; height:${cardH}px;
          background:${cardBg};
          border:1.5px solid ${cardBorder};
          border-radius:${cardRadius}px;
          display:flex; align-items:center;
          padding:${cardPad}px; gap:${cardGap}px;
        ">
          <div class="glow" style="animation-delay:${delay.toFixed(3)}s;"></div>
          <div style="
            width:${iconSize}px; height:${iconSize}px;
            border-radius:${iconRadius}px;
            background:${iconBg}; border:1px solid ${iconBorder};
            display:flex; align-items:center; justify-content:center;
            flex-shrink:0;
          ">
            <span style="font-size:${iconSize * 0.55}px; color:${labelBlue}; font-weight:700;">
              ${escapeHtml(s.icon ?? String(i + 1))}
            </span>
          </div>
          <div style="display:flex; flex-direction:column; flex:1; min-width:0;">
            <span style="
              font-family:Inter, sans-serif; font-weight:700;
              font-size:${labelSize}px; color:${labelBlue};
              letter-spacing:2px; text-transform:uppercase;
              margin-bottom:${cardSubSize * 0.25}px;
            ">Step ${String(i + 1).padStart(2, "0")}</span>
            <span style="
              font-family:Inter, sans-serif; font-weight:700;
              font-size:${cardTitleSize}px; color:${ink};
              letter-spacing:-0.5px; line-height:1.15;
            ">${escapeHtml(s.label)}</span>
            ${s.sub
              ? `<span style="
                  font-family:Inter, sans-serif; font-weight:500;
                  font-size:${cardSubSize}px; color:${inkSoft};
                  line-height:1.3; margin-top:${cardSubSize * 0.3}px;
                ">${escapeHtml(s.sub)}</span>`
              : ""}
          </div>
        </div>`;
    })
    .join("");

  const dotsHtml = dots
    .map(
      (d) => `<div style="
        position:absolute;
        left:${d.x - dotR}px; top:${d.y - dotR}px;
        width:${dotR * 2}px; height:${dotR * 2}px;
        border-radius:${dotR}px;
        background:${connectorColor};
      "></div>`
    )
    .join("");

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@500;700;900&family=Fraunces:wght@700&display=swap" />
<style>
  * { box-sizing: border-box; }
  html, body { margin:0; padding:0; }
  body { background:${bg}; width:${W}px; height:${H}px; overflow:hidden; }
  .stage { position:relative; width:${W}px; height:${H}px; }
  .glow {
    position:absolute; inset:-2px;
    border-radius:${cardRadius + 2}px;
    pointer-events:none; opacity:0;
    box-shadow: 0 0 0 0 ${withAlpha(accent === "#1d4ed8" || style === "editorial" ? "#3b82f6" : accent, 0.45)};
    animation: pulse ${cycleS}s ease-in-out infinite;
  }
  @keyframes pulse {
    0%   { opacity:0;   box-shadow: 0 0 0 0   ${withAlpha(accent === "#1d4ed8" || style === "editorial" ? "#3b82f6" : accent, 0.45)}; }
    8%   { opacity:1;   box-shadow: 0 0 0 6px ${withAlpha(accent === "#1d4ed8" || style === "editorial" ? "#3b82f6" : accent, 0.45)}; }
    24%  { opacity:0;   box-shadow: 0 0 0 14px ${withAlpha(accent === "#1d4ed8" || style === "editorial" ? "#3b82f6" : accent, 0)}; }
    100% { opacity:0;   box-shadow: 0 0 0 0   ${withAlpha(accent === "#1d4ed8" || style === "editorial" ? "#3b82f6" : accent, 0)}; }
  }
</style>
</head>
<body>
  <div class="stage">
    <span style="
      position:absolute;
      top:${padTop}px; left:${padX}px; right:${padX}px;
      font-family:${titleFamily}, sans-serif; font-weight:700;
      font-size:${titleSize}px; line-height:1.05;
      color:${ink}; letter-spacing:-1.5px;
      text-transform:${titleCase};
      display:block;
    ">${escapeHtml(title)}</span>
    ${dotsHtml}
    ${cardsHtml}
  </div>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function withAlpha(hex: string, a: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}
