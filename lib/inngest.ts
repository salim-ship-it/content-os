import { Inngest } from "inngest";

// Inngest client. The SDK reads INNGEST_EVENT_KEY + INNGEST_SIGNING_KEY from
// process.env automatically when running on Vercel (set by the integration).
export const inngest = new Inngest({ id: "content-os" });

// Events this app emits (typed for autocomplete / future safety).
export type Events = {
  "image/excalidraw.requested": {
    data: {
      jobId: string;
      userId: string;
      brief: string;
      format: string;
    };
  };
};
