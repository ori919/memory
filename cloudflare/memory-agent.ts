/**
 * One Durable Object = one persistent Memory agent (personality + history).
 */
import { DurableObject } from "cloudflare:workers";
import type { Ai } from "@cloudflare/workers-types";
import { generateReplyAsync } from "./agent-reply";
import type { ChatTurn } from "./agent-reply";

export interface MemoryAgentEnv {
  AI: Ai;
}

const STATE_KEY = "v1";
const MAX_HISTORY = 80;

export type AgentPersistedState = {
  name: string;
  personality: string;
  relationship: string;
  voiceId?: string;
  imageUrl?: string;
  history: ChatTurn[];
};

export class MemoryAgent extends DurableObject<MemoryAgentEnv> {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return cors();
    }

    try {
      if (request.method === "POST" && url.pathname === "/api/memory") {
        return await this.handleInit(request);
      }
      if (request.method === "POST" && url.pathname === "/api/chat") {
        return await this.handleChat(request, url);
      }
    } catch (e) {
      return withCors(
        json(
          { error: e instanceof Error ? e.message : "Agent error" },
          500
        )
      );
    }

    return new Response("Not found", { status: 404 });
  }

  private async handleInit(request: Request): Promise<Response> {
    const body = (await request.json()) as {
      id?: string;
      name?: string;
      personalityDescription?: string;
      imageUrl?: string;
      relationship?: string;
      voiceId?: string;
    };

    if (!body?.name) {
      return withCors(json({ error: "name required" }, 400));
    }

    const prev = await this.ctx.storage.get<AgentPersistedState>(STATE_KEY);
    const next: AgentPersistedState = {
      name: body.name,
      personality: body.personalityDescription ?? prev?.personality ?? "",
      relationship: typeof body.relationship === "string" ? body.relationship : "",
      voiceId: body.voiceId ?? prev?.voiceId,
      imageUrl: typeof body.imageUrl === "string" ? body.imageUrl : prev?.imageUrl,
      history: prev?.history ?? [],
    };

    await this.ctx.storage.put(STATE_KEY, next);
    return withCors(json({ ok: true }));
  }

  private async handleChat(request: Request, url: URL): Promise<Response> {
    const body = (await request.json()) as {
      message?: string;
      memoryId?: string;
    };

    const message = typeof body.message === "string" ? body.message : "";
    const state = await this.ctx.storage.get<AgentPersistedState>(STATE_KEY);

    if (!state) {
      return withCors(json({ error: "Agent not initialized" }, 404));
    }

    const stream = url.searchParams.get("stream") === "1";

    if (message === "__INIT__") {
      const reply = await generateReplyAsync(
        this.env.AI,
        "__INIT__",
        state.personality,
        state.history,
        state.name
      );
      state.history.push({ role: "assistant", content: reply });
      this.trimHistory(state);
      await this.ctx.storage.put(STATE_KEY, state);
      return stream
        ? withCors(streamText(reply))
        : withCors(json({ reply }));
    }

    if (!message.trim()) {
      return withCors(json({ error: "Empty message" }, 400));
    }

    state.history.push({ role: "user", content: message });
    const reply = await generateReplyAsync(
      this.env.AI,
      message,
      state.personality,
      state.history,
      state.name
    );
    state.history.push({ role: "assistant", content: reply });
    this.trimHistory(state);
    await this.ctx.storage.put(STATE_KEY, state);

    return stream ? withCors(streamText(reply)) : withCors(json({ reply }));
  }

  private trimHistory(state: AgentPersistedState): void {
    if (state.history.length > MAX_HISTORY) {
      state.history = state.history.slice(-MAX_HISTORY);
    }
  }
}

function streamText(reply: string): Response {
  return new Response(
    new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(reply));
        controller.close();
      },
    }),
    {
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "no-store",
      },
    }
  );
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

function cors(): Response {
  return new Response(null, {
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "POST, OPTIONS, GET",
      "access-control-allow-headers": "content-type",
    },
  });
}

function withCors(r: Response): Response {
  r.headers.set("access-control-allow-origin", "*");
  return r;
}
