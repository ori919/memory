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
- **`cloudflare/agent-reply.ts`** — `generateReply(message, personality, history, name)` (mock; swap for Workers AI / remote LLM).
- Deploy Worker: `npm run worker:deploy` (uses `cloudflare/wrangler.worker.toml`).

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

- **Build + deploy:** `npm run deploy` (runs `opennextjs-cloudflare build` then `opennextjs-cloudflare deploy`).
- In **Cloudflare Pages** (or CI), use that command for the deploy step — **not** bare `npx wrangler deploy`, which expects a Worker entry or `--assets` and does not match this layout.

The **Durable Object** API is a separate Worker: `npm run worker:deploy` (`cloudflare/wrangler.worker.toml`).
