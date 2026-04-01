import { NextRequest } from "next/server";
import { generateAiReply } from "@/lib/ai";
import { getMemory } from "@/lib/memory/store";

export const runtime = "edge";

type Body = {
  message?: string;
  memoryId?: string;
};

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const message = typeof body.message === "string" ? body.message : "";
  const memoryId = typeof body.memoryId === "string" ? body.memoryId : "";

  if (!memoryId) {
    return new Response(JSON.stringify({ error: "memoryId required" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const memory = await getMemory(memoryId);
  if (!memory) {
    return new Response(JSON.stringify({ error: "Memory not found" }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });
  }

  const reply = generateAiReply(message, memory);

  return new Response(JSON.stringify({ reply }), {
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
    },
  });
}
