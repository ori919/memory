/**
 * Agent “brain” — Workers AI / remote LLM can replace this function later.
 * Context-aware using recent history + personality text.
 */
export type ChatTurn = { role: "user" | "assistant"; content: string };

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
