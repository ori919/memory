import type { MemoryRecord } from "@/lib/memory/types";

/**
 * In-memory stand-in for Cloudflare R2. Replace with R2 get/put in production.
 * Uses globalThis so the Map survives warm Edge isolates between requests.
 */
declare global {
  var __memoryR2Mock: Map<string, MemoryRecord> | undefined;
}

function getMap(): Map<string, MemoryRecord> {
  if (!globalThis.__memoryR2Mock) {
    globalThis.__memoryR2Mock = new Map();
  }
  return globalThis.__memoryR2Mock;
}

export async function getMemory(memoryId: string): Promise<MemoryRecord | null> {
  const row = getMap().get(memoryId);
  return row ?? null;
}

export async function saveMemory(data: MemoryRecord): Promise<void> {
  getMap().set(data.id, { ...data });
}
