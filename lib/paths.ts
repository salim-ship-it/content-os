import path from "path";
import os from "os";

// Repo root = the project root (where package.json + next.config.ts live).
// In dev/build, process.cwd() is that directory.
export const REPO_ROOT = process.cwd();

// Vercel serverless filesystem is read-only except for os.tmpdir() (→ /tmp).
// Use it for anything we want to write from an API route.
const RUNTIME_TMP = os.tmpdir();

// Bundled seed data. Voice profile and pillars draft sit in /data/foundation
// at the repo root and ship with the deploy.
export const FOUNDATION_DIR = path.join(REPO_ROOT, "data/foundation");
export const VOICE_PROFILE_PATH = path.join(FOUNDATION_DIR, "voice-profile.md");
export const PILLARS_DRAFT_PATH = path.join(FOUNDATION_DIR, "pillars-draft.json");
export const POST_FORMATS_PATH = path.join(FOUNDATION_DIR, "post-formats.md");
export const CREATOR_STYLES_DIR = path.join(REPO_ROOT, "data/creator-styles");

// Per-user runtime state — kept in /tmp on the lambda.
export const CREATOR_INSIGHTS_DIR = path.join(RUNTIME_TMP, "creator-insights");
export const POST_COACH_DIR = path.join(RUNTIME_TMP, "post-coach");
