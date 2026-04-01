"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ChatMessage, MemoryProfile } from "@/lib/types";
import { DEFAULT_VOICE_ID } from "@/lib/types";
import { resetOpeningExclusive } from "@/lib/openingGate";

const STORAGE_KEY = "memory:v1";

type MemoryState = {
  profile: MemoryProfile | null;
  messages: ChatMessage[];
};

type MemoryContextValue = MemoryState & {
  hydrated: boolean;
  setProfile: (p: MemoryProfile) => void;
  mergeProfile: (patch: Partial<MemoryProfile>) => void;
  appendMessage: (m: ChatMessage) => void;
  updateMessage: (id: string, content: string) => void;
  clearMemory: () => void;
};

const defaultState: MemoryState = {
  profile: null,
  messages: [],
};

const MemoryContext = createContext<MemoryContextValue | null>(null);

function normalizeProfile(raw: unknown): MemoryProfile | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Partial<MemoryProfile>;
  if (typeof p.name !== "string" || typeof p.description !== "string")
    return null;
  return {
    memoryId:
      typeof p.memoryId === "string" && p.memoryId.length > 0
        ? p.memoryId
        : "",
    name: p.name,
    imageDataUrl: typeof p.imageDataUrl === "string" ? p.imageDataUrl : "",
    description: p.description,
    relationship:
      typeof p.relationship === "string" ? p.relationship : "",
    voiceId:
      typeof p.voiceId === "string" && p.voiceId.length > 0
        ? p.voiceId
        : DEFAULT_VOICE_ID,
  };
}

function loadFromStorage(): MemoryState {
  if (typeof window === "undefined") return defaultState;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw) as MemoryState;
    if (!parsed || typeof parsed !== "object") return defaultState;
    return {
      profile: normalizeProfile(parsed.profile),
      messages: Array.isArray(parsed.messages) ? parsed.messages : [],
    };
  } catch {
    return defaultState;
  }
}

function persist(state: MemoryState) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* quota */
  }
}

export function MemoryProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfileState] = useState<MemoryProfile | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const s = loadFromStorage();
    // Hydrate from sessionStorage once on mount (client-only).
    queueMicrotask(() => {
      setProfileState(s.profile);
      setMessages(s.messages);
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    persist({ profile, messages });
  }, [profile, messages, hydrated]);

  const setProfile = useCallback((p: MemoryProfile) => {
    resetOpeningExclusive();
    setProfileState({
      ...p,
      voiceId: p.voiceId || DEFAULT_VOICE_ID,
      relationship: p.relationship ?? "",
      memoryId: p.memoryId || "",
    });
    setMessages([]);
  }, []);

  const mergeProfile = useCallback((patch: Partial<MemoryProfile>) => {
    setProfileState((prev) =>
      prev
        ? {
            ...prev,
            ...patch,
            voiceId: patch.voiceId ?? prev.voiceId,
            relationship: patch.relationship ?? prev.relationship,
            memoryId: patch.memoryId ?? prev.memoryId,
          }
        : null
    );
  }, []);

  const appendMessage = useCallback((m: ChatMessage) => {
    setMessages((prev) => [...prev, m]);
  }, []);

  const updateMessage = useCallback((id: string, content: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, content } : m))
    );
  }, []);

  const clearMemory = useCallback(() => {
    resetOpeningExclusive();
    setProfileState(null);
    setMessages([]);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const value = useMemo<MemoryContextValue>(
    () => ({
      profile,
      messages,
      hydrated,
      setProfile,
      mergeProfile,
      appendMessage,
      updateMessage,
      clearMemory,
    }),
    [
      profile,
      messages,
      hydrated,
      setProfile,
      mergeProfile,
      appendMessage,
      updateMessage,
      clearMemory,
    ]
  );

  return (
    <MemoryContext.Provider value={value}>{children}</MemoryContext.Provider>
  );
}

export function useMemory() {
  const ctx = useContext(MemoryContext);
  if (!ctx) throw new Error("useMemory must be used within MemoryProvider");
  return ctx;
}
