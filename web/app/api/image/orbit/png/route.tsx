/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";
import { NextRequest, NextResponse } from "next/server";
import type { OrbitConfig, OrbitStyle, OrbitSide } from "../../../../../lib/orbit/render";
import { ORBIT_PRESETS } from "../../../../../lib/orbit/render";

export const runtime = "edge";

const VALID_STYLES: OrbitStyle[] = ["editorial", "bold", "minimal", "brand"];

// ─── Font loading (cached per edge instance) ──────────────────────────

let interMedium: ArrayBuffer | null = null;
let interBold: ArrayBuffer | null = null;
let frauncesBold: ArrayBuffer | null = null;

async function loadGoogleFont(family: string, weight: number): Promise<ArrayBuffer> {
  const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&display=swap`;
  const css = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15" },
  }).then((r) => r.text());
  const match = css.match(/src: url\((https?:\/\/[^)]+)\)/);
  if (!match) throw new Error(`No font URL found for ${family} ${weight}`);
  return await fetch(match[1]).then((r) => r.arrayBuffer());
}

async function getFonts() {
  if (!interMedium) interMedium = await loadGoogleFont("Inter", 500);
  if (!interBold) interBold = await loadGoogleFont("Inter", 700);
  if (!frauncesBold) frauncesBold = await loadGoogleFont("Fraunces", 700);
  return [
    { name: "Inter", data: interMedium, weight: 500 as const, style: "normal" as const },
    { name: "Inter", data: interBold, weight: 700 as const, style: "normal" as const },
    { name: "Fraunces", data: frauncesBold, weight: 700 as const, style: "normal" as const },
  ];
}

// ─── Route handler ─────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  return respond(resolveConfig(body));
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const obj: Record<string, unknown> = {};
  for (const [k, v] of params) obj[k] = v;
  return respond(resolveConfig(obj));
}

async function respond(cfg: OrbitConfig | null) {
  if (!cfg) {
    return NextResponse.json(
      { error: "Pass either { preset, style } or a full config." },
      { status: 400 }
    );
  }
  const fonts = await getFonts();
  return new ImageResponse(<OrbitLayout cfg={cfg} />, {
    width: cfg.width,
    height: cfg.height,
    fonts,
  });
}

function resolveConfig(body: unknown): OrbitConfig | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const style = typeof b.style === "string" && VALID_STYLES.includes(b.style as OrbitStyle)
    ? (b.style as OrbitStyle)
    : "editorial";

  if (typeof b.preset === "string") {
    const base = ORBIT_PRESETS[b.preset];
    if (!base) return null;
    return { ...base, style };
  }
  if (
    typeof b.width === "number" &&
    typeof b.height === "number" &&
    typeof b.bg === "string" &&
    isSide(b.top) &&
    isSide(b.bottom)
  ) {
    return { width: b.width, height: b.height, bg: b.bg, style, top: b.top, bottom: b.bottom };
  }
  return null;
}

function isSide(v: unknown): v is OrbitSide {
  if (!v || typeof v !== "object") return false;
  const s = v as Record<string, unknown>;
  return (
    typeof s.title === "string" &&
    Array.isArray(s.labels) &&
    s.labels.length === 4 &&
    s.labels.every((l) => typeof l === "string") &&
    typeof s.accent === "string" &&
    typeof s.sweep === "number"
  );
}

// ─── Orbit layout (React) ──────────────────────────────────────────────

function OrbitLayout({ cfg }: { cfg: OrbitConfig }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: cfg.width,
        height: cfg.height,
        background: cfg.bg,
        position: "relative",
      }}
    >
      <OrbitSection
        side={cfg.top}
        style={cfg.style}
        bg={cfg.bg}
        sectionWidth={cfg.width}
        sectionHeight={cfg.height / 2}
      />
      <OrbitSection
        side={cfg.bottom}
        style={cfg.style}
        bg={cfg.bg}
        sectionWidth={cfg.width}
        sectionHeight={cfg.height / 2}
      />
    </div>
  );
}

function OrbitSection({
  side,
  style,
  bg,
  sectionWidth,
  sectionHeight,
}: {
  side: OrbitSide;
  style: OrbitStyle;
  bg: string;
  sectionWidth: number;
  sectionHeight: number;
}) {
  const lightBg = isLight(bg);
  const ink = lightBg ? "#1a1814" : "#ffffff";
  const baseRing = lightBg ? "rgba(26,24,20,0.18)" : "rgba(255,255,255,0.18)";

  const r = Math.min(sectionWidth * 0.3, sectionHeight * 0.4);
  const cx = sectionWidth / 2;
  const cy = sectionHeight / 2;

  const ringWidth = style === "bold" ? r * 0.032 : style === "brand" ? r * 0.044 : r * 0.016;
  const arcWidth = style === "bold" ? r * 0.06 : style === "minimal" ? r * 0.02 : style === "brand" ? r * 0.05 : r * 0.032;
  const showFullAccentRing = style === "brand";
  const centerR = style === "bold" ? r * 0.12 : style === "brand" ? r * 0.16 : style === "minimal" ? r * 0.04 : r * 0.08;
  const titleSize = style === "bold" ? r * 0.2 : style === "minimal" ? r * 0.13 : r * 0.16;
  const labelSize = r * 0.1;
  const titleFamily = style === "editorial" ? "Fraunces" : "Inter";
  const labelFamily = style === "editorial" ? "Fraunces" : "Inter";

  const positions = [
    { x: cx - r, y: cy - r * 0.6 },
    { x: cx + r, y: cy - r * 0.6 },
    { x: cx + r, y: cy + r * 0.6 },
    { x: cx - r, y: cy + r * 0.6 },
  ];
  const activeIdx = Math.floor(side.sweep * 4) % 4;

  const startAng = -Math.PI / 2 + side.sweep * Math.PI * 2;
  const endAng = startAng + Math.PI / 2;
  const arc = describeArc(cx, cy, r, startAng, endAng);

  return (
    <div
      style={{
        position: "relative",
        width: sectionWidth,
        height: sectionHeight,
        display: "flex",
      }}
    >
      {/* SVG layer for geometry — Satori rasterizes shapes correctly */}
      <svg
        width={sectionWidth}
        height={sectionHeight}
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={showFullAccentRing ? side.accent : baseRing}
          strokeWidth={ringWidth}
          strokeOpacity={showFullAccentRing ? 0.4 : 1}
        />
        {style !== "minimal" && (
          <path d={arc} fill="none" stroke={side.accent} strokeWidth={arcWidth} strokeLinecap="round" />
        )}
        <circle
          cx={cx}
          cy={cy}
          r={centerR}
          fill={side.accent}
          fillOpacity={style === "minimal" ? 0.55 : 0.92}
        />
      </svg>

      {/* Title — real font */}
      <div
        style={{
          position: "absolute",
          top: cy + r * 0.34,
          left: 0,
          width: sectionWidth,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontSize: titleSize,
            fontFamily: titleFamily,
            fontWeight: 700,
            color: ink,
            letterSpacing: -0.5,
          }}
        >
          {side.title}
        </span>
      </div>

      {/* Label pills at NW/NE/SE/SW */}
      {positions.map((pos, i) => (
        <Pill
          key={i}
          x={pos.x}
          y={pos.y}
          text={side.labels[i] ?? ""}
          active={i === activeIdx && style !== "minimal"}
          style={style}
          accent={side.accent}
          ink={ink}
          bg={bg}
          lightBg={lightBg}
          size={labelSize}
          family={labelFamily}
          baseRing={baseRing}
        />
      ))}
    </div>
  );
}

function Pill({
  x,
  y,
  text,
  active,
  style,
  accent,
  ink,
  bg,
  lightBg,
  size,
  family,
  baseRing,
}: {
  x: number;
  y: number;
  text: string;
  active: boolean;
  style: OrbitStyle;
  accent: string;
  ink: string;
  bg: string;
  lightBg: boolean;
  size: number;
  family: string;
  baseRing: string;
}) {
  // Heuristic pill width based on character count
  const charW = size * 0.55;
  const padX = size * 0.85;
  const w = Math.max(text.length * charW + padX * 2, size * 4);
  const h = size * 1.85;
  const left = x - w / 2;
  const top = y - h / 2;

  if (style === "minimal") {
    // Just floating text, no pill
    return (
      <div
        style={{
          position: "absolute",
          top,
          left,
          width: w,
          height: h,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontSize: size,
            fontFamily: family,
            fontWeight: 500,
            color: ink,
            opacity: 0.7,
          }}
        >
          {text}
        </span>
      </div>
    );
  }

  let bgColor = "transparent";
  let textColor = ink;
  let border = "none";
  let radius = h / 2;

  if (style === "bold") {
    bgColor = active ? accent : lightBg ? "#1a1814" : "rgba(255,255,255,0.95)";
    textColor = active ? bg : lightBg ? "#faf8f3" : "#1a1814";
  } else if (style === "brand") {
    bgColor = active ? accent : "transparent";
    textColor = active ? bg : accent;
    border = `${Math.max(1, size * 0.08)}px solid ${accent}`;
  } else {
    // editorial
    bgColor = active ? accent : "transparent";
    textColor = active ? bg : ink;
    border = `${Math.max(1, size * 0.07)}px solid ${active ? accent : baseRing}`;
    radius = h * 0.22;
  }

  return (
    <div
      style={{
        position: "absolute",
        top,
        left,
        width: w,
        height: h,
        background: bgColor,
        border,
        borderRadius: radius,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span
        style={{
          fontSize: size,
          fontFamily: family,
          fontWeight: style === "bold" ? 700 : active ? 700 : 500,
          color: textColor,
        }}
      >
        {text}
      </span>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────

function describeArc(cx: number, cy: number, r: number, startRad: number, endRad: number): string {
  const sx = cx + r * Math.cos(startRad);
  const sy = cy + r * Math.sin(startRad);
  const ex = cx + r * Math.cos(endRad);
  const ey = cy + r * Math.sin(endRad);
  const large = endRad - startRad > Math.PI ? 1 : 0;
  return `M ${sx.toFixed(2)} ${sy.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${ex.toFixed(2)} ${ey.toFixed(2)}`;
}

function isLight(hex: string): boolean {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return false;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6;
}
