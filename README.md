# Memory

A quiet Next.js app for remembering someone you love — each **Memory** can be backed by a **Cloudflare Durable Object** agent (persistent personality + chat history on the edge). Voice uses ElevenLabs via `/api/speak` when configured; the UI keeps session copy in `sessionStorage`.

## Getting started

```bash
npm install
cp .env.example .env.local
# Add ELEVENLABS_API_KEY (TTS / clone), optional CLOUDFLARE_WORKER_URL
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Cloudflare AI agents (Durable Objects)

- **`cloudflare/memory-agent.ts`** — `MemoryAgent extends DurableObject`: stores name, personality, and rolling chat history in `ctx.storage` (survives restarts).
- **`cloudflare/worker.ts`** — routes `POST /api/chat` and `POST /api/memory` to `env.MEMORY_AGENT.idFromName(memoryId)` so **one DO instance per memory**.
- **`cloudflare/agent-reply.ts`** — `generateReplyAsync` uses **Workers AI** (`@cf/meta/llama-3.1-8b-instruct`) when the `AI` binding is present; falls back to the same heuristics as `generateReply` on failure or for `__INIT__`.
- Deploy Worker: `npm run worker:deploy` (uses `cloudflare/wrangler.worker.toml` with `[ai]` binding).

### Next.js proxy

When **`CLOUDFLARE_WORKER_URL`** is set (server-side), `src/app/api/chat` and `src/app/api/memory` **forward** the same JSON to your deployed Worker so local Next talks to real DOs. The browser can keep calling same-origin `/api/*`.

### Environment

| Variable | Purpose |
| --- | --- |
| `ELEVENLABS_API_KEY` | TTS + voice clone (`/api/speak`, `/api/clone-voice`) |
| `CLOUDFLARE_WORKER_URL` | Deployed Worker origin for API proxy (no trailing slash) |
| `NEXT_PUBLIC_WORKER_URL` | Optional: browser calls Worker directly for `/api/chat` / `/api/memory` |
| `NEXT_PUBLIC_APP_URL` | Optional app URL for links |

## Health

- Next: `GET /api/health`
- Worker: `GET /api/health` on the Worker origin (see `cloudflare/worker.ts`)

## Cloudflare deploy (Next app)

This project uses [OpenNext for Cloudflare](https://opennext.js.org/cloudflare/get-started): root `wrangler.jsonc` sets `main` to `.open-next/worker.js` and static assets under `.open-next/assets`.

- **`npm run build`** runs `opennextjs-cloudflare build`. The inner Next step is **`next build`** (set in `open-next.config.ts` as `buildCommand`) so OpenNext does not recurse into `npm run build`.
- **After a successful build**, deploy with `npx wrangler deploy` or `opennextjs-cloudflare deploy` (Wrangler detects OpenNext and forwards). In **Pages / CI**, run **`npm run build`** first, then the deploy step — otherwise you get “Could not find compiled Open Next config”.
- **Full local pipeline:** `npm run deploy` (build + deploy).

The **Durable Object** API is a separate Worker: `npm run worker:deploy` (`cloudflare/wrangler.worker.toml`). Enable **Workers AI** for your account so the `AI` binding works in production.
