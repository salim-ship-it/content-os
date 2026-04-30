// Pure SVG renderer for the orbit-comparison template.
// Takes a structured config, returns an SVG string. No React, no DOM.
// Runs anywhere: server route, build script, CLI.

export type OrbitStyle = "editorial" | "bold" | "minimal" | "brand";

export type OrbitSide = {
  title: string;
  labels: [string, string, string, string];
  accent: string;
  sweep: number; // 0..1 — where the active highlight sits around the circle
};

export type OrbitConfig = {
  width: number;
  height: number;
  bg: string;
  style: OrbitStyle;
  top: OrbitSide;
  bottom: OrbitSide;
};

export function renderOrbit(cfg: OrbitConfig): string {
  const { width, height, bg, style, top, bottom } = cfg;

  // Two stacked circles centered horizontally
  const cx = width / 2;
  const r = Math.min(width * 0.32, height * 0.22);
  const topCy = height * 0.28;
  const botCy = height * 0.72;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <rect width="${width}" height="${height}" fill="${bg}" />
  ${renderOrbitGroup({ cx, cy: topCy, r, side: top, style, bg })}
  ${renderOrbitGroup({ cx, cy: botCy, r, side: bottom, style, bg })}
</svg>`;
}

// ─── Internals ─────────────────────────────────────────────────────────

function renderOrbitGroup(args: {
  cx: number;
  cy: number;
  r: number;
  side: OrbitSide;
  style: OrbitStyle;
  bg: string;
}): string {
  const { cx, cy, r, side, style, bg } = args;
  const lightBg = isLight(bg);
  const inkOnBg = lightBg ? "#1a1814" : "#ffffff";
  const baseRing = lightBg ? "rgba(26,24,20,0.18)" : "rgba(255,255,255,0.18)";

  // Style-driven geometry
  const ringWidth = style === "bold" ? r * 0.032 : style === "brand" ? r * 0.044 : r * 0.016;
  const arcWidth = style === "bold" ? r * 0.06 : style === "minimal" ? r * 0.02 : style === "brand" ? r * 0.05 : r * 0.032;
  const showFullAccentRing = style === "brand";
  const centerR = style === "bold" ? r * 0.12 : style === "brand" ? r * 0.16 : style === "minimal" ? r * 0.04 : r * 0.08;
  const labelFont = style === "editorial" ? "Fraunces, Georgia, serif" : "Inter, system-ui, sans-serif";
  const labelWeight = style === "bold" ? 800 : style === "minimal" ? 500 : 600;
  const titleSize = style === "bold" ? r * 0.18 : style === "minimal" ? r * 0.11 : r * 0.14;
  const titleFont = style === "editorial" ? "Fraunces, Georgia, serif" : "Inter, system-ui, sans-serif";
  const labelSize = r * 0.108;

  // 4 corner positions (NW, NE, SE, SW)
  const positions: { x: number; y: number }[] = [
    { x: cx - r, y: cy - r * 0.6 },
    { x: cx + r, y: cy - r * 0.6 },
    { x: cx + r, y: cy + r * 0.6 },
    { x: cx - r, y: cy + r * 0.6 },
  ];
  const activeIdx = Math.floor(side.sweep * 4) % 4;

  // Sweep arc (90deg wedge)
  const startAng = -Math.PI / 2 + side.sweep * Math.PI * 2;
  const endAng = startAng + Math.PI / 2;
  const arc = describeArc(cx, cy, r, startAng, endAng);

  // Build the group
  const parts: string[] = [];

  // Base ring
  parts.push(
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${
      showFullAccentRing ? side.accent : baseRing
    }" stroke-width="${ringWidth}" ${showFullAccentRing ? 'stroke-opacity="0.4"' : ""} />`
  );

  // Accent sweep
  if (style !== "minimal") {
    parts.push(
      `<path d="${arc}" fill="none" stroke="${side.accent}" stroke-width="${arcWidth}" stroke-linecap="round" />`
    );
  }

  // Center mark
  parts.push(
    `<circle cx="${cx}" cy="${cy}" r="${centerR}" fill="${side.accent}" fill-opacity="${
      style === "minimal" ? 0.55 : 0.92
    }" />`
  );

  // Title under center
  parts.push(
    `<text x="${cx}" y="${cy + r * 0.42}" fill="${inkOnBg}" font-size="${titleSize}" font-weight="${
      style === "bold" ? 800 : 700
    }" font-family="${escapeAttr(titleFont)}" text-anchor="middle">${escapeText(side.title)}</text>`
  );

  // Labels
  positions.forEach((pos, i) => {
    const active = i === activeIdx && style !== "minimal";
    const label = side.labels[i] ?? "";
    const w = label.length * (labelSize * 0.6) + labelSize * 1.6;
    const h = labelSize * 1.8;

    if (style === "minimal") {
      parts.push(
        `<text x="${pos.x}" y="${pos.y + 2}" fill="${inkOnBg}" fill-opacity="0.7" font-size="${labelSize}" font-weight="500" font-family="${escapeAttr(labelFont)}" text-anchor="middle">${escapeText(label)}</text>`
      );
      return;
    }

    if (style === "bold") {
      const fill = active ? side.accent : lightBg ? "#1a1814" : "rgba(255,255,255,0.95)";
      const textFill = active ? bg : lightBg ? "#faf8f3" : "#1a1814";
      parts.push(
        `<g transform="translate(${pos.x - w / 2}, ${pos.y - h / 2})">` +
          `<rect width="${w}" height="${h}" rx="${h / 2}" fill="${fill}" />` +
          `<text x="${w / 2}" y="${h * 0.7}" fill="${textFill}" font-size="${labelSize}" font-weight="${labelWeight}" font-family="${escapeAttr(labelFont)}" text-anchor="middle">${escapeText(label)}</text>` +
          `</g>`
      );
      return;
    }

    if (style === "brand") {
      parts.push(
        `<g transform="translate(${pos.x - w / 2}, ${pos.y - h / 2})">` +
          `<rect width="${w}" height="${h}" rx="${h / 2}" fill="${active ? side.accent : "transparent"}" stroke="${side.accent}" stroke-width="${ringWidth * 0.7}" />` +
          `<text x="${w / 2}" y="${h * 0.7}" fill="${active ? bg : side.accent}" font-size="${labelSize}" font-weight="${labelWeight}" font-family="${escapeAttr(labelFont)}" text-anchor="middle">${escapeText(label)}</text>` +
          `</g>`
      );
      return;
    }

    // editorial
    parts.push(
      `<g transform="translate(${pos.x - w / 2}, ${pos.y - h / 2})">` +
        `<rect width="${w}" height="${h}" rx="${h * 0.2}" fill="${active ? side.accent : "transparent"}" stroke="${active ? side.accent : baseRing}" stroke-width="${ringWidth * 0.85}" />` +
        `<text x="${w / 2}" y="${h * 0.7}" fill="${active ? bg : inkOnBg}" fill-opacity="${active ? 1 : 0.85}" font-size="${labelSize}" font-weight="${active ? 700 : 500}" font-family="${escapeAttr(labelFont)}" text-anchor="middle">${escapeText(label)}</text>` +
        `</g>`
    );
  });

  return `<g>${parts.join("\n  ")}</g>`;
}

