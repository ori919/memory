import { getCloudflareContext } from "@opennextjs/cloudflare";

function readBinding(key: "ELEVENLABS_API_KEY" | "CLOUDFLARE_WORKER_URL"): string | undefined {
  try {
    const { env } = getCloudflareContext();
    const v = env[key];
    if (typeof v === "string" && v.length > 0) return v;
  } catch {
    // Not inside a Cloudflare request (build, local node without context, tests).
  }
  const p = process.env[key];
  return p && p.length > 0 ? p : undefined;
}

/** ElevenLabs key: prefer Worker `env` (dashboard secrets) over `process.env` — OpenNext may not copy secrets into `process.env`. */
export function getElevenLabsApiKey(): string | undefined {
  return readBinding("ELEVENLABS_API_KEY");
}

export function getCloudflareWorkerUrlFromEnv(): string | undefined {
  return readBinding("CLOUDFLARE_WORKER_URL");
}
