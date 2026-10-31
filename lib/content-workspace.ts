import { promises as fs } from "fs";
import path from "path";
import { REPO_ROOT } from "@/lib/paths";
import { readVoiceProfile } from "@/lib/voice-storage";

const DEFAULT_BRAND = "salim-sraj";

export type BrandIdentity = {
  name: string;
  title: string;
  location: string;
  description: string;
  expertise: string[];
  platforms: string[];
};

export type ContentWorkspace = {
  identity: BrandIdentity;
  voice: string;
  audience: string;
  pillars: string;
  evidence: string;
  guardrails: string;
  workflow: string;
};

async function readWorkspaceFile(
  workspaceDir: string,
  filename: string,
  fallback: string
): Promise<string> {
  try {
    return await fs.readFile(path.join(workspaceDir, filename), "utf-8");
  } catch {
    return fallback;
  }
}

async function readContentSkills(): Promise<string> {
  const skillsDir = path.join(REPO_ROOT, "skills", "linkedin-content");
  try {
    const referencesDir = path.join(skillsDir, "references");
    const entries = await fs.readdir(referencesDir, { withFileTypes: true });
    const filenames = entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b));

    const [orchestrator, ...references] = await Promise.all([
      fs.readFile(path.join(skillsDir, "SKILL.md"), "utf-8"),
      ...filenames.map((filename) => fs.readFile(path.join(referencesDir, filename), "utf-8")),
    ]);
    return [orchestrator, ...references].join("\n\n---\n\n");
  } catch {
    return "Ask for evidence, write one clear idea, and verify the result before delivery.";
  }
}

export async function loadContentWorkspace(userId: string): Promise<ContentWorkspace> {
  const brand = process.env.CONTENT_OS_BRAND || DEFAULT_BRAND;
  const workspaceDir = path.join(REPO_ROOT, "data", "brands", brand);

  const [identityRaw, storedVoice, bundledVoice, audience, pillars, evidence, guardrails, workflow] =
    await Promise.all([
      readWorkspaceFile(workspaceDir, "identity.json", "{}"),
      readVoiceProfile(userId),
      readWorkspaceFile(workspaceDir, "voice.md", "No voice profile configured."),
      readWorkspaceFile(workspaceDir, "audience.md", "No audience profile configured."),
      readWorkspaceFile(workspaceDir, "pillars.md", "No content pillars configured."),
      readWorkspaceFile(workspaceDir, "evidence.json", "[]"),
      readWorkspaceFile(workspaceDir, "guardrails.md", "No additional guardrails configured."),
      readContentSkills(),
    ]);

  let identity: BrandIdentity;
  try {
    identity = JSON.parse(identityRaw) as BrandIdentity;
  } catch {
    throw new Error(`Invalid identity.json for content brand: ${brand}`);
  }

  if (!identity.name) {
    throw new Error(`Content brand '${brand}' is missing a valid identity.json`);
  }

  return {
    identity,
    voice: storedVoice?.trim() || bundledVoice,
    audience,
    pillars,
    evidence,
    guardrails,
    workflow,
  };
}
