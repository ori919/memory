import type { MemoryRecord } from "@/lib/memory/types";

const CHAT_PATH = "/api/chat";
const MEMORY_PATH = "/api/memory";

function workerBase(): string {
  return process.env.NEXT_PUBLIC_WORKER_URL?.replace(/\/$/, "") ?? "";
}

export function getChatEndpoint(): string {
  const base = workerBase();
  return base ? `${base}${CHAT_PATH}` : CHAT_PATH;
}

export function getMemoryEndpoint(): string {
  const base = workerBase();
  return base ? `${base}${MEMORY_PATH}` : MEMORY_PATH;
}

export type ChatRequest = {
  message: string;
  memoryId: string;
};

export type ChatResponse = {
  reply: string;
};

export async function postChat(body: ChatRequest): Promise<ChatResponse> {
  const res = await fetch(getChatEndpoint(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || "Chat failed");
  }

  return (await res.json()) as ChatResponse;
}

export async function postMemory(record: MemoryRecord): Promise<void> {
  const res = await fetch(getMemoryEndpoint(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(record),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || "Could not save memory");
  }
}
