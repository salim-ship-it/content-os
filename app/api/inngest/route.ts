import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest";
import {
  generateExcalidraw,
  archivePostImages,
  scrapeCreatorPosts,
} from "@/inngest/functions";

// Inngest's webhook handler — Inngest cloud calls this URL to invoke the
// registered functions. The integration sets INNGEST_SIGNING_KEY in env so
// the SDK can verify these calls automatically.
export const runtime = "nodejs";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [generateExcalidraw, archivePostImages, scrapeCreatorPosts],
});
