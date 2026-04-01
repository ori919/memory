"use client";

import { useCallback, useState } from "react";
import { playVoice } from "@/lib/voice";
import type { ChatMessage } from "@/lib/types";

type Props = {
  message: ChatMessage;
  isAssistant: boolean;
  playingId: string | null;
  onPlayState: (id: string | null) => void;
  voiceId: string;
  isStreaming: boolean;
  /** True when assistant message is done streaming and has content */
  streamComplete: boolean;
};

export function MessageBubble({
  message,
  isAssistant,
  playingId,
  onPlayState,
  voiceId,
  isStreaming,
  streamComplete,
}: Props) {
  const [busy, setBusy] = useState(false);

  const play = useCallback(async () => {
    if (!isAssistant || !streamComplete) return;
    setBusy(true);
    onPlayState(message.id);
    try {
      await playVoice(message.content, voiceId);
    } finally {
      onPlayState(null);
      setBusy(false);
    }
  }, [
    isAssistant,
    message.content,
    message.id,
    onPlayState,
    streamComplete,
    voiceId,
  ]);

  const isPlaying = playingId === message.id;
  const showPlay = isAssistant && streamComplete && !isStreaming;

  if (isAssistant) {
    return (
      <div className="flex max-w-[min(100%,28rem)] flex-col gap-2 self-start">
        <div
          className={`rounded-2xl rounded-bl-md bg-stone-100 px-4 py-3 text-[17px] leading-relaxed text-stone-800 transition-all duration-300 ease-out ${
            isStreaming
              ? "translate-y-1.5 opacity-95 shadow-sm"
              : "translate-y-0 opacity-100 shadow-md"
          }`}
        >
          {message.content}
          {isStreaming && message.content.length === 0 && (
            <span className="inline-block h-4 w-1 animate-pulse rounded-sm bg-stone-400 align-middle" />
          )}
        </div>
        {showPlay && (
          <div className="flex justify-start pl-0.5">
            <button
              type="button"
              onClick={play}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-full border border-stone-200/90 bg-white px-3.5 py-1.5 text-xs font-medium tracking-wide text-stone-600 shadow-sm transition hover:border-stone-300 hover:bg-stone-50 disabled:opacity-60"
            >
              {isPlaying || busy ? (
                <span
                  className="inline-flex h-4 items-end gap-0.5 text-stone-500"
                  aria-hidden
                >
                  <span className="voice-bar" />
                  <span className="voice-bar voice-bar-delay-1" />
                  <span className="voice-bar voice-bar-delay-2" />
                  <span className="voice-bar voice-bar-delay-3" />
                </span>
              ) : (
                <span aria-hidden className="text-stone-500">
                  ▶
                </span>
              )}
              {isPlaying || busy ? "Playing…" : "Play voice"}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="memory-pop max-w-[min(100%,28rem)] self-end">
      <div className="rounded-2xl rounded-br-md bg-stone-900 px-4 py-3 text-[17px] leading-relaxed text-stone-50 shadow-sm">
        {message.content}
      </div>
    </div>
  );
}
