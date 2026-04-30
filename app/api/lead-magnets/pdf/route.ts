import { type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { getLeadMagnet } from "@/lib/lead-magnet-generate";

// Zero-dependency markdown → print-styled HTML. Client opens this in a new tab
// and uses the browser's "Save as PDF" dialog (auto-printed on load).

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function inlineMd(text: string): string {
  let out = escapeHtml(text);
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => `<a href="${escapeHtml(url)}">${label}</a>`);
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/(^|[\s(])\*([^*\s][^*]*?)\*(?=[\s).,;:!?]|$)/g, "$1<em>$2</em>");
  out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
  return out;
}

function markdownToHtml(md: string): string {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const html: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) { i++; continue; }

    let m;
    if ((m = line.match(/^###\s+(.*)/))) { html.push(`<h3>${inlineMd(m[1])}</h3>`); i++; continue; }
    if ((m = line.match(/^##\s+(.*)/))) { html.push(`<h2>${inlineMd(m[1])}</h2>`); i++; continue; }
    if ((m = line.match(/^#\s+(.*)/))) { html.push(`<h1>${inlineMd(m[1])}</h1>`); i++; continue; }

    if (line.startsWith("```")) {
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) { code.push(lines[i]); i++; }
      if (i < lines.length) i++;
      html.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
      continue;
    }

    if ((m = line.match(/^>\s?(.*)/))) {
      const q: string[] = [m[1]];
      i++;
      while (i < lines.length && lines[i].match(/^>\s?(.*)/)) {
        q.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      html.push(`<blockquote>${inlineMd(q.join(" "))}</blockquote>`);
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+(.*)/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
        i++;
      }
      html.push(`<ol>${items.map((it) => `<li>${inlineMd(it)}</li>`).join("")}</ol>`);
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+(.*)/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ""));
        i++;
      }
      html.push(`<ul>${items.map((it) => `<li>${inlineMd(it)}</li>`).join("")}</ul>`);
      continue;
    }

    if (/^(-{3,}|\*{3,})$/.test(line.trim())) {
      html.push("<hr>");
      i++;
      continue;
    }

    const para: string[] = [line];
    i++;
    while (
      i < lines.length && lines[i].trim() &&
      !/^#{1,3}\s/.test(lines[i]) &&
      !/^\s*[-*]\s/.test(lines[i]) &&
      !/^\s*\d+\.\s/.test(lines[i]) &&
      !/^>/.test(lines[i]) &&
      !lines[i].startsWith("```")
    ) {
      para.push(lines[i]);
      i++;
    }
    html.push(`<p>${inlineMd(para.join(" "))}</p>`);
  }

  return html.join("\n");
}

function renderPage(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<style>
  @page { margin: 22mm 20mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    color: #1a1a1a;
    font-size: 11.5pt;
    line-height: 1.55;
    max-width: 760px;
    margin: 0 auto;
    padding: 40px 48px;
    background: white;
  }
  h1 { font-size: 24pt; margin: 0 0 8pt; letter-spacing: -0.01em; }
  h2 { font-size: 16pt; margin: 22pt 0 8pt; border-bottom: 1px solid #eaeaea; padding-bottom: 4pt; }
  h3 { font-size: 13pt; margin: 16pt 0 6pt; color: #333; }
  p { margin: 0 0 10pt; }
  ul, ol { margin: 0 0 12pt; padding-left: 20pt; }
  li { margin: 3pt 0; }
  blockquote { border-left: 3px solid #f97316; padding: 6pt 12pt; margin: 10pt 0; color: #555; background: #fff7ed; }
  pre { background: #f5f5f5; padding: 10pt 12pt; border-radius: 4pt; overflow-x: auto; font-size: 10pt; }
  code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 10pt; background: #f5f5f5; padding: 1pt 4pt; border-radius: 3pt; }
  pre code { background: transparent; padding: 0; }
  hr { border: none; border-top: 1px solid #e5e5e5; margin: 16pt 0; }
  a { color: #d97706; }
  @media print {
    body { padding: 0; max-width: none; }
    a { color: inherit; text-decoration: none; }
  }
</style>
</head>
<body>
${bodyHtml}
<script>
  window.addEventListener("load", function() {
    setTimeout(function() { window.print(); }, 250);
  });
</script>
</body>
</html>`;
}

export async function GET(request: NextRequest) {
  const userId = await requireUser();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return new Response("id required", { status: 400 });

  const magnet = await getLeadMagnet(userId, id);
  if (!magnet) return new Response("not found", { status: 404 });

  const html = renderPage(magnet.title, markdownToHtml(magnet.content));
  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
