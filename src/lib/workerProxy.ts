/**
 * When CLOUDFLARE_WORKER_URL is set, Next API routes forward to the Durable Object Worker.
 */
export function getCloudflareWorkerBase(): string | undefined {
  const raw = process.env.CLOUDFLARE_WORKER_URL;
  if (!raw) return undefined;
  return raw.replace(/\/$/, "");
}

export async function proxyJsonToWorker(
  pathname: "/api/chat" | "/api/memory",
  bodyText: string
): Promise<Response | null> {
  const base = getCloudflareWorkerBase();
  if (!base) return null;
  return fetch(`${base}${pathname}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: bodyText,
  });
}
