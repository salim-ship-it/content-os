import { promises as fs } from "fs";
import path from "path";
import { getSupabase } from "./supabase";

const BUCKET = "post-images";

let _supabaseUrl: string | null = null;
async function getSupabaseUrl(): Promise<string> {
  if (_supabaseUrl) return _supabaseUrl;
  const fromEnv =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  if (fromEnv) return (_supabaseUrl = fromEnv);
  try {
    const envPath = path.resolve(process.cwd(), ".env.local");
    const content = await fs.readFile(envPath, "utf-8");
    for (const line of content.split("\n")) {
      if (line.startsWith("SUPABASE_URL=")) {
        return (_supabaseUrl = line.split("=", 2)[1].trim().replace(/^['"]|['"]$/g, ""));
      }
    }
  } catch { /* ignore */ }
  throw new Error("SUPABASE_URL not configured");
}

export type ArchiveResult =
  | { ok: true; permanentUrl: string }
  | { ok: false; error: string; expired?: boolean };

async function publicUrl(filePath: string): Promise<string> {
  const base = await getSupabaseUrl();
  return `${base}/storage/v1/object/public/${BUCKET}/${filePath}`;
}

function extFromContentType(ct: string | null): string {
  if (!ct) return "jpg";
  if (ct.includes("png")) return "png";
  if (ct.includes("webp")) return "webp";
  if (ct.includes("gif")) return "gif";
  return "jpg";
}

export function isLinkedInCdnUrl(url: string | null | undefined): boolean {
  return !!url && url.includes("media.licdn.com");
}

export function isAlreadyArchived(url: string | null | undefined): boolean {
  return !!url && url.includes(`/storage/v1/object/public/${BUCKET}/`);
}

export async function archiveImageUrl(
  postId: string,
  sourceUrl: string
): Promise<ArchiveResult> {
  if (!postId) return { ok: false, error: "missing postId" };
  if (!sourceUrl) return { ok: false, error: "missing sourceUrl" };
  if (isAlreadyArchived(sourceUrl)) {
    return { ok: true, permanentUrl: sourceUrl };
  }

  let res: Response;
  try {
    res = await fetch(sourceUrl, { redirect: "follow" });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "fetch failed" };
  }

  if (!res.ok) {
    const expired = res.status === 403 || res.status === 410;
    return { ok: false, error: `HTTP ${res.status}`, expired };
  }

  const contentType = res.headers.get("content-type");
  const ext = extFromContentType(contentType);
  const bytes = new Uint8Array(await res.arrayBuffer());
  if (bytes.byteLength < 200) {
    return { ok: false, error: `tiny payload (${bytes.byteLength} bytes)` };
  }

  const supabase = await getSupabase();
  const path = `${postId}.${ext}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, bytes, {
      contentType: contentType || "image/jpeg",
      upsert: true,
    });
  if (error) return { ok: false, error: `upload: ${error.message}` };

  return { ok: true, permanentUrl: await publicUrl(path) };
}

type RowToArchive = { id: string; image_url: string };

export async function archivePendingPosts(opts: { batchSize?: number } = {}): Promise<{
  scanned: number;
  archived: number;
  expired: number;
  failed: number;
}> {
  const limit = opts.batchSize ?? 50;
  const supabase = await getSupabase();

  const { data, error } = await supabase
    .from("content_posts")
    .select("id, image_url")
    .like("image_url", "%media.licdn.com%")
    .limit(limit);

  if (error) throw new Error(`scan failed: ${error.message}`);
  const rows: RowToArchive[] = (data ?? []) as RowToArchive[];

  let archived = 0;
  let expired = 0;
  let failed = 0;

  for (const row of rows) {
    const result = await archiveImageUrl(row.id, row.image_url);
    if (result.ok) {
      const { error: upErr } = await supabase
        .from("content_posts")
        .update({ image_url: result.permanentUrl })
        .eq("id", row.id);
      if (upErr) {
        failed++;
        console.error(`update ${row.id}: ${upErr.message}`);
        continue;
      }
      archived++;
    } else if (result.expired) {
      // URL is dead — clear it so the UI shows a clean placeholder instead of
      // a broken image. The post text remains intact.
      const { error: upErr } = await supabase
        .from("content_posts")
        .update({ image_url: "" })
        .eq("id", row.id);
      if (upErr) console.error(`clear ${row.id}: ${upErr.message}`);
      expired++;
    } else {
      failed++;
      console.error(`archive ${row.id}: ${result.error}`);
    }
  }

  return { scanned: rows.length, archived, expired, failed };
}
