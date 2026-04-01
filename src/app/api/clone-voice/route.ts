import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) {
    return new Response(JSON.stringify({ error: "Missing ELEVENLABS_API_KEY" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid form data" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const name = form.get("name");
  const audioFile = form.get("audioFile");

  if (typeof name !== "string" || !name.trim()) {
    return new Response(JSON.stringify({ error: "Missing name" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  if (!(audioFile instanceof Blob) || audioFile.size === 0) {
    return new Response(JSON.stringify({ error: "Missing audio file" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const maxBytes = 25 * 1024 * 1024;
  if (audioFile.size > maxBytes) {
    return new Response(JSON.stringify({ error: "File too large (max 25MB)" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const outbound = new FormData();
  outbound.append("name", name.trim().slice(0, 120));
  outbound.append("description", "Memory voice clone");
  outbound.append("files", audioFile, "recording.mp3");

  const upstream = await fetch("https://api.elevenlabs.io/v1/voices/add", {
    method: "POST",
    headers: {
      "xi-api-key": key,
    },
    body: outbound,
  });

  const raw = await upstream.text();
  if (!upstream.ok) {
    return new Response(
      JSON.stringify({ error: "ElevenLabs voice add failed", detail: raw }),
      { status: 502, headers: { "content-type": "application/json" } }
    );
  }

  try {
    const json = JSON.parse(raw) as { voice_id?: string };
    const voiceId = json.voice_id;
    if (!voiceId) {
      return new Response(JSON.stringify({ error: "No voice_id in response", detail: raw }), {
        status: 502,
        headers: { "content-type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ voiceId }), {
      headers: { "content-type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Bad response", detail: raw }), {
      status: 502,
      headers: { "content-type": "application/json" },
    });
  }
}
