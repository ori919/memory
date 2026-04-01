/**
 * Canonical memory document — maps 1:1 to an R2 object (e.g. memories/{id}.json).
 */
export type MemoryRecord = {
  id: string;
  name: string;
  /** Personality / story text used for prompts */
  personalityDescription: string;
  /** Data URL or remote URL */
  imageUrl: string;
  relationship?: string;
  voiceId?: string;
};
