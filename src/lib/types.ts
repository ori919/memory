export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
};

/** Default ElevenLabs voice: Rachel */
export const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM";

export type MemoryProfile = {
  /** Stable id for edge/R2 lookup */
  memoryId: string;
  name: string;
  /** data URL or empty string if skipped */
  imageDataUrl: string;
  description: string;
  /** e.g. mom, partner — used in system prompt */
  relationship: string;
  /** ElevenLabs voice id; defaults to Rachel */
  voiceId: string;
};
