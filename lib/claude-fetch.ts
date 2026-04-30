const API_URL = "https://api.anthropic.com/v1/messages";

const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504, 529]);

export async function claudeFetch(
  apiKey: string,
  body: Record<string, unknown>,
  opts: { maxAttempts?: number; initialDelayMs?: number } = {},
): Promise<Response> {
  const maxAttempts = opts.maxAttempts ?? 4;
  const initialDelay = opts.initialDelayMs ?? 1000;

  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify(body),
      });

      if (res.ok || !RETRYABLE_STATUS.has(res.status) || attempt === maxAttempts) {
        return res;
      }

      const retryAfter = Number(res.headers.get("retry-after"));
      const delay = Number.isFinite(retryAfter) && retryAfter > 0
        ? retryAfter * 1000
        : initialDelay * Math.pow(2, attempt - 1);

      console.warn(`[claude-fetch] ${res.status} on attempt ${attempt}/${maxAttempts}, retrying in ${delay}ms`);
      await new Promise((r) => setTimeout(r, delay));
    } catch (err) {
      lastErr = err;
      if (attempt === maxAttempts) throw err;
      const delay = initialDelay * Math.pow(2, attempt - 1);
      console.warn(`[claude-fetch] network error on attempt ${attempt}/${maxAttempts}, retrying in ${delay}ms`, err);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr ?? new Error("claude-fetch exhausted retries");
}
