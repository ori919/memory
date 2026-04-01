"use client";

export function TypingIndicator() {
  return (
    <div
      className="flex items-center gap-1.5 rounded-2xl rounded-bl-md bg-stone-100 px-4 py-3 shadow-sm"
      aria-live="polite"
      aria-label="They are typing"
    >
      <span className="h-2 w-2 animate-bounce rounded-full bg-stone-400 [animation-delay:-0.2s]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-stone-400 [animation-delay:-0.1s]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-stone-400" />
    </div>
  );
}
