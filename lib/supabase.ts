import { createClient } from "@supabase/supabase-js";
import { promises as fs } from "fs";
import path from "path";

async function getEnv(key: string): Promise<string> {
  if (process.env[key]) return process.env[key]!;
  try {
    const envPath = path.resolve(process.cwd(), "../../../../.env.local");
    const content = await fs.readFile(envPath, "utf-8");
    for (const line of content.split("\n")) {
      if (line.startsWith(`${key}=`)) {
        return line.split("=", 2)[1].trim().replace(/^['"]|['"]$/g, "");
      }
    }
  } catch { /* ignore */ }
  throw new Error(`Missing env var: ${key}`);
}

let _client: ReturnType<typeof createClient> | null = null;

export async function getSupabase() {
  if (_client) return _client;
  const url = await getEnv("SUPABASE_URL");
  const key = await getEnv("SUPABASE_SERVICE_JWT");
  _client = createClient(url, key);
  return _client;
}
