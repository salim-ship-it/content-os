/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

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

const VALID_STYLES: FlowStyle[] = ["editorial", "bold", "minimal", "brand"];

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

// ─── Route ─────────────────────────────────────────────────────────────

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
  const fonts = await getFonts();
  return new ImageResponse(<FlowLayout cfg={cfg} />, {
    width: cfg.width,
    height: cfg.height,
    fonts,
  });
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
  const style = typeof b.style === "string" && VALID_STYLES.includes(b.style as FlowStyle)
    ? (b.style as FlowStyle)
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

// ─── Layout (cream zigzag — Yonathan/outbound-workflow.html aesthetic) ─

function FlowLayout({ cfg }: { cfg: FlowConfig }) {
  const { width, height, accent, title, steps, style } = cfg;

  // Cream palette — fixed regardless of bg passed in. The cream look is
  // the whole point of this style.
  const bg = "#faf7f1";
  const ink = "#0a0a0a";
  const inkSoft = "#6b7280";
  const cardBg = style === "minimal" ? "rgba(255,255,255,0.6)" : "#ffffff";
  const cardBorder = "#e7e2d6";
  const labelBlue = style === "brand" ? accent : "#1d4ed8";
  const iconBg = style === "brand" ? withAlpha(accent, 0.12) : "#eaf0ff";
  const iconBorder = style === "brand" ? withAlpha(accent, 0.28) : "#dbe4ff";
  const connectorColor =
    style === "brand" ? withAlpha(accent, 0.55) :
    style === "minimal" ? "#cfd8f4" : "#b9c8ff";

  const padX = width * 0.07;
  const padTop = height * 0.06;
  const padBottom = height * 0.05;

  // Title sizing: shrink for long titles so it fits 2 lines max.
  const longTitle = title.length > 32;
  const titleSize = longTitle ? width * 0.058 : width * 0.072;
  const titleFamily = style === "editorial" ? "Fraunces" : "Inter";
  const titleCase = style === "editorial" ? "none" : "uppercase";
  const titleBlockH = height * (longTitle ? 0.18 : 0.16);

  const stageTop = padTop + titleBlockH;
  const stageH = height - stageTop - padBottom;
  const stepSlot = stageH / steps.length;

  const cardW = (width - padX * 2) * 0.48;
  const cardH = stepSlot * 0.74;
  const cardRadius = width * 0.018;

  const iconSize = Math.min(cardH * 0.62, width * 0.06);
  const iconRadius = iconSize * 0.26;
  const labelSize = width * 0.013;
  const cardTitleSize = Math.min(cardH * 0.28, width * 0.026);
  const cardSubSize = Math.min(cardH * 0.18, width * 0.017);
  const cardPad = width * 0.018;
  const cardGap = width * 0.018;

  type Pos = { x: number; top: number; cy: number; isLeft: boolean };
  const positions: Pos[] = steps.map((_, i) => {
    const isLeft = i % 2 === 0;
    const x = isLeft ? padX : width - padX - cardW;
    const top = stageTop + stepSlot * i + (stepSlot - cardH) / 2;
    return { x, top, cy: top + cardH / 2, isLeft };
  });

  // Sample bezier curves between consecutive cards as discrete dots.
  // Satori's SVG <path> stroke-dasharray rendering is unreliable, so we
  // build the dotted look out of small absolute-positioned div circles.
  const DOTS_PER_CURVE = 22;
  const dotR = Math.max(2, width * 0.0028);
  type Dot = { x: number; y: number };
  const dots: Dot[] = [];
  positions.slice(0, -1).forEach((p, i) => {
    const next = positions[i + 1];
    const sx = p.isLeft ? p.x + cardW : p.x;
    const ex = next.isLeft ? next.x + cardW : next.x;
    const sy = p.cy;
    const ey = next.cy;
    const c1x = sx + (ex - sx) * 0.5;
    const c1y = sy;
    const c2x = sx + (ex - sx) * 0.5;
    const c2y = ey;
    for (let k = 1; k < DOTS_PER_CURVE; k++) {
      const t = k / DOTS_PER_CURVE;
      const u = 1 - t;
      const x =
        u * u * u * sx +
        3 * u * u * t * c1x +
        3 * u * t * t * c2x +
        t * t * t * ex;
      const y =
        u * u * u * sy +
        3 * u * u * t * c1y +
        3 * u * t * t * c2y +
        t * t * t * ey;
      dots.push({ x, y });
    }
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width,
        height,
        background: bg,
        position: "relative",
      }}
    >
      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: padTop,
          left: padX,
          right: padX,
          display: "flex",
        }}
      >
        <span
          style={{
            fontFamily: titleFamily,
            fontWeight: 700,
            fontSize: titleSize,
            lineHeight: 1.05,
            color: ink,
            letterSpacing: -1.5,
            textTransform: titleCase as "uppercase" | "none",
          }}
        >
          {title}
        </span>
      </div>

      {/* Dotted curved connectors — sampled bezier dots as div circles */}
      {dots.map((d, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: d.x - dotR,
            top: d.y - dotR,
            width: dotR * 2,
            height: dotR * 2,
            borderRadius: dotR,
            background: connectorColor,
          }}
        />
      ))}

      {/* Step cards */}
      {steps.map((s, i) => {
        const pos = positions[i];
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: pos.top,
              left: pos.x,
              width: cardW,
              height: cardH,
              background: cardBg,
              border: `1.5px solid ${cardBorder}`,
              borderRadius: cardRadius,
              display: "flex",
              alignItems: "center",
              padding: cardPad,
              gap: cardGap,
            }}
          >
            {/* Icon block */}
            <div
              style={{
                width: iconSize,
                height: iconSize,
                borderRadius: iconRadius,
                background: iconBg,
                border: `1px solid ${iconBorder}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontSize: iconSize * 0.55,
                  color: labelBlue,
                  fontWeight: 700,
                }}
              >
                {s.icon ?? String(i + 1)}
              </span>
            </div>

            {/* Text column */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
              }}
            >
              <span
                style={{
                  fontFamily: "Inter",
                  fontWeight: 700,
                  fontSize: labelSize,
                  color: labelBlue,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  marginBottom: cardSubSize * 0.25,
                }}
              >
                Step {String(i + 1).padStart(2, "0")}
              </span>
              <span
                style={{
                  fontFamily: "Inter",
                  fontWeight: 700,
                  fontSize: cardTitleSize,
                  color: ink,
                  letterSpacing: -0.5,
                  lineHeight: 1.15,
                }}
              >
                {s.label}
              </span>
              {s.sub && (
                <span
                  style={{
                    fontFamily: "Inter",
                    fontWeight: 500,
                    fontSize: cardSubSize,
                    color: inkSoft,
                    lineHeight: 1.3,
                    marginTop: cardSubSize * 0.3,
                  }}
                >
                  {s.sub}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── helpers ──────────────────────────────────────────────────────────

function withAlpha(hex: string, a: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}
