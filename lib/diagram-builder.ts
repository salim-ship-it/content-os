// Programmatic Excalidraw builder.
// Claude returns a structured DiagramSpec; this module converts it to valid
// Excalidraw v2 JSON with correct text dimensions — no text-rendering bugs.

let _seed = 1;
function seed() { return ++_seed * 100003; }
function id() { return Math.random().toString(36).slice(2, 10); }

// Approximate rendered width for Virgil (fontFamily 1) at a given fontSize.
// Rule of thumb: ~0.55 × fontSize per character.
function textWidth(text: string, fontSize: number): number {
  return Math.max(40, Math.ceil(text.length * fontSize * 0.58));
}
function textHeight(fontSize: number, lines = 1): number {
  return Math.ceil(fontSize * 1.35 * lines);
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
  align: "center" | "left" = "center"
) {
  const w = textWidth(text, fontSize);
  const h = textHeight(fontSize);
  return {
    id: id(), type: "text",
    x: align === "center" ? cx - w / 2 : cx,
    y: cy - h / 2,
    width: w, height: h,
    strokeColor: "transparent", backgroundColor: "transparent",
    fillStyle: "solid", strokeWidth: 1, strokeStyle: "solid",
    roughness: 1, opacity: 100, angle: 0,
    seed: seed(), version: 1, versionNonce: 0,
    isDeleted: false, groupIds: [], boundElements: [], link: null, locked: false,
    text, originalText: text,
    fontSize, fontFamily: 1,
    textAlign: align, verticalAlign: "middle",
    containerId: null, lineHeight: 1.25, roundness: null,
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

  const BOX_W = Math.min(300, canvasW * 0.28);
  const BOX_H = 64;
  const ROW_GAP = 100;
  const COL_GAP = canvasW * 0.06;
  const centerX = canvasW / 2;

  let y = 60;

  // ── Start box ──
  const startX = centerX - BOX_W / 2;
  elements.push(makeRect(startX, y, BOX_W, BOX_H, "#4ade80"));
  elements.push(makeText(spec.start.label, centerX, y + BOX_H / 2, 20, "#f0edee"));
  if (spec.start.sublabel) {
    elements.push(makeText(spec.start.sublabel, centerX, y + BOX_H + 18, 13, "#7a7580"));
  }

  const forkY = y + BOX_H;
  y += BOX_H + 50;

  // Column X centres
  const leftCX = centerX - COL_GAP / 2 - BOX_W / 2;
  const rightCX = centerX + COL_GAP / 2 + BOX_W / 2;

  // ── Column headings ──
  elements.push(makeText(spec.left.heading, leftCX, y, 22, "#A3A4D8"));
  elements.push(makeText(spec.right.heading, rightCX, y, 22, "#A3A4D8"));
  y += 36;

  // ── Fork arrows from start box ──
  const startCX = centerX;
  const startBottomY = forkY;
  elements.push(makeArrow(startCX, startBottomY, leftCX, y));
  elements.push(makeArrow(startCX, startBottomY, rightCX, y));

  // ── Steps ──
  const leftSteps = spec.left?.steps ?? [];
  const rightSteps = spec.right?.steps ?? [];
  const maxSteps = Math.max(leftSteps.length, rightSteps.length);
  const leftBoxBottomYs: number[] = [];
  const rightBoxBottomYs: number[] = [];

  for (let i = 0; i < maxSteps; i++) {
    const stepY = y + i * ROW_GAP;

    // Left step
    if (leftSteps[i]) {
      const s = leftSteps[i];
      const bx = leftCX - BOX_W / 2;
      elements.push(makeRect(bx, stepY, BOX_W, BOX_H, spec.left?.color ?? "#f87171"));
      elements.push(makeText(s.label, leftCX, stepY + BOX_H / 2, 18, "#f0edee"));
      if (s.sublabel) {
        elements.push(makeText(s.sublabel, leftCX, stepY + BOX_H + 16, 12, "#7a7580"));
      }
      if (i > 0) {
        elements.push(makeArrow(leftCX, stepY - ROW_GAP + BOX_H, leftCX, stepY));
      }
      leftBoxBottomYs.push(stepY + BOX_H);
    }

    // Right step
    if (rightSteps[i]) {
      const s = rightSteps[i];
      const bx = rightCX - BOX_W / 2;
      elements.push(makeRect(bx, stepY, BOX_W, BOX_H, spec.right?.color ?? "#4ade80"));
      elements.push(makeText(s.label, rightCX, stepY + BOX_H / 2, 18, "#f0edee"));
      if (s.sublabel) {
        elements.push(makeText(s.sublabel, rightCX, stepY + BOX_H + 16, 12, "#7a7580"));
      }
      if (i > 0) {
        elements.push(makeArrow(rightCX, stepY - ROW_GAP + BOX_H, rightCX, stepY));
      }
      rightBoxBottomYs.push(stepY + BOX_H);
    }
  }

  // ── End box (convergence) ──
  if (spec.end) {
    const lastY = y + (maxSteps - 1) * ROW_GAP + BOX_H + 60;
    const endX = centerX - BOX_W / 2;
    elements.push(makeRect(endX, lastY, BOX_W, BOX_H, "#8182C1"));
    elements.push(makeText(spec.end.label, centerX, lastY + BOX_H / 2, 18, "#f0edee"));
    if (spec.end.sublabel) {
      elements.push(makeText(spec.end.sublabel, centerX, lastY + BOX_H + 16, 12, "#7a7580"));
    }
    const lastLeftY = leftBoxBottomYs[leftBoxBottomYs.length - 1] ?? lastY;
    const lastRightY = rightBoxBottomYs[rightBoxBottomYs.length - 1] ?? lastY;
    elements.push(makeArrow(leftCX, lastLeftY, centerX, lastY));
    elements.push(makeArrow(rightCX, lastRightY, centerX, lastY));
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
