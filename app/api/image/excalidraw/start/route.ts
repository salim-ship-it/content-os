import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { inngest } from "@/lib/inngest";

// Creates an image_jobs row, fires the Inngest event, and returns the jobId
// so the client can poll /api/image/excalidraw/status/[id] until done.
//
// This route returns in <1s — the heavy Claude call happens in an Inngest
// step (no Vercel function timeout).

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const userId = await requireUser();

  let body: { brief?: unknown; format?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const brief = typeof body.brief === "string" ? body.brief.trim() : "";
  const format = typeof body.format === "string" ? body.format : "1:1";
  if (!brief) {
    return NextResponse.json({ error: "Missing brief" }, { status: 400 });
  }

  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("image_jobs")
    .insert({ user_id: userId, status: "pending", brief, format })
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to create job" },
      { status: 500 }
    );
  }

  const jobId = data.id as string;

  await inngest.send({
    name: "image/excalidraw.requested",
    data: { jobId, userId, brief, format },
  });

  return NextResponse.json({ jobId });
}
