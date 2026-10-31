import Anthropic from "@anthropic-ai/sdk";
import type { MessageCreateParamsNonStreaming } from "@anthropic-ai/sdk/resources/messages";

export async function claudeFetch(
  apiKey: string,
  body: MessageCreateParamsNonStreaming,
  _opts: { maxAttempts?: number; initialDelayMs?: number } = {},
): Promise<Response> {
  const client = new Anthropic({ apiKey });

  const data = await client.messages.create(body);

  const jsonStr = JSON.stringify(data);
  const blob = new Blob([jsonStr], { type: "application/json" });

  return new Response(blob, {
    status: 200,
    statusText: "OK",
    headers: { "Content-Type": "application/json" },
  });
}
