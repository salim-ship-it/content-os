import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { promises as fs } from "fs";
import path from "path";

async function getEnv(key: string): Promise<string> {
  if (process.env[key]) return process.env[key]!;
  try {
    const envPath = path.resolve(process.cwd(), ".env.local");
    const content = await fs.readFile(envPath, "utf-8");
    for (const line of content.split("\n")) {
      if (line.startsWith(`${key}=`)) {
        return line.split("=", 2)[1].trim().replace(/^['"]|['"]$/g, "");
      }
    }
  } catch { /* ignore */ }
  throw new Error(`Missing env var: ${key}`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _client: SupabaseClient<any> | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getSupabase(): Promise<SupabaseClient<any>> {
  if (_client) return _client;
  const url = await getEnv("SUPABASE_URL");
  const key = await getEnv("SUPABASE_SERVICE_JWT");
  _client = createClient(url, key);
  return _client;
}