function describeArc(cx: number, cy: number, r: number, startRad: number, endRad: number): string {
  const sx = cx + r * Math.cos(startRad);
  const sy = cy + r * Math.sin(startRad);
  const ex = cx + r * Math.cos(endRad);
  const ey = cy + r * Math.sin(endRad);
  const large = endRad - startRad > Math.PI ? 1 : 0;
  return `M ${sx.toFixed(2)} ${sy.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${ex.toFixed(2)} ${ey.toFixed(2)}`;
}

function isLight(hex: string): boolean {
  // Crude luminance check on hex strings; defaults to dark if anything weird.
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return false;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6;
}

function escapeText(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(s: string): string {
  return s.replace(/"/g, "&quot;");
}

// ─── Convenience presets ───────────────────────────────────────────────

export const ORBIT_PRESETS: Record<string, Omit<OrbitConfig, "style">> = {
  "claude-vs-codex": {
    width: 1080,
    height: 1350,
    bg: "#0f0e0c",
    top: {
      title: "Claude Code",
      labels: ["Local on PC", "Sees files", "Runs tests", "Full control"],
      accent: "#f97316",
      sweep: 0.18,
    },
    bottom: {
      title: "Codex",
      labels: ["Cloud sandbox", "Zero setup", "Parallel tasks", "Autonomous"],
      accent: "#8b5cf6",
      sweep: 0.55,
    },
  },
};
