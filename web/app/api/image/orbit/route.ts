import { NextRequest, NextResponse } from "next/server";
import { renderOrbit, ORBIT_PRESETS, type OrbitConfig, type OrbitStyle } from "../../../../lib/orbit/render";

const VALID_STYLES: OrbitStyle[] = ["editorial", "bold", "minimal", "brand"];

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  return respondWithSvg(resolveConfig(body));
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const body: Record<string, unknown> = {};
  for (const [k, v] of params) body[k] = v;
  return respondWithSvg(resolveConfig(body));
}

function respondWithSvg(cfg: ReturnType<typeof resolveConfig>) {
  if (!cfg) {
    return NextResponse.json(
      { error: "Pass either { preset, style } or a full { width, height, bg, style, top, bottom } config." },
      { status: 400 }
    );
  }
  const svg = renderOrbit(cfg);
  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=60",
    },
  });
}

function resolveConfig(body: unknown): OrbitConfig | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;

  const style = typeof b.style === "string" && VALID_STYLES.includes(b.style as OrbitStyle)
    ? (b.style as OrbitStyle)
    : "editorial";

  // Preset path: short config
  if (typeof b.preset === "string") {
    const base = ORBIT_PRESETS[b.preset];
    if (!base) return null;
    return { ...base, style };
  }

  // Full config path
  if (
    typeof b.width === "number" &&
    typeof b.height === "number" &&
    typeof b.bg === "string" &&
    isSide(b.top) &&
    isSide(b.bottom)
  ) {
    return {
      width: b.width,
      height: b.height,
      bg: b.bg,
      style,
      top: b.top,
      bottom: b.bottom,
    };
  }
  return null;
}

function isSide(v: unknown): v is OrbitConfig["top"] {
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
