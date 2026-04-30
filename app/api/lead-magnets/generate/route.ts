import { type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import {
  generateLeadMagnet,
  saveLeadMagnet,
  type AssetType,
  type OutputFormat,
  ASSET_TYPES,
  OUTPUT_FORMATS,
} from "@/lib/lead-magnet-generate";

export const maxDuration = 300;

const VALID_FORMATS = new Set<OutputFormat>(OUTPUT_FORMATS.map((f) => f.id));
const VALID_TYPES = new Set<AssetType>(ASSET_TYPES);

export async function POST(request: NextRequest) {
  const userId = await requireUser();
  const body = await request.json().catch(() => null);
  if (!body) return Response.json({ error: "Invalid JSON" }, { status: 400 });

  const title = String(body.title ?? "").trim();
  const topic = String(body.topic ?? "").trim();
  const audience = String(body.audience ?? "").trim();
  const assetType = body.assetType as AssetType;
  const outputFormat = body.outputFormat as OutputFormat;
  const angle = body.angle ? String(body.angle).trim() : undefined;
  const context = body.context ? String(body.context).trim() : undefined;
  const ctaType = body.ctaType ? String(body.ctaType) : undefined;
  const ctaDestination = body.ctaDestination ? String(body.ctaDestination).trim() : undefined;
  const sections = Array.isArray(body.sections) ? body.sections.map(String) : [];

  if (!title) return Response.json({ error: "title required" }, { status: 400 });
  if (!topic) return Response.json({ error: "topic required" }, { status: 400 });
  if (!audience) return Response.json({ error: "audience required" }, { status: 400 });
  if (!VALID_TYPES.has(assetType)) {
    return Response.json({ error: "invalid assetType" }, { status: 400 });
  }
  if (!VALID_FORMATS.has(outputFormat)) {
    return Response.json({ error: "invalid outputFormat" }, { status: 400 });
  }
  if (sections.length === 0) {
    return Response.json({ error: "at least one section required" }, { status: 400 });
  }

  try {
    const input = {
      title, topic, audience, assetType, outputFormat, angle, context, sections,
      ctaType: ctaType as import("@/lib/lead-magnet-generate").CtaType | undefined,
      ctaDestination,
    };
    const content = await generateLeadMagnet(userId, input);
    const stored = await saveLeadMagnet(userId, input, content);
    return Response.json({ ok: true, magnet: stored });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ error: msg }, { status: 500 });
  }
}
