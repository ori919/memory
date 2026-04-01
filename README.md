# Memory

A quiet Next.js app for remembering someone you love — Claude for voice, ElevenLabs for speech, and client-side session storage for privacy.

## Getting started

```bash
npm install
cp .env.example .env.local
# Add ANTHROPIC_API_KEY, ELEVENLABS_API_KEY, NEXT_PUBLIC_APP_URL
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

| Variable | Purpose |
| --- | --- |
| `ANTHROPIC_API_KEY` | Claude via `/api/chat` (server only) |
| `ELEVENLABS_API_KEY` | TTS + voice clone (server only) |
| `NEXT_PUBLIC_APP_URL` | Optional app URL for links |
| `ANTHROPIC_MODEL` | Optional override (default: `claude-sonnet-4-20250514`) |

For Cloudflare Wrangler local dev, copy keys into `.dev.vars` (gitignored).

## Deployed on Cloudflare Pages

This repo includes `wrangler.toml` and `npm run deploy` (`next build` then `wrangler pages deploy .next`). Next.js 16 may require a Cloudflare adapter (for example `@cloudflare/next-on-pages` or `@opennextjs/cloudflare`) when your Next major version matches the adapter’s peer range; align versions per [Cloudflare Pages + Next.js](https://developers.cloudflare.com/pages/framework-guides/nextjs/) before shipping the hackathon build.

**API routes run as Cloudflare Workers** when deployed on Pages. Conversation state is **persisted client-side** with `sessionStorage`.

## Health

`GET /api/health` returns `{ status: "ok", worker: true, timestamp }` for demos and judges.
