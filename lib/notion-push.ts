const NOTION_VERSION = "2022-06-28";
const NOTION_API = "https://api.notion.com/v1";

type RichText = { type: "text"; text: { content: string; link?: { url: string } | null } };
type Block = Record<string, unknown>;

function rt(text: string): RichText[] {
  if (!text) return [];
  const out: RichText[] = [];
  const linkRe = /\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = linkRe.exec(text)) !== null) {
    if (m.index > last) {
      out.push({ type: "text", text: { content: text.slice(last, m.index) } });
    }
    out.push({ type: "text", text: { content: m[1], link: { url: m[2] } } });
    last = m.index + m[0].length;
  }
  if (last < text.length) {
    out.push({ type: "text", text: { content: text.slice(last) } });
  }
  return out;
}

export function markdownToBlocks(markdown: string): Block[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) { i++; continue; }

    const h3 = line.match(/^###\s+(.*)/);
    if (h3) {
      blocks.push({ object: "block", type: "heading_3", heading_3: { rich_text: rt(h3[1]) } });
      i++; continue;
    }
    const h2 = line.match(/^##\s+(.*)/);
    if (h2) {
      blocks.push({ object: "block", type: "heading_2", heading_2: { rich_text: rt(h2[1]) } });
      i++; continue;
    }
    const h1 = line.match(/^#\s+(.*)/);
    if (h1) {
      blocks.push({ object: "block", type: "heading_1", heading_1: { rich_text: rt(h1[1]) } });
      i++; continue;
    }

    if (line.startsWith("```")) {
      const lang = line.slice(3).trim() || "plain text";
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++;
      blocks.push({
        object: "block",
        type: "code",
        code: {
          rich_text: [{ type: "text", text: { content: codeLines.join("\n") } }],
          language: mapLang(lang),
        },
      });
      continue;
    }

    const quote = line.match(/^>\s?(.*)/);
    if (quote) {
      blocks.push({ object: "block", type: "quote", quote: { rich_text: rt(quote[1]) } });
      i++; continue;
    }

    const numbered = line.match(/^\s*\d+\.\s+(.*)/);
    if (numbered) {
      blocks.push({
        object: "block",
        type: "numbered_list_item",
        numbered_list_item: { rich_text: rt(numbered[1]) },
      });
      i++; continue;
    }

    const bullet = line.match(/^\s*[-*]\s+(.*)/);
    if (bullet) {
      blocks.push({
        object: "block",
        type: "bulleted_list_item",
        bulleted_list_item: { rich_text: rt(bullet[1]) },
      });
      i++; continue;
    }

    if (/^(-{3,}|\*{3,})$/.test(line.trim())) {
      blocks.push({ object: "block", type: "divider", divider: {} });
      i++; continue;
    }

    const paraLines: string[] = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^#{1,3}\s/.test(lines[i]) &&
      !/^\s*[-*]\s/.test(lines[i]) &&
      !/^\s*\d+\.\s/.test(lines[i]) &&
      !/^>/.test(lines[i]) &&
      !lines[i].startsWith("```")
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    blocks.push({
      object: "block",
      type: "paragraph",
      paragraph: { rich_text: rt(paraLines.join(" ")) },
    });
  }

  return blocks;
}

function mapLang(lang: string): string {
  const valid = new Set([
    "abap", "arduino", "bash", "basic", "c", "clojure", "coffeescript", "c++", "c#", "css", "dart",
    "diff", "docker", "elixir", "elm", "erlang", "flow", "fortran", "f#", "gherkin", "glsl", "go",
    "graphql", "groovy", "haskell", "html", "java", "javascript", "json", "julia", "kotlin", "latex",
    "less", "lisp", "livescript", "lua", "makefile", "markdown", "markup", "matlab", "mermaid",
    "nix", "objective-c", "ocaml", "pascal", "perl", "php", "plain text", "powershell", "prolog",
    "protobuf", "python", "r", "reason", "ruby", "rust", "sass", "scala", "scheme", "scss", "shell",
    "sql", "swift", "typescript", "vb.net", "verilog", "vhdl", "visual basic", "webassembly", "xml",
    "yaml", "java/c/c++/c#",
  ]);
  const l = lang.toLowerCase();
  if (l === "ts") return "typescript";
  if (l === "js") return "javascript";
  if (l === "py") return "python";
  if (l === "sh") return "shell";
  if (l === "md") return "markdown";
  return valid.has(l) ? l : "plain text";
}

export type PushResult = { pageId: string; pageUrl: string };

export async function pushToNotion(
  title: string,
  markdown: string,
): Promise<PushResult> {
  const apiKey = process.env.NOTION_API_KEY;
  const parentPageId = process.env.NOTION_PARENT_PAGE_ID;
  if (!apiKey) throw new Error("NOTION_API_KEY not configured");
  if (!parentPageId) throw new Error("NOTION_PARENT_PAGE_ID not configured");

  const blocks = markdownToBlocks(markdown);
  const first = blocks.slice(0, 100);
  const rest = blocks.slice(100);

  const createRes = await fetch(`${NOTION_API}/pages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      parent: { page_id: parentPageId.replace(/-/g, "") },
      properties: {
        title: { title: [{ type: "text", text: { content: title || "Untitled" } }] },
      },
      children: first,
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Notion create failed ${createRes.status}: ${err.slice(0, 300)}`);
  }

  const page = await createRes.json();
  const pageId: string = page.id;

  for (let offset = 0; offset < rest.length; offset += 100) {
    const chunk = rest.slice(offset, offset + 100);
    const appendRes = await fetch(`${NOTION_API}/blocks/${pageId}/children`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ children: chunk }),
    });
    if (!appendRes.ok) {
      const err = await appendRes.text();
      throw new Error(`Notion append failed ${appendRes.status}: ${err.slice(0, 300)}`);
    }
  }

  return { pageId, pageUrl: page.url };
}
