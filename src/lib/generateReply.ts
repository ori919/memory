import { postChat } from "@/lib/api";

/**
 * Edge chat: POST { message, memoryId } → { reply }.
 * Optional micro-delay keeps the UI feeling “instant but human.”
 */
export async function generateReply(
  message: string,
  memoryId: string
): Promise<string> {
  const minDelay = 120;
  const [data] = await Promise.all([
    postChat({ message, memoryId }),
    new Promise<void>((r) => setTimeout(r, minDelay)),
  ]);
  return data.reply.trim();
}
