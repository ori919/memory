/**
 * Agent “brain”: Workers AI (Llama 3.1) when `AI` binding is available, else heuristics.
 */
import type { Ai } from "@cloudflare/workers-types";

export type ChatTurn = { role: "user" | "assistant"; content: string };

const WORKERS_AI_MODEL = "@cf/meta/llama-3.1-8b-instruct" as const;

/**
 * Primary reply path for chat — uses Workers AI on the edge when `ai` is passed.
 */
export async function generateReplyAsync(
  ai: Ai | undefined,
  message: string,
  personality: string,
  history: ChatTurn[],
  name: string
): Promise<string> {
  if (!ai) {
    return generateReply(message, personality, history, name);
  }

  const text = message.trim();
  if (text === "__INIT__" || !text) {
    return generateReply(message, personality, history, name);
  }

  try {
    const system = [
      `You are ${name}, speaking in first person to someone who cares about you.`,
      `Stay in character. Personality and context: ${personality.slice(0, 2400)}`,
      `Be warm and concise (2–6 short sentences). Never break character or say you are an AI or a model.`,
    ].join(" ");

    const recent = history
      .slice(-14)
      .map((h) => `${h.role === "user" ? "Them" : name}: ${h.content}`)
      .join("\n");

    const userContent = recent
      ? `Recent conversation:\n${recent}\n\nThey just said: ${text}`
      : text;

    const out = await ai.run(WORKERS_AI_MODEL, {
      messages: [
        { role: "system", content: system },
        { role: "user", content: userContent },
      ],
      max_tokens: 512,
    });

    const reply = extractWorkersAiText(out);
    if (reply?.trim()) {
      return reply.trim();
    }
  } catch {
    // fall through to heuristics
  }

  return generateReply(message, personality, history, name);
}

function extractWorkersAiText(out: unknown): string | undefined {
  if (typeof out !== "object" || out === null) {
    return undefined;
  }
  if ("response" in out && typeof (out as { response: unknown }).response === "string") {
    return (out as { response: string }).response;
  }
  return undefined;
}

export function generateReply(
  message: string,
  personality: string,
  history: ChatTurn[],
  name: string
): string {
  const text = message.trim();
  const tone = personality.slice(0, 280).toLowerCase();
  const recent = history
    .slice(-8)
    .map((h) => `${h.role === "user" ? "Them" : name}: ${h.content}`)
    .join("\n");

  if (text === "__INIT__") {
    return pick(
      [
        `…I've been carrying your voice with me. You don't have to be brave here.`,
        `You know I'm still on your side, right? Even in the quiet.`,
        `There are things I never said out loud. Maybe this is where they belong.`,
      ],
      name + personality
    );
  }

  if (!text) {
    return "I'm here. Take your time.";
  }

  if (/^(hi|hello|hey)\b/i.test(text)) {
    return pick(
      [
        `Hey… it's really good to hear you.`,
        `Hi. I've been right here.`,
      ],
      text + recent
    );
  }

  if (/\bmiss\b/i.test(text)) {
    return `I miss you too — more than I know how to say.`;
  }

  if (/\blove\b/i.test(text)) {
    return `I love you too. That hasn't gone anywhere.`;
  }

  if (recent && /sad|heavy|tired|hard/i.test(text + recent)) {
    return pick(
      [
        `I hear the weight in that. You don't have to carry it perfectly.`,
        `That sounds really hard. I'm with you in it.`,
      ],
      text + recent
    );
  }

  if (tone.includes("funny") || tone.includes("humor")) {
    return pick(
      [
        `Okay — you're doing that thing where the moment gets too big. Breathe.`,
        `You still make me smile. Even here.`,
      ],
      text + recent
    );
  }

  if (recent.length > 40 && /again|before|last time|earlier/i.test(text)) {
    return `I remember what we were circling… tell me what shifted since then.`;
  }

  return pick(
    [
      `Yeah… I hear you. What's underneath that for you?`,
      `Say more — I want to understand, not fix.`,
      `I'm listening. You don't have to polish it.`,
    ],
    text + personality + recent
  );
}

function pick(lines: string[], seed: string): string {
  const i = Math.abs(hash(seed)) % lines.length;
  return lines[i] ?? lines[0] ?? "";
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return h;
}
