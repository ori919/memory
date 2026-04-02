/** Augment OpenNext's CloudflareEnv for app secrets / vars set in the dashboard. */
declare global {
  interface CloudflareEnv {
    ELEVENLABS_API_KEY?: string;
    CLOUDFLARE_WORKER_URL?: string;
  }
}

export {};
