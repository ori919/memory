"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useMemory } from "@/context/MemoryContext";
import { postMemory } from "@/lib/api";
import { DEFAULT_VOICE_ID } from "@/lib/types";

const MAX_AUDIO_BYTES = 25 * 1024 * 1024;
const ACCEPT_AUDIO = "audio/mpeg,audio/mp4,audio/x-m4a,audio/wav,.mp3,.mp4,.m4a,.wav";

function monogramLetters(name: string): string {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length >= 2) return (p[0][0] + p[1][0]).toUpperCase();
  if (p.length === 1 && p[0].length >= 2) return p[0].slice(0, 2).toUpperCase();
  return p[0]?.charAt(0).toUpperCase() ?? "?";
}

const LOADING_LABELS = [
  "Cloning voice…",
  "Building personality…",
  "Almost there…",
];

export function Onboarding() {
  const router = useRouter();
  const { profile, setProfile, clearMemory } = useMemory();
  const nameId = useId();
  const aboutId = useId();
  const relationshipId = useId();
  const fileId = useId();
  const audioId = useId();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [name, setName] = useState("");
  const [about, setAbout] = useState("");
  const [relationship, setRelationship] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadPhase, setLoadPhase] = useState(0);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setAbout(profile.description);
      setRelationship(profile.relationship ?? "");
      setImageDataUrl(profile.imageDataUrl);
    }
  }, [profile]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    if (!submitting) return;
    const t = window.setInterval(() => {
      setLoadPhase((p) => (p + 1) % LOADING_LABELS.length);
    }, 1500);
    return () => window.clearInterval(t);
  }, [submitting]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!audioFile || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let cancelled = false;
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    const drawWidth = Math.max(120, Math.floor(canvas.offsetWidth || 240));

    void audioFile.arrayBuffer().then((ab) => {
      if (cancelled) return;
      const AudioCtx =
        typeof window !== "undefined"
          ? window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
          : null;
      if (!AudioCtx) return;
      const ac = new AudioCtx();
      return ac.decodeAudioData(ab.slice(0)).then((buffer) => {
        if (cancelled) return;
        const data = buffer.getChannelData(0);
        const h = 40;
        canvas.width = drawWidth * dpr;
        canvas.height = h * dpr;
        canvas.style.width = `${drawWidth}px`;
        canvas.style.height = `${h}px`;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, drawWidth, h);
        ctx.strokeStyle = "#a8a29e";
        ctx.lineWidth = 1.25;
        const mid = h / 2;
        const step = Math.max(1, Math.floor(data.length / drawWidth));
        for (let x = 0; x < drawWidth; x++) {
          let min = 0;
          let max = 0;
          const start = x * step;
          for (let j = 0; j < step && start + j < data.length; j++) {
            const v = data[start + j];
            if (v < min) min = v;
            if (v > max) max = v;
          }
          const y1 = mid + min * (mid - 4);
          const y2 = mid + max * (mid - 4);
          ctx.beginPath();
          ctx.moveTo(x + 0.5, y1);
          ctx.lineTo(x + 0.5, y2);
          ctx.stroke();
        }
      });
    });

    return () => {
      cancelled = true;
    };
  }, [audioFile]);

  const onFile = useCallback((file: File | null) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setImageDataUrl(reader.result);
    };
    reader.readAsDataURL(file);
  }, []);

  const onAudio = useCallback((file: File | null) => {
    setAudioError(null);
    if (!file) {
      setAudioFile(null);
      return;
    }
    if (file.size > MAX_AUDIO_BYTES) {
      setAudioError("Please use a file under 25MB.");
      setAudioFile(null);
      return;
    }
    setAudioFile(file);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    const desc = about.trim();
    if (!trimmed || !desc) return;

    setSubmitting(true);
    setLoadPhase(0);

    let voiceId = DEFAULT_VOICE_ID;

    try {
      if (audioFile) {
        const fd = new FormData();
        fd.append("name", trimmed);
        fd.append("audioFile", audioFile);

        const res = await fetch("/api/clone-voice", {
          method: "POST",
          body: fd,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(
            typeof err === "object" && err && "error" in err
              ? String((err as { error?: string }).error)
              : "Voice clone failed"
          );
        }
        const data = (await res.json()) as { voiceId?: string };
        if (data.voiceId) voiceId = data.voiceId;
      }

      const memoryId =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      await postMemory({
        id: memoryId,
        name: trimmed,
        personalityDescription: desc,
        imageUrl: imageDataUrl || "",
        relationship: relationship.trim(),
        voiceId,
      });

      setProfile({
        memoryId,
        name: trimmed,
        imageDataUrl,
        description: desc,
        relationship: relationship.trim(),
        voiceId,
      });
      requestAnimationFrame(() => {
        router.push("/chat");
      });
    } catch (err) {
      setAudioError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit =
    name.trim().length > 0 && about.trim().length > 0 && !submitting;

  const mono = monogramLetters(name);

  const fieldClass =
    "w-full rounded-xl border border-stone-200/90 bg-white/60 px-3 py-2.5 text-[15px] leading-snug text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-300 focus:bg-white/90 focus:ring-2 focus:ring-stone-200/50 disabled:opacity-50";

  return (
    <div className="fixed inset-0 z-0 flex h-dvh max-h-dvh flex-col overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url(/memory-bg.png)" }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/55 via-[#faf8f5]/75 to-[#f3eee8]/85"
        aria-hidden
      />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col px-4 py-3 sm:px-6 md:py-4">
        <div className="memory-fade-up mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col gap-3 lg:gap-5">
          {profile && (
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/60 bg-white/45 px-4 py-2.5 shadow-sm backdrop-blur-xl sm:justify-center">
              <p className="text-center text-xs text-stone-700 sm:text-sm">
                Memory for{" "}
                <span className="font-medium text-stone-900">{profile.name}</span>
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Link
                  href="/chat"
                  className="rounded-full bg-stone-900 px-4 py-1.5 text-xs font-medium text-white transition hover:bg-stone-800 sm:text-sm"
                >
                  Continue
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    clearMemory();
                    setName("");
                    setAbout("");
                    setRelationship("");
                    setImageDataUrl("");
                    setAudioFile(null);
                  }}
                  className="rounded-full border border-stone-200/90 bg-white/60 px-4 py-1.5 text-xs font-medium text-stone-600 backdrop-blur-sm transition hover:bg-white/90 sm:text-sm"
                >
                  Start over
                </button>
              </div>
            </div>
          )}

          <div className="flex min-h-0 flex-1 flex-col gap-3 lg:flex-row lg:items-stretch lg:gap-8">
            <header className="flex shrink-0 flex-col items-center text-center lg:w-[min(100%,280px)] lg:items-start lg:text-left">
              <p className="font-serif text-3xl tracking-tight text-stone-900 sm:text-4xl">
                Memory
              </p>
              <p className="mt-1 max-w-xs text-pretty text-sm leading-snug text-stone-700 sm:text-[15px]">
                A quiet space to remember someone you love.
              </p>

              <div className="mt-4 w-full max-w-[240px]">
                <span className="mb-1.5 block text-xs font-medium tracking-wide text-stone-600">
                  Photo
                </span>
                <input
                  ref={fileRef}
                  id={fileId}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  disabled={submitting}
                  onChange={(e) => onFile(e.target.files?.[0] ?? null)}
                />
                <div
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ")
                      fileRef.current?.click();
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    onFile(e.dataTransfer.files[0] ?? null);
                  }}
                  onClick={() => fileRef.current?.click()}
                  className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-3 py-5 transition ${
                    dragOver
                      ? "border-stone-400 bg-white/50"
                      : "border-stone-200/90 bg-white/35 hover:border-stone-300 hover:bg-white/50"
                  }`}
                >
                  {imageDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imageDataUrl}
                      alt=""
                      className="h-24 w-24 rounded-xl object-cover shadow-md"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-[#e8ddd4]/90 font-serif text-2xl font-medium text-stone-800 shadow-inner">
                      {mono}
                    </div>
                  )}
                  <p className="mt-2 text-center text-[11px] text-stone-600">
                    Tap or drop — optional
                  </p>
                </div>
              </div>
            </header>

            <form
              onSubmit={(e) => void handleSubmit(e)}
              className="flex min-h-0 flex-1 flex-col rounded-3xl border border-white/70 bg-white/45 p-4 shadow-[0_12px_48px_-16px_rgba(0,0,0,0.12)] backdrop-blur-xl sm:p-5"
            >
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pr-0.5 [-ms-overflow-style:none] [scrollbar-width:thin] sm:space-y-3.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-stone-300/80">
                <div className="space-y-1.5">
                  <label
                    htmlFor={nameId}
                    className="block text-xs font-medium tracking-wide text-stone-700"
                  >
                    Their name
                  </label>
                  <input
                    id={nameId}
                    type="text"
                    autoComplete="name"
                    placeholder="e.g. Mom"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={submitting}
                    className={fieldClass}
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor={aboutId}
                    className="block text-xs font-medium tracking-wide text-stone-700"
                  >
                    Tell us about them
                  </label>
                  <textarea
                    id={aboutId}
                    rows={3}
                    placeholder="Personality, memories, tone…"
                    value={about}
                    onChange={(e) => setAbout(e.target.value)}
                    disabled={submitting}
                    className={`${fieldClass} min-h-[4.25rem] resize-none`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor={relationshipId}
                    className="block text-xs font-medium tracking-wide text-stone-700"
                  >
                    Your relationship to them
                  </label>
                  <input
                    id={relationshipId}
                    type="text"
                    placeholder="e.g. my grandmother…"
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    disabled={submitting}
                    className={fieldClass}
                  />
                </div>

                <div className="space-y-1.5">
                  <span className="block text-xs font-medium tracking-wide text-stone-700">
                    Upload their voice
                  </span>
                  <p className="text-[11px] leading-snug text-stone-600">
                    Voicemail, clip, or recording — even ~30s. Optional.
                  </p>
                  <input
                    ref={audioRef}
                    id={audioId}
                    type="file"
                    accept={ACCEPT_AUDIO}
                    className="sr-only"
                    disabled={submitting}
                    onChange={(e) => onAudio(e.target.files?.[0] ?? null)}
                  />
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => audioRef.current?.click()}
                    className={`${fieldClass} text-left text-sm`}
                  >
                    {audioFile ? audioFile.name : "Choose audio (optional)"}
                  </button>
                  <p className="text-[10px] text-stone-500">
                    MP3, MP4, M4A, WAV · max 25MB
                  </p>
                  {audioError && (
                    <p className="text-xs text-red-700/90" role="alert">
                      {audioError}
                    </p>
                  )}
                  {audioFile && (
                    <div
                      className={`overflow-hidden rounded-xl border border-stone-200/80 bg-white/50 px-3 py-2 ${
                        submitting && audioFile ? "animate-pulse" : ""
                      }`}
                    >
                      <canvas
                        ref={canvasRef}
                        className="h-10 w-full max-w-[240px]"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3 shrink-0 border-t border-white/50 pt-3">
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="w-full rounded-xl bg-stone-900 px-6 py-3 text-[15px] font-medium text-white shadow-md transition enabled:hover:bg-stone-800 enabled:active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {submitting ? LOADING_LABELS[loadPhase] : "Create Memory"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
