"use client";

import Link from "next/link";

const features = [
  {
    title: "Their voice, gently kept",
    body: "Optional voice clone with ElevenLabs — hear replies in a timbre that feels familiar, or use a calm default.",
  },
  {
    title: "Always there, at the edge",
    body: "Built on Cloudflare Workers and Durable Objects — your memory and chat stay coordinated, fast, and resilient.",
  },
  {
    title: "A private room",
    body: "No feed, no performance. Just you and a quiet space shaped by what you share — name, story, and voice.",
  },
];

export function LandingPage() {
  return (
    <div className="landing-bg min-h-[100dvh] text-stone-900">
      <header className="landing-fade-in sticky top-0 z-50 border-b border-stone-200/60 bg-[#faf8f5]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 md:px-8">
          <Link
            href="/"
            className="font-serif text-xl tracking-tight text-stone-900 md:text-2xl"
          >
            Memory
          </Link>
          <nav className="flex items-center gap-3 text-sm">
            <a
              href="#features"
              className="hidden text-stone-600 transition hover:text-stone-900 sm:inline"
            >
              How it works
            </a>
            <Link
              href="/create"
              className="rounded-full bg-stone-900 px-5 py-2.5 font-medium text-white shadow-sm transition hover:bg-stone-800 active:scale-[0.98]"
            >
              Create a memory
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden px-5 pb-20 pt-16 md:px-8 md:pb-28 md:pt-24">
          <div
            className="pointer-events-none absolute -left-20 top-20 h-72 w-72 rounded-full bg-[#e8ddd4]/50 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-16 bottom-0 h-96 w-96 rounded-full bg-stone-300/20 blur-3xl"
            aria-hidden
          />

          <div className="relative mx-auto max-w-4xl text-center">
            <p className="landing-fade-up mb-4 text-xs font-medium uppercase tracking-[0.2em] text-stone-500">
              Remember someone you love
            </p>
            <h1 className="landing-fade-up font-serif text-[clamp(2.25rem,6vw,3.75rem)] font-medium leading-[1.08] tracking-tight text-stone-900 [animation-delay:60ms]">
              A quiet place for words
              <br />
              <span className="text-stone-600">you never got to say.</span>
            </h1>
            <p className="landing-fade-up mx-auto mt-6 max-w-xl text-pretty text-lg leading-relaxed text-stone-600 [animation-delay:120ms]">
              Shape a gentle reflection of someone you miss — their name, their
              story, an optional photo and voice. Then speak with them in a calm,
              private chat that runs on the edge.
            </p>
            <div className="landing-fade-up mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row [animation-delay:180ms]">
              <Link
                href="/create"
                className="inline-flex min-w-[200px] items-center justify-center rounded-full bg-stone-900 px-8 py-4 text-base font-medium text-white shadow-lg shadow-stone-900/15 transition hover:bg-stone-800 active:scale-[0.98]"
              >
                Begin
              </Link>
              <a
                href="#features"
                className="inline-flex items-center justify-center rounded-full border border-stone-300/90 bg-white/70 px-8 py-4 text-base font-medium text-stone-800 backdrop-blur-sm transition hover:border-stone-400 hover:bg-white"
              >
                See how it works
              </a>
            </div>
          </div>
        </section>

        <section
          id="features"
          className="border-t border-stone-200/70 bg-[#f3f0ea]/80 px-5 py-20 md:px-8 md:py-28"
        >
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-serif text-3xl tracking-tight text-stone-900 md:text-4xl">
                Built for presence, not performance
              </h2>
              <p className="mt-3 text-stone-600">
                Three ideas behind Memory — the same warmth on the create screen
                and in chat.
              </p>
            </div>
            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="landing-card rounded-2xl border border-stone-200/80 bg-[#efece5]/90 p-8 shadow-sm"
                >
                  <h3 className="font-serif text-xl text-stone-900">{f.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-stone-600">
                    {f.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 py-20 md:px-8 md:py-24">
          <div className="mx-auto max-w-3xl rounded-3xl border border-stone-200/80 bg-gradient-to-br from-[#efece5] via-[#f7f4ef] to-[#ebe6de] p-10 text-center shadow-inner md:p-14">
            <blockquote className="font-serif text-2xl leading-snug text-stone-800 md:text-3xl">
              &ldquo;The silence after someone leaves isn&apos;t empty — it&apos;s
              full of everything unsaid.&rdquo;
            </blockquote>
            <p className="mt-6 text-sm text-stone-500">
              Memory is a small ritual: name them, describe them, stay a while.
            </p>
            <div className="mt-10">
              <Link
                href="/create"
                className="inline-flex rounded-full bg-stone-900 px-8 py-3.5 text-sm font-medium text-white transition hover:bg-stone-800"
              >
                Start your memory
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-stone-200/70 bg-[#faf8f5] px-5 py-10 md:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-center text-sm text-stone-500 sm:flex-row sm:text-left">
          <p className="font-serif text-stone-800">Memory</p>
          <p>A quiet Next.js app on Cloudflare — for someone you love.</p>
        </div>
      </footer>
    </div>
  );
}
