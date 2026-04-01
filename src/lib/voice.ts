let currentAudio: HTMLAudioElement | null = null;

/**
 * ElevenLabs TTS via /api/speak. Replace URL or add headers when routing changes.
 */
export async function speakText(text: string, voiceId: string): Promise<void> {
  stopSpeaking();

  const res = await fetch("/api/speak", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, voiceId }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || "TTS request failed");
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  currentAudio = audio;

  await new Promise<void>((resolve, reject) => {
    audio.onended = () => {
      URL.revokeObjectURL(url);
      if (currentAudio === audio) currentAudio = null;
      resolve();
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      if (currentAudio === audio) currentAudio = null;
      reject(new Error("Audio playback failed"));
    };
    void audio.play().catch(reject);
  });
}

/** Facade for UI — swap implementation for direct ElevenLabs client later */
export async function playVoice(text: string, voiceId: string): Promise<void> {
  return speakText(text, voiceId);
}

/** Structured hook for future SDK */
export const elevenLabs = {
  async generateVoice(text: string, voiceId: string): Promise<void> {
    return speakText(text, voiceId);
  },
};

export function stopSpeaking(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
}
