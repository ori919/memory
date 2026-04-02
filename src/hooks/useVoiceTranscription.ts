"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type VoiceStatus = "idle" | "listening" | "unsupported";

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

/**
 * Live speech-to-text using the browser Web Speech API (Chrome/Edge/Safari).
 * Streams interim + final transcripts; prefix is text that was in the field when recording started.
 */
export function useVoiceTranscription(
  onTranscript: (text: string) => void,
  lang?: string
) {
  const onTranscriptRef = useRef(onTranscript);
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);
  const langRef = useRef(lang);
  useEffect(() => {
    langRef.current = lang;
  }, [lang]);

  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [micError, setMicError] = useState<string | null>(null);
  const recRef = useRef<SpeechRecognition | null>(null);
  const prefixRef = useRef("");
  const sessionFinalRef = useRef("");

  const supported = typeof window !== "undefined" && !!getSpeechRecognition();

  const stop = useCallback(() => {
    try {
      recRef.current?.stop();
    } catch {
      // ignore
    }
    recRef.current = null;
    setStatus("idle");
  }, []);

  const start = useCallback(
    (currentInput: string) => {
      const SR = getSpeechRecognition();
      if (!SR) {
        setStatus("unsupported");
        setMicError("Voice input is not supported in this browser.");
        return;
      }
      setMicError(null);
      prefixRef.current = currentInput;
      sessionFinalRef.current = "";

      const rec = new SR();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang =
        langRef.current ??
        (typeof navigator !== "undefined" ? navigator.language : "en-US");

      rec.onresult = (event: SpeechRecognitionEvent) => {
        let interim = "";
        let chunkFinal = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const r = event.results[i];
          const piece = r[0]?.transcript ?? "";
          if (r.isFinal) chunkFinal += piece;
          else interim += piece;
        }
        sessionFinalRef.current += chunkFinal;
        const base = prefixRef.current;
        const mid = sessionFinalRef.current;
        const glue =
          base && (mid || interim) && !base.endsWith(" ") && !mid.startsWith(" ")
            ? " "
            : "";
        const line = `${base}${glue}${mid}${interim}`;
        onTranscriptRef.current(line);
      };

      rec.onerror = (ev: Event) => {
        const err = ev as SpeechRecognitionErrorEvent;
        const code = err.error ?? "unknown";
        if (code === "not-allowed" || code === "service-not-allowed") {
          setMicError("Microphone permission denied.");
        } else if (code !== "aborted" && code !== "no-speech") {
          setMicError(`Voice: ${code}`);
        }
        setStatus("idle");
        recRef.current = null;
      };

      rec.onend = () => {
        if (recRef.current === rec) {
          recRef.current = null;
          setStatus("idle");
        }
      };

      try {
        rec.start();
        recRef.current = rec;
        setStatus("listening");
      } catch {
        setMicError("Could not start microphone.");
        setStatus("idle");
      }
    },
    []
  );

  return {
    status,
    micError,
    supported,
    start,
    stop,
    isListening: status === "listening",
  };
}
