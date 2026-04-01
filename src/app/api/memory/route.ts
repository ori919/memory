import { NextRequest } from "next/server";
import type { MemoryRecord } from "@/lib/memory/types";
import { saveMemory } from "@/lib/memory/store";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  let body: MemoryRecord;
  try {
    body = (await req.json()) as MemoryRecord;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  if (!body?.id || typeof body.name !== "string") {
    return new Response(JSON.stringify({ error: "id and name required" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  await saveMemory({
    id: body.id,
    name: body.name,
    personalityDescription: body.personalityDescription ?? "",
    imageUrl: typeof body.imageUrl === "string" ? body.imageUrl : "",
    relationship: body.relationship,
    voiceId: body.voiceId,
  });

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "content-type": "application/json" },
  });
}
