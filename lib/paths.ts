import path from "path";
import os from "os";

export const REPO_ROOT = path.resolve(process.cwd(), "../../../..");

// Vercel serverless filesystem is read-only except for os.tmpdir() (→ /tmp).
// Use it for anything we want to write from an API route.
const RUNTIME_TMP = os.tmpdir();

export const WATCHLIST_PATH = path.join(
  REPO_ROOT, "content-os/idea-engine/watchlist.json"
);
export const IDEA_CAPTURE_PATH = path.join(
  REPO_ROOT, "content-os/idea-engine/idea-capture.md"
);
export const FOUNDATION_DIR = path.join(REPO_ROOT, "content-os/foundation");
export const VOICE_DRAFT_PATH = path.join(FOUNDATION_DIR, "voice-draft.json");
export const VOICE_PROFILE_PATH = path.join(FOUNDATION_DIR, "voice-profile.md");
export const PILLARS_DRAFT_PATH = path.join(FOUNDATION_DIR, "pillars-draft.json");
export const CONTENT_PILLARS_PATH = path.join(FOUNDATION_DIR, "content-pillars.md");
export const ONBOARDING_PATH = path.join(FOUNDATION_DIR, "onboarding.json");
export const CREATOR_INSIGHTS_DIR = path.join(RUNTIME_TMP, "creator-insights");
export const POST_COACH_DIR = path.join(RUNTIME_TMP, "post-coach");
