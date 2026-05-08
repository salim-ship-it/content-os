// Programmatic Excalidraw builder.
// Claude returns a structured DiagramSpec; this module converts it to valid
// Excalidraw v2 JSON with correct text dimensions — no text-rendering bugs.

let _seed = 1;
function seed() { return ++_seed * 100003; }
function id() { return Math.random().toString(36).slice(2, 10); }

// Approximate rendered width for Virgil (fontFamily 1) at a given fontSize.
function textWidth(text: string, fontSize: number): number {
  return Math.max(40, Math.ceil(text.length * fontSize * 0.58));
}
function textHeight(fontSize: number, lines = 1): number {
  return Math.ceil(fontSize * 1.4 * lines);
}

// Wrap text into lines that fit within maxW px.
function wrapText(text: string, fontSize: number, maxW: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (textWidth(candidate, fontSize) <= maxW) {
      line = candidate;
    } else {
      if (line) lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

function makeRect(
  x: number, y: number, w: number, h: number,
  strokeColor: string, fill = "transparent"
) {
  return {
    id: id(), type: "rectangle",
    x, y, width: w, height: h,
    strokeColor, backgroundColor: fill,
    fillStyle: "solid", strokeWidth: 2, strokeStyle: "dotted",
    roughness: 2, opacity: 100, angle: 0,
    seed: seed(), version: 1, versionNonce: 0,
    isDeleted: false, groupIds: [], boundElements: [], link: null, locked: false,
    roundness: { type: 3 },
  };
}

function makeText(
  text: string, cx: number, cy: number,
  fontSize: number, color: string,
  align: "center" | "left" = "center",
  maxW?: number  // if set, wrap text to fit within this width
) {
  let displayText = text;
  let numLines = 1;
  if (maxW) {
    const lines = wrapText(text, fontSize, maxW);
    displayText = lines.join("\n");
    numLines = lines.length;
  }
  const w = maxW ?? textWidth(text, fontSize);
  const h = textHeight(fontSize, numLines);
  return {
    id: id(), type: "text",
    x: align === "center" ? cx - w / 2 : cx,
    y: cy - h / 2,
    width: w, height: h,
    strokeColor: color, backgroundColor: "transparent",
    fillStyle: "solid", strokeWidth: 1, strokeStyle: "solid",
    roughness: 1, opacity: 100, angle: 0,
    seed: seed(), version: 1, versionNonce: 0,
    isDeleted: false, groupIds: [], boundElements: [], link: null, locked: false,
    text: displayText, originalText: displayText,
    fontSize, fontFamily: 1,
    textAlign: align, verticalAlign: "middle",
    containerId: null, lineHeight: 1.35, roundness: null,
  };
}

function makeArrow(
  x1: number, y1: number, x2: number, y2: number,
  color = "#8182C1"
) {
  return {
    id: id(), type: "arrow",
    x: x1, y: y1,
    width: Math.abs(x2 - x1), height: Math.abs(y2 - y1),
    strokeColor: color, backgroundColor: "transparent",
    fillStyle: "solid", strokeWidth: 2, strokeStyle: "solid",
    roughness: 1, opacity: 100, angle: 0,
    seed: seed(), version: 1, versionNonce: 0,
    isDeleted: false, groupIds: [], boundElements: [], link: null, locked: false,
    points: [[0, 0], [x2 - x1, y2 - y1]],
    startBinding: null, endBinding: null,
    startArrowhead: null, endArrowhead: "arrow",
    roundness: { type: 2 },
  };
}

// ─── Spec types ───────────────────────────────────────────────────────────────

export type Step = { label: string; sublabel?: string };

export type DiagramSpec =
  | {
      pattern: "fork";
      start: Step;
      left: { heading: string; color: string; steps: Step[] };
      right: { heading: string; color: string; steps: Step[] };
      end?: Step;
    }
  | {
      pattern: "pipeline";
      steps: (Step & { color?: string })[];
    }
  | {
      pattern: "timeline";
      events: (Step & { marker?: string })[];
    };

// ─── Fork builder ─────────────────────────────────────────────────────────────

function buildFork(
  spec: Extract<DiagramSpec, { pattern: "fork" }>,
  canvasW: number,
  canvasH: number
) {
  const elements: ReturnType<typeof makeRect | typeof makeText | typeof makeArrow>[] = [];

  // Columns fill the full canvas width with a fixed gutter
  const EDGE = 40;
  const COL_GAP = 36;
  const BOX_W = Math.floor((canvasW - 2 * EDGE - COL_GAP) / 2);
  const TEXT_PAD = 18; // padding inside box on each side
  const textMaxW = BOX_W - TEXT_PAD * 2;
  const LABEL_FONT = 17;
  const BOX_H_MIN = 56;
  const SUBLABEL_FONT = 12;
  const SUBLABEL_AREA = 34; // reserved space below box for sublabel
  const ARROW_GAP = 18;     // gap between sublabel bottom and next arrow start
  const centerX = canvasW / 2;

  // Column centers
  const leftCX = EDGE + BOX_W / 2;
  const rightCX = EDGE + BOX_W + COL_GAP + BOX_W / 2;

  // Helper: compute dynamic box height from wrapped label
  function boxHeight(label: string): number {
    const lines = wrapText(label, LABEL_FONT, textMaxW);
    return Math.max(BOX_H_MIN, textHeight(LABEL_FONT, lines.length) + TEXT_PAD * 2);
  }

  let y = 60;

  // ── Start box ──
  const startBH = boxHeight(spec.start.label);
  const startW = Math.min(BOX_W, canvasW * 0.5);
  const startX = centerX - startW / 2;
  elements.push(makeRect(startX, y, startW, startBH, "#4ade80"));
  elements.push(makeText(spec.start.label, centerX, y + startBH / 2, LABEL_FONT + 2, "#f0edee", "center", startW - TEXT_PAD * 2));
  if (spec.start.sublabel) {
    elements.push(makeText(spec.start.sublabel, centerX, y + startBH + 16, SUBLABEL_FONT, "#7a7580"));
  }

  const forkY = y + startBH;
  y += startBH + 90;

  // ── Fork arrows (land at y, then headings below) ──
  elements.push(makeArrow(centerX, forkY, leftCX, y));
  elements.push(makeArrow(centerX, forkY, rightCX, y));

  // ── Column headings below arrow tips ──
  elements.push(makeText(spec.left.heading, leftCX, y + 20, 15, "#A3A4D8", "center", BOX_W));
  elements.push(makeText(spec.right.heading, rightCX, y + 20, 15, "#A3A4D8", "center", BOX_W));
  y += 50;

  // ── Steps ──
  const leftSteps = spec.left?.steps ?? [];
  const rightSteps = spec.right?.steps ?? [];
  const maxSteps = Math.max(leftSteps.length, rightSteps.length);

  // Pre-compute each row's height so rows stay aligned between columns
  const rowHeights: number[] = [];
  for (let i = 0; i < maxSteps; i++) {
    const lh = leftSteps[i] ? boxHeight(leftSteps[i].label) : BOX_H_MIN;
    const rh = rightSteps[i] ? boxHeight(rightSteps[i].label) : BOX_H_MIN;
    rowHeights.push(Math.max(lh, rh));
  }

  const rowStartYs: number[] = [];
  let rowY = y;
  for (let i = 0; i < maxSteps; i++) {
    rowStartYs.push(rowY);
    rowY += rowHeights[i] + SUBLABEL_AREA + ARROW_GAP + 10;
  }

  const leftBoxBottomYs: number[] = [];
  const rightBoxBottomYs: number[] = [];

  for (let i = 0; i < maxSteps; i++) {
    const stepY = rowStartYs[i];
    const bh = rowHeights[i];

    // Left step
    if (leftSteps[i]) {
      const s = leftSteps[i];
      elements.push(makeRect(EDGE, stepY, BOX_W, bh, spec.left?.color ?? "#f87171"));
      elements.push(makeText(s.label, leftCX, stepY + bh / 2, LABEL_FONT, "#f0edee", "center", textMaxW));
      if (s.sublabel) {
        elements.push(makeText(s.sublabel, leftCX, stepY + bh + 16, SUBLABEL_FONT, "#7a7580", "center", BOX_W));
      }
      if (i > 0) {
        const prevBH = rowHeights[i - 1];
        const prevHasSub = !!leftSteps[i - 1]?.sublabel;
        const fromY = rowStartYs[i - 1] + prevBH + (prevHasSub ? SUBLABEL_AREA - 4 : 8);
        elements.push(makeArrow(leftCX, fromY, leftCX, stepY));
      }
      leftBoxBottomYs.push(stepY + bh);
    }

    // Right step
    if (rightSteps[i]) {
      const s = rightSteps[i];
      const rightX = EDGE + BOX_W + COL_GAP;
      elements.push(makeRect(rightX, stepY, BOX_W, bh, spec.right?.color ?? "#4ade80"));
      elements.push(makeText(s.label, rightCX, stepY + bh / 2, LABEL_FONT, "#f0edee", "center", textMaxW));
      if (s.sublabel) {
        elements.push(makeText(s.sublabel, rightCX, stepY + bh + 16, SUBLABEL_FONT, "#7a7580", "center", BOX_W));
      }
      if (i > 0) {
        const prevBH = rowHeights[i - 1];
        const prevHasSub = !!rightSteps[i - 1]?.sublabel;
        const fromY = rowStartYs[i - 1] + prevBH + (prevHasSub ? SUBLABEL_AREA - 4 : 8);
        elements.push(makeArrow(rightCX, fromY, rightCX, stepY));
      }
      rightBoxBottomYs.push(stepY + bh);
    }
  }

  // ── End box (convergence) ──
  if (spec.end) {
    const lastRowBottom = rowStartYs[maxSteps - 1] + rowHeights[maxSteps - 1];
    const endY = lastRowBottom + SUBLABEL_AREA + 40;
    const endW = Math.min(BOX_W, canvasW * 0.5);
    const endX = centerX - endW / 2;
    const endBH = boxHeight(spec.end.label);
    elements.push(makeRect(endX, endY, endW, endBH, "#8182C1"));
    elements.push(makeText(spec.end.label, centerX, endY + endBH / 2, LABEL_FONT, "#f0edee", "center", endW - TEXT_PAD * 2));
    if (spec.end.sublabel) {
      elements.push(makeText(spec.end.sublabel, centerX, endY + endBH + 16, SUBLABEL_FONT, "#7a7580"));
    }
    const lastLeftY = leftBoxBottomYs[leftBoxBottomYs.length - 1] ?? endY;
    const lastRightY = rightBoxBottomYs[rightBoxBottomYs.length - 1] ?? endY;
    elements.push(makeArrow(leftCX, lastLeftY, centerX, endY));
    elements.push(makeArrow(rightCX, lastRightY, centerX, endY));
  }

  return elements;
}

// ─── Pipeline builder ─────────────────────────────────────────────────────────

function buildPipeline(
  spec: Extract<DiagramSpec, { pattern: "pipeline" }>,
  canvasW: number,
) {
  const elements: ReturnType<typeof makeRect | typeof makeText | typeof makeArrow>[] = [];
  const steps = spec.steps ?? [];
  const BOX_W = Math.min(220, (canvasW - 80) / Math.max(1, steps.length) - 40);
  const BOX_H = 64;
  const GAP = 40;
  const totalW = steps.length * BOX_W + (steps.length - 1) * GAP;
  let x = (canvasW - totalW) / 2;
  const y = 200;

  for (let i = 0; i < steps.length; i++) {
    const s = steps[i];
    const color = s.color ?? "#8182C1";
    const cx = x + BOX_W / 2;
    elements.push(makeRect(x, y, BOX_W, BOX_H, color));
    elements.push(makeText(s.label, cx, y + BOX_H / 2, 18, "#f0edee"));
    if (s.sublabel) {
      elements.push(makeText(s.sublabel, cx, y + BOX_H + 16, 12, "#7a7580"));
    }
    if (i > 0) {
      elements.push(makeArrow(x - GAP, y + BOX_H / 2, x, y + BOX_H / 2));
    }
    x += BOX_W + GAP;
  }

  return elements;
}

// ─── Timeline builder ─────────────────────────────────────────────────────────

function buildTimeline(
  spec: Extract<DiagramSpec, { pattern: "timeline" }>,
  canvasW: number,
) {
  const elements: ReturnType<typeof makeRect | typeof makeText | typeof makeArrow>[] = [];
  const events = spec.events ?? [];
  const n = events.length;
  const spacing = (canvasW - 80) / (n - 1 || 1);
  const lineY = 300;
  const startX = 40;

  // Horizontal line
  elements.push(makeArrow(startX, lineY, startX + spacing * (n - 1) + 20, lineY));

  for (let i = 0; i < n; i++) {
    const ev = events[i];
    const cx = startX + i * spacing;
    const above = i % 2 === 0;
    const boxY = above ? lineY - 100 : lineY + 30;

    elements.push(makeRect(cx - 70, boxY, 140, 56, "#8182C1"));
    elements.push(makeText(ev.label, cx, boxY + 28, 16, "#f0edee"));
    if (ev.sublabel) {
      elements.push(makeText(ev.sublabel, cx, boxY + (above ? -16 : 72), 12, "#7a7580"));
    }
    if (ev.marker) {
      elements.push(makeText(ev.marker, cx, lineY + (above ? 18 : -18), 13, "#A3A4D8"));
    }
    // Tick
    elements.push(makeArrow(cx, above ? boxY + 56 : lineY, cx, above ? lineY : boxY));
  }

  return elements;
}

// ─── Public entry point ───────────────────────────────────────────────────────

export function buildDiagram(
  spec: DiagramSpec,
  canvasW: number,
  canvasH: number,
): object {
  let elements: object[];

  if (spec.pattern === "fork") {
    elements = buildFork(spec, canvasW, canvasH);
  } else if (spec.pattern === "pipeline") {
    elements = buildPipeline(spec, canvasW);
  } else {
    elements = buildTimeline(spec, canvasW);
  }

  return {
    type: "excalidraw",
    version: 2,
    source: "https://excalidraw.com",
    elements,
    appState: { viewBackgroundColor: "#14141c", gridSize: 20 },
    files: {},
  };
}
