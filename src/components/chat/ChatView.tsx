"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useMemory } from "@/context/MemoryContext";
import { generateReply } from "@/lib/generateReply";
import { postMemory } from "@/lib/api";
import { runOpeningExclusive } from "@/lib/openingGate";
import type { ChatMessage } from "@/lib/types";
import { playVoice, stopSpeaking } from "@/lib/voice";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function ChatView() {
  const router = useRouter();
  const {
    profile,
    messages,
    appendMessage,
    updateMessage,
    mergeProfile,
    hydrated,
  } = useMemory();
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hydrated) return;
    if (!profile) router.replace("/");
  }, [profile, router, hydrated]);

  /** Migrate legacy sessions to edge-backed memory id */
  useEffect(() => {
    if (!hydrated || !profile || profile.memoryId) return;
    const id = crypto.randomUUID();
    void postMemory({
      id,
      name: profile.name,
      personalityDescription: profile.description,
      imageUrl: profile.imageDataUrl,
      relationship: profile.relationship,
      voiceId: profile.voiceId,
    })
      .then(() => mergeProfile({ memoryId: id }))
      .catch(() => {});
  }, [hydrated, profile, mergeProfile]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing, pendingId]);

  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  const runOpeningMessage = useCallback(async () => {
    if (!profile?.memoryId) return;

    const assistantId = uid();
    appendMessage({
      id: assistantId,
      role: "assistant",
      content: "",
      createdAt: Date.now(),
    });
    setTyping(true);
    setPendingId(assistantId);

    try {
      const full = await generateReply("__INIT__", profile.memoryId);
      updateMessage(assistantId, full);
      setPendingId(null);
      window.setTimeout(() => {
        void playVoice(full, profile.voiceId).catch(() => {});
      }, 1500);
    } catch {
      setTyping(false);
      setPendingId(null);
      updateMessage(
        assistantId,
        "…I wish I could find the right words. Try again in a moment."
      );
    } finally {
      setTyping(false);
      setPendingId(null);
    }
  }, [appendMessage, profile, updateMessage]);

  useEffect(() => {
    if (!hydrated || !profile?.memoryId || messages.length > 0) return;
    runOpeningExclusive(() => runOpeningMessage());
  }, [hydrated, profile?.memoryId, messages.length, runOpeningMessage]);

  const send = useCallback(async () => {
    if (!profile?.memoryId) return;
    const text = input.trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: uid(),
      role: "user",
      content: text,
      createdAt: Date.now(),
    };
    appendMessage(userMsg);
    setInput("");

    const assistantId = uid();
    appendMessage({
      id: assistantId,
      role: "assistant",
      content: "",
      createdAt: Date.now(),
    });
    setTyping(true);
    setPendingId(assistantId);

    try {
      const full = await generateReply(text, profile.memoryId);
      updateMessage(assistantId, full);
    } catch {
      updateMessage(
        assistantId,
        "…I couldn't reach you just then. Try sending that again."
      );
    } finally {
      setTyping(false);
      setPendingId(null);
    }
  }, [appendMessage, input, profile, updateMessage]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  };

  if (!hydrated) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#fafaf9] text-stone-500">
        <p className="memory-fade-in text-sm tracking-wide">Loading…</p>
      </div>
    );
  }

  if (!profile) return null;

  const initial = profile.name.trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-[#fafaf9]">
      <header className="sticky top-0 z-10 border-b border-stone-200/80 bg-[#fafaf9]/95 px-4 py-4 backdrop-blur-md md:px-8">
        <div className="mx-auto flex max-w-3xl items-center gap-4">
          <Link
            href="/"
            className="text-sm text-stone-500 transition hover:text-stone-800"
          >
            ← Back
          </Link>
          <div className="flex min-w-0 flex-1 items-center gap-4">
            {profile.imageDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.imageDataUrl}
                alt=""
                className="h-12 w-12 shrink-0 rounded-2xl object-cover shadow-sm ring-1 ring-stone-200/80"
              />
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#e8ddd4] font-serif text-xl text-stone-700 ring-1 ring-stone-200/80">
                {initial}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="truncate font-serif text-2xl tracking-tight text-stone-900">
                {profile.name}
              </h1>
              <p className="truncate text-sm text-stone-500">Memory</p>
            </div>
          </div>
        </div>
      </header>

      <div
        ref={listRef}
        className="relative mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 overflow-y-auto px-4 py-8 md:px-8"
      >
        <div
          className="pointer-events-none sticky top-0 z-[1] -mx-4 -mt-8 mb-0 h-16 bg-gradient-to-b from-[#fafaf9] via-[#fafaf9]/90 to-transparent md:-mx-8"
          aria-hidden
        />

        {messages.length === 0 && !typing && (
          <div className="memory-fade-in flex flex-1 flex-col items-center justify-center gap-3 py-20 text-center">
            <p className="max-w-sm font-serif text-2xl text-stone-700">
              Say something.
            </p>
            <p className="max-w-xs text-stone-500">
              They&apos;re listening — in the way only you can describe.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {messages.map((m) => (
            <MessageBubble
              key={m.id}
              message={m}
              isAssistant={m.role === "assistant"}
              playingId={playingId}
              onPlayState={setPlayingId}
              voiceId={profile.voiceId}
              isStreaming={pendingId === m.id}
              streamComplete={
                m.role !== "assistant" ||
                (pendingId !== m.id && m.content.trim().length > 0)
              }
            />
          ))}
          {typing && <TypingIndicator />}
        </div>
        <div ref={bottomRef} />
      </div>

      <div className="sticky bottom-0 border-t border-stone-200/80 bg-[#fafaf9]/95 px-4 py-3 backdrop-blur-md md:px-8">
        <div className="mx-auto flex max-w-3xl flex-col gap-2">
          <div className="flex items-center justify-between gap-3 text-[11px] text-stone-500">
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.2)]"
                aria-hidden
              />
              Running on Cloudflare Edge
            </span>
            <span className="hidden sm:inline">Global · low-latency</span>
          </div>
          <div className="flex gap-3">
            <textarea
              rows={1}
              placeholder={`Say something to ${profile.name}…`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={typing || pendingId !== null || !profile.memoryId}
              className="max-h-40 min-h-[52px] flex-1 resize-none rounded-2xl border border-stone-200 bg-white px-4 py-3.5 text-[17px] leading-relaxed text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-stone-300 focus:ring-2 focus:ring-stone-200/60 disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => {
                stopSpeaking();
                void send();
              }}
              disabled={
                !input.trim() ||
                typing ||
                pendingId !== null ||
                !profile.memoryId
              }
              className="shrink-0 self-end rounded-2xl bg-stone-900 px-6 py-3.5 text-sm font-medium text-white shadow-sm transition enabled:hover:bg-stone-800 enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
