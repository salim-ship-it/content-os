// Programmatic Excalidraw builder — freeform node-graph on a column grid.
// Claude returns a DiagramSpec (nodes + edges). This module computes all
// geometry and produces valid Excalidraw v2 JSON with correct text dimensions.

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
  col: number;
  row: number;
  colspan?: number;
};

export type DiagramEdge = {
  from: string;
  to: string;
  color?: string;
};

export type DiagramHeading = {
  col: number;
  label: string;
  sublabel?: string;
  color: string;
};

export type DiagramSpec = {
  cols: number;
  headings?: DiagramHeading[];
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

  const EDGE = 40;
  const COL_GAP = 28;
  const ROW_GAP = 28;
  const TEXT_PAD = 14;
  const BOX_H_MIN = 52;
  const LABEL_FONT = 16;
  const SUBLABEL_FONT = 11;
  const STAT_FONT = 13;
  const HEADING_FONT = 26;
  const SUBHEADING_FONT = 12;

  const cols = Math.max(1, Math.min(5, spec.cols || 1));
  const colW = Math.floor((canvasW - 2 * EDGE - COL_GAP * (cols - 1)) / cols);
  const nodes = spec.nodes ?? [];
  const edges = spec.edges ?? [];
  const headings = spec.headings ?? [];

  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  // ── Column helpers ──
  function nSpan(n: DiagramNode) { return Math.max(1, Math.min(cols - n.col, n.colspan ?? 1)); }
  function nW(n: DiagramNode) { return nSpan(n) * colW + (nSpan(n) - 1) * COL_GAP; }
  function nX(n: DiagramNode) { return EDGE + n.col * (colW + COL_GAP); }
  function nCX(n: DiagramNode) { return nX(n) + nW(n) / 2; }
  function nTextW(n: DiagramNode) { return nW(n) - TEXT_PAD * 2; }
  function nBoxH(n: DiagramNode) {
    const lines = wrapText(n.label, LABEL_FONT, nTextW(n));
    return Math.max(BOX_H_MIN, textHeight(LABEL_FONT, lines.length) + TEXT_PAD * 2);
  }
  function nExtraH(n: DiagramNode) {
    let h = 0;
    if (n.sublabel) h += textHeight(SUBLABEL_FONT) + 8;
    if (n.stat) h += textHeight(STAT_FONT) + 6;
    return h;
  }
  function nTotalH(n: DiagramNode) { return nBoxH(n) + nExtraH(n) + 10; }

  // ── Row heights ──
  const maxRow = nodes.reduce((m, n) => Math.max(m, n.row ?? 0), 0);
  const rowH: number[] = new Array(maxRow + 1).fill(BOX_H_MIN + 10);
  for (const n of nodes) {
    const r = n.row ?? 0;
    rowH[r] = Math.max(rowH[r], nTotalH(n));
  }

  // ── Start Y (after headings) ──
  let startY = 50;
  if (headings.length > 0) {
    const maxHH = headings.reduce((m, h) => {
      const lines = wrapText(h.label, HEADING_FONT, colW);
      return Math.max(m, textHeight(HEADING_FONT, lines.length) + (h.sublabel ? 26 : 8) + 20);
    }, 60);

    for (const h of headings) {
      const hx = EDGE + (h.col ?? 0) * (colW + COL_GAP);
      const hcx = hx + colW / 2;
      let hy = startY;
      elements.push(makeText(h.label, hcx, hy, HEADING_FONT, h.color, "center", colW));
      hy += textHeight(HEADING_FONT, wrapText(h.label, HEADING_FONT, colW).length) + 4;
      if (h.sublabel) {
        elements.push(makeText(h.sublabel, hcx, hy, SUBHEADING_FONT, "#7a7580", "center", colW));
      }
    }
    startY += maxHH;
  }

  // ── Row Y positions ──
  const rowY: number[] = [];
  let y = startY;
  for (let r = 0; r <= maxRow; r++) {
    rowY.push(y);
    y += rowH[r] + ROW_GAP;
  }

  // ── Draw nodes, track anchor points for edges ──
  const anchorTop = new Map<string, number>();
  const anchorBottom = new Map<string, number>();
  const anchorLeft = new Map<string, number>();
  const anchorRight = new Map<string, number>();
  const anchorCY = new Map<string, number>();

  for (const n of nodes) {
    const r = n.row ?? 0;
    const x = nX(n);
    const w = nW(n);
    const bh = nBoxH(n);
    const ny = rowY[r];
    const cx = nCX(n);

    elements.push(makeRect(x, ny, w, bh, n.color));
    elements.push(makeText(n.label, cx, ny + bh / 2, LABEL_FONT, "#f0edee", "center", nTextW(n)));

    let ey = ny + bh + 8;
    if (n.sublabel) {
      elements.push(makeText(n.sublabel, cx, ey, SUBLABEL_FONT, "#7a7580", "center", w));
      ey += textHeight(SUBLABEL_FONT) + 6;
    }
    if (n.stat) {
      elements.push(makeText(n.stat, cx, ey, STAT_FONT, n.color, "center", w));
      ey += textHeight(STAT_FONT) + 4;
    }

    anchorTop.set(n.id, ny);
    anchorBottom.set(n.id, ey - 2);
    anchorLeft.set(n.id, x);
    anchorRight.set(n.id, x + w);
    anchorCY.set(n.id, ny + bh / 2);
  }

  // ── Draw edges ──
  for (const e of edges) {
    const from = nodeMap.get(e.from);
    const to = nodeMap.get(e.to);
    if (!from || !to) continue;

    const color = e.color ?? "#8182C1";
    const fx = nCX(from);
    const tx = nCX(to);
    const fRow = from.row ?? 0;
    const tRow = to.row ?? 0;

    if (fRow < tRow) {
      // Down
      elements.push(makeArrow(fx, anchorBottom.get(e.from)!, tx, anchorTop.get(e.to)!, color));
    } else if (fRow > tRow) {
      // Up (back-edge)
      elements.push(makeArrow(fx, anchorTop.get(e.from)!, tx, anchorBottom.get(e.to)!, color));
    } else {
      // Same row — horizontal
      const fCY = anchorCY.get(e.from)!;
      const tCY = anchorCY.get(e.to)!;
      if ((from.col ?? 0) < (to.col ?? 0)) {
        elements.push(makeArrow(anchorRight.get(e.from)!, fCY, anchorLeft.get(e.to)!, tCY, color));
      } else {
        elements.push(makeArrow(anchorLeft.get(e.from)!, fCY, anchorRight.get(e.to)!, tCY, color));
      }
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
