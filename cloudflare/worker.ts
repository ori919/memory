/**
 * Cloudflare Worker entry — routes each memoryId to its Durable Object agent.
 * Deploy: npm run worker:deploy
 */
import { MemoryAgent } from "./memory-agent";

export interface Env {
  MEMORY_AGENT: DurableObjectNamespace<MemoryAgent>;
}

export { MemoryAgent };

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

const worker = {
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

    if (
      request.method === "POST" &&
      (url.pathname === "/api/chat" || url.pathname === "/api/memory")
    ) {
      const bodyText = await request.text();
      let memoryId = "";
      try {
        const parsed = JSON.parse(bodyText) as {
          memoryId?: string;
          id?: string;
        };
        memoryId =
          url.pathname === "/api/chat"
            ? (parsed.memoryId ?? "")
            : (parsed.id ?? "");
      } catch {
        return json({ error: "Invalid JSON" }, 400);
      }

      if (!memoryId) {
        return json(
          {
            error:
              url.pathname === "/api/chat"
                ? "memoryId required"
                : "id required",
          },
          400
        );
      }

      const id = env.MEMORY_AGENT.idFromName(memoryId);
      const stub = env.MEMORY_AGENT.get(id);
      return stub.fetch(
        new Request(request.url, {
          method: request.method,
          headers: request.headers,
          body: bodyText,
        })
      );
    }

    if (request.method === "GET" && url.pathname === "/api/health") {
      return json({ status: "ok", worker: true, timestamp: Date.now() });
    }

    return new Response("Not found", { status: 404 });
  },
};

export default worker;
