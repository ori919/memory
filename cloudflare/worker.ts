/**
 * Cloudflare Worker: edge API + optional R2 binding.
 * Deploy: npx wrangler deploy -c cloudflare/wrangler.worker.toml
 */
import { generateAiReply } from "./ai";
import type { MemoryRecord } from "./types";

export interface Env {
  /** Bind in wrangler.toml: [[r2_buckets]] binding = "MEMORY_BUCKET" */
  MEMORY_BUCKET?: R2Bucket;
}

const mock = new Map<string, MemoryRecord>();

async function readMemory(env: Env, id: string): Promise<MemoryRecord | null> {
  if (env.MEMORY_BUCKET) {
    const key = `memories/${id}.json`;
    const obj = await env.MEMORY_BUCKET.get(key);
    if (!obj) return null;
    return JSON.parse(await obj.text()) as MemoryRecord;
  }
  return mock.get(id) ?? null;
}

async function writeMemory(env: Env, data: MemoryRecord): Promise<void> {
  if (env.MEMORY_BUCKET) {
    const key = `memories/${data.id}.json`;
    await env.MEMORY_BUCKET.put(key, JSON.stringify(data), {
      httpMetadata: { contentType: "application/json" },
    });
    return;
  }
  mock.set(data.id, data);
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

const handler = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "access-control-allow-origin": "*",
          "access-control-allow-methods": "POST, OPTIONS",
          "access-control-allow-headers": "content-type",
        },
      });
    }

    if (request.method === "POST" && url.pathname === "/api/memory") {
      let body: MemoryRecord;
      try {
        body = (await request.json()) as MemoryRecord;
      } catch {
        return json({ error: "Invalid JSON" }, 400);
      }
      if (!body?.id || typeof body.name !== "string") {
        return json({ error: "id and name required" }, 400);
      }
      await writeMemory(env, {
        id: body.id,
        name: body.name,
        personalityDescription: body.personalityDescription ?? "",
        imageUrl: typeof body.imageUrl === "string" ? body.imageUrl : "",
        relationship: body.relationship,
        voiceId: body.voiceId,
      });
      return json({ ok: true });
    }

    if (request.method === "POST" && url.pathname === "/api/chat") {
      let body: { message?: string; memoryId?: string };
      try {
        body = (await request.json()) as { message?: string; memoryId?: string };
      } catch {
        return json({ error: "Invalid JSON" }, 400);
      }
      const message = typeof body.message === "string" ? body.message : "";
      const memoryId = typeof body.memoryId === "string" ? body.memoryId : "";
      if (!memoryId) {
        return json({ error: "memoryId required" }, 400);
      }
      const memory = await readMemory(env, memoryId);
      if (!memory) {
        return json({ error: "Memory not found" }, 404);
      }
      const reply = generateAiReply(message, memory);
      const res = json({ reply });
      res.headers.set("access-control-allow-origin", "*");
      return res;
    }

    return new Response("Not found", { status: 404 });
  },
};

export default handler;
