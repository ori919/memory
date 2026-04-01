import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) {
    return new Response(JSON.stringify({ error: "Missing ELEVENLABS_API_KEY" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  let body: { text?: string; voiceId?: string };
  try {
    body = (await req.json()) as { text?: string; voiceId?: string };
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const text = typeof body.text === "string" ? body.text : "";
  const voiceId =
    typeof body.voiceId === "string" && body.voiceId.length > 0
      ? body.voiceId
      : "21m00Tcm4TlvDq8ikWAM";

  if (!text.trim()) {
    return new Response(JSON.stringify({ error: "Empty text" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`;

  const upstream = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "audio/mpeg",
      "xi-api-key": key,
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_turbo_v2",
      voice_settings: {
        stability: 0.75,
        similarity_boost: 0.85,
      },
    }),
  });

  if (!upstream.ok || !upstream.body) {
    const errText = await upstream.text();
    return new Response(
      JSON.stringify({ error: "ElevenLabs error", detail: errText }),
      { status: 502, headers: { "content-type": "application/json" } }
    );
  }

  return new Response(upstream.body, {
    headers: {
      "content-type": "audio/mpeg",
      "cache-control": "no-store",
    },
  });
}
