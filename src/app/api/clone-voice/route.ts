import { NextRequest } from "next/server";
import { getElevenLabsApiKey } from "@/lib/cloudflareEnv";

function filenameForBlob(blob: Blob): string {
  const t = blob.type.toLowerCase();
  if (t.includes("wav")) return "recording.wav";
  if (t.includes("mp4") || t.includes("m4a") || t.includes("x-m4a")) return "recording.m4a";
  if (t.includes("mpeg") || t.includes("mp3")) return "recording.mp3";
  return "recording.mp3";
}

/** Parse ElevenLabs/FastAPI JSON error body into a short string for the UI. */
function formatElevenLabsErrorBody(raw: string): string {
  try {
    const j = JSON.parse(raw) as {
      detail?: unknown;
      message?: string;
    };
    if (typeof j.message === "string" && j.message.trim()) return j.message.trim();
    if (Array.isArray(j.detail)) {
      const parts = j.detail.map((item: { msg?: string }) =>
        typeof item?.msg === "string" ? item.msg : JSON.stringify(item)
      );
      return parts.join("; ");
    }
    if (typeof j.detail === "string") return j.detail;
  } catch {
    // ignore
  }
  return raw.length > 800 ? `${raw.slice(0, 800)}…` : raw;
}

export async function POST(req: NextRequest) {
  const key = getElevenLabsApiKey();
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
  outbound.append("files", audioFile, filenameForBlob(audioFile));

  const upstream = await fetch("https://api.elevenlabs.io/v1/voices/add", {
    method: "POST",
    headers: {
      "xi-api-key": key,
    },
    body: outbound,
  });

  const raw = await upstream.text();
  if (!upstream.ok) {
    const detail = formatElevenLabsErrorBody(raw);
    return new Response(
      JSON.stringify({
        error: "ElevenLabs voice add failed",
        detail,
      }),
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
