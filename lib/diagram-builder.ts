// Programmatic Excalidraw builder — free-position node graph.
// Claude places nodes at x/y (% of canvas), picks shapes and colors.
// This module handles all text sizing, wrapping, and arrow routing.

let _seed = 1;
function seed() { return ++_seed * 100003; }
function id() { return Math.random().toString(36).slice(2, 10); }

function textWidth(text: string, fontSize: number): number {
  return Math.max(40, Math.ceil(text.length * fontSize * 0.58));
}
function textHeight(fontSize: number, lines = 1): number {
  return Math.ceil(fontSize * 1.4 * lines);
}
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

function makeEllipse(
  x: number, y: number, w: number, h: number,
  strokeColor: string, fill = "transparent"
) {
  return {
    id: id(), type: "ellipse",
    x, y, width: w, height: h,
    strokeColor, backgroundColor: fill,
    fillStyle: "solid", strokeWidth: 2, strokeStyle: "dotted",
    roughness: 2, opacity: 100, angle: 0,
    seed: seed(), version: 1, versionNonce: 0,
    isDeleted: false, groupIds: [], boundElements: [], link: null, locked: false,
    roundness: { type: 2 },
  };
}

function makeText(
  text: string, cx: number, cy: number,
  fontSize: number, color: string,
  align: "center" | "left" = "center",
  maxW?: number
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

export type DiagramNode = {
  id: string;
  label: string;
  sublabel?: string;
  stat?: string;
  color: string;
  x: number;           // center x, 0–100 (% of canvas width)
  y: number;           // center y, 0–100 (% of canvas height)
  w?: number;          // optional width, 0–100 (% of canvas width). Default: auto from text.
  shape?: "box" | "circle";  // default: box
};

export type DiagramEdge = {
  from: string;
  to: string;
  color?: string;
  label?: string;
};

export type DiagramSpec = {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
};

// ─── Builder ──────────────────────────────────────────────────────────────────

export function buildDiagram(
  spec: DiagramSpec,
  canvasW: number,
  canvasH: number,
): object {
  const elements: object[] = [];

  const LABEL_FONT = 16;
  const SUBLABEL_FONT = 11;
  const STAT_FONT = 13;
  const TEXT_PAD = 14;
  const BOX_H_MIN = 52;

  const nodes = spec.nodes ?? [];
  const edges = spec.edges ?? [];

  // Per-node computed geometry
  type NodeGeo = {
    cx: number; cy: number;
    w: number; h: number;
    bx: number; by: number; // top-left of box
    totalH: number; // box + sublabel/stat area
  };
  const geo = new Map<string, NodeGeo>();

  for (const n of nodes) {
    const cx = (n.x / 100) * canvasW;
    const cy = (n.y / 100) * canvasH;

    // Width: explicit or auto-computed from text
    const autoW = Math.min(
      canvasW * 0.38,
      Math.max(140, textWidth(n.label, LABEL_FONT) + TEXT_PAD * 2)
    );
    const w = n.w ? (n.w / 100) * canvasW : autoW;
    const textMaxW = w - TEXT_PAD * 2;

    const labelLines = wrapText(n.label, LABEL_FONT, textMaxW);
    const labelH = textHeight(LABEL_FONT, labelLines.length);
    const boxH = Math.max(BOX_H_MIN, labelH + TEXT_PAD * 2);

    let extraH = 0;
    if (n.sublabel) extraH += textHeight(SUBLABEL_FONT) + 8;
    if (n.stat) extraH += textHeight(STAT_FONT) + 6;

    geo.set(n.id, {
      cx, cy,
      w, h: boxH,
      bx: cx - w / 2,
      by: cy - boxH / 2,
      totalH: boxH + extraH + 8,
    });
  }

  // Draw nodes
  for (const n of nodes) {
    const g = geo.get(n.id)!;
    const { cx, cy, w, h, bx, by } = g;
    const textMaxW = w - TEXT_PAD * 2;
    const shape = n.shape ?? "box";

    if (shape === "circle") {
      elements.push(makeEllipse(bx, by, w, h, n.color));
    } else {
      elements.push(makeRect(bx, by, w, h, n.color));
    }
    elements.push(makeText(n.label, cx, cy, LABEL_FONT, "#f0edee", "center", textMaxW));

    let ey = by + h + 8;
    if (n.sublabel) {
      elements.push(makeText(n.sublabel, cx, ey, SUBLABEL_FONT, "#7a7580", "center", w));
      ey += textHeight(SUBLABEL_FONT) + 6;
    }
    if (n.stat) {
      elements.push(makeText(n.stat, cx, ey, STAT_FONT, n.color, "center", w));
    }
  }

  // Draw edges with smart routing: pick nearest facing edges
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  for (const e of edges) {
    const from = nodeMap.get(e.from);
    const to = nodeMap.get(e.to);
    const fg = geo.get(e.from);
    const tg = geo.get(e.to);
    if (!from || !to || !fg || !tg) continue;

    const color = e.color ?? "#8182C1";
    const dx = tg.cx - fg.cx;
    const dy = tg.cy - fg.cy;
    const angle = Math.atan2(dy, dx); // radians

    // Pick exit point on source box edge
    function edgePoint(g: NodeGeo, outward: number): [number, number] {
      const a = outward;
      const halfW = g.w / 2;
      const halfH = g.h / 2;
      // Check which edge the angle hits
      if (Math.abs(Math.tan(a)) < halfH / halfW) {
        // Left or right edge
        const side = Math.cos(a) > 0 ? 1 : -1;
        return [g.cx + side * halfW, g.cy + Math.tan(a) * side * halfW];
      } else {
        // Top or bottom edge
        const side = Math.sin(a) > 0 ? 1 : -1;
        return [g.cx + (side * halfH) / Math.tan(a), g.cy + side * halfH];
      }
    }

    const [x1, y1] = edgePoint(fg, angle);
    const [x2, y2] = edgePoint(tg, angle + Math.PI);

    elements.push(makeArrow(x1, y1, x2, y2, color));

    if (e.label) {
      const mx = (x1 + x2) / 2;
      const my = (y1 + y2) / 2;
      elements.push(makeText(e.label, mx, my, 11, "#7a7580"));
    }
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
