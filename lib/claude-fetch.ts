import Anthropic from "@anthropic-ai/sdk";

export async function claudeFetch(
  apiKey: string,
  body: Record<string, unknown>,
  _opts: { maxAttempts?: number; initialDelayMs?: number } = {},
): Promise<Response> {
  const client = new Anthropic({ apiKey });

  const data = await client.messages.create(
    body as Parameters<typeof client.messages.create>[0]
  );

  const jsonStr = JSON.stringify(data);
  const blob = new Blob([jsonStr], { type: "application/json" });

  return new Response(blob, {
    status: 200,
    statusText: "OK",
    headers: { "Content-Type": "application/json" },
  });
}
