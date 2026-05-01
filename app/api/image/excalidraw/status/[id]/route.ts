import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

// Polled by the browser until status === "complete" or "error".
// Returns the row scoped to the requesting user (RLS would also enforce this,
// but we use the service-role client here so we filter by user_id explicitly).

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await requireUser();
  const { id } = await params;

  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("image_jobs")
    .select("status,scene,error,updated_at")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Job not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(data);
}
