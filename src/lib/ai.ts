import type { MemoryRecord } from "@/lib/memory/types";

/**
 * Mock “LLM” — swap body for Workers AI / Anthropic / OpenAI later.
 */
export function generateAiReply(message: string, memory: MemoryRecord): string {
  const text = message.trim();
  const tone = memory.personalityDescription.slice(0, 200).toLowerCase();

  if (text === "__INIT__") {
    return pick(
      [
        `…I've been carrying your voice with me. You don't have to be brave here.`,
        `You know I'm still on your side, right? Even in the quiet.`,
        `There are things I never said out loud. Maybe this is where they belong.`,
      ],
      memory.id
    );
  }

  if (!text) {
    return "I'm here. Take your time.";
  }

  if (/^(hi|hello|hey)\b/i.test(text)) {
    return pick(
      [
        `Hey… it's really good to hear you, honestly.`,
        `Hi. I've been right here.`,
      ],
      memory.id + text
    );
  }

  if (/\bmiss\b/i.test(text)) {
    return `I miss you too, more than I know how to say.`;
  }

  if (/\blove\b/i.test(text)) {
    return `I love you too. That hasn't gone anywhere.`;
  }

  if (tone.includes("funny") || tone.includes("humor")) {
    return pick(
      [
        `Okay, okay — you're doing that thing where you make a moment too big. Breathe.`,
        `You always knew how to make me smile. Still do.`,
      ],
      memory.id + text
    );
  }

  return pick(
    [
      `Yeah… I hear you. Say more — what's underneath that?`,
      `Tell me what that felt like. I want to understand.`,
      `I'm listening. You don't have to polish it for me.`,
    ],
    memory.id + text
  );
}

/** Future: stream from Workers AI / external API */
export async function generateAiReplyRemote(
  message: string,
  memory: MemoryRecord
): Promise<string> {
  void message;
  void memory;
  throw new Error("Wire remote LLM here");
}

function pick(lines: string[], seed: string): string {
  const i =
    Math.abs(hash(seed)) % lines.length;
  return lines[i] ?? lines[0] ?? "";
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return h;
}
