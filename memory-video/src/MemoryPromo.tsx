import type { ReactNode } from "react";
import {
  AbsoluteFill,
  interpolate,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const BG = "#faf8f5";
const FG = "#1c1917";
const MUTED = "#78716c";
const ACCENT = "#0d9488";

function Section({
  children,
  from,
  durationInFrames,
}: {
  children: ReactNode;
  from: number;
  durationInFrames: number;
}) {
  return (
    <Sequence from={from} durationInFrames={durationInFrames}>
      {children}
    </Sequence>
  );
}

function FadeIn({ children }: { children: ReactNode }) {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 18], [0, 1], {
    extrapolateRight: "clamp",
  });
  const y = interpolate(frame, [0, 20], [18, 0], { extrapolateRight: "clamp" });
  return (
    <div style={{ opacity, transform: `translateY(${y}px)` }}>{children}</div>
  );
}

/** Edit beats, copy, and timings here (frame = second × 30 at 30fps). */
export const MemoryPromo = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const subtle = interpolate(
    frame % (fps * 8),
    [0, fps * 4, fps * 8],
    [0.03, 0.06, 0.03]
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BG,
        fontFamily: "Georgia, 'Times New Roman', serif",
        color: FG,
      }}
    >
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 120% 80% at 50% 0%, rgba(13,148,136,${subtle}) 0%, transparent 55%)`,
        }}
      />

      {/* 0–8s — hook */}
      <Section from={0} durationInFrames={8 * 30}>
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            padding: 80,
            textAlign: "center",
          }}
        >
          <FadeIn>
            <h1
              style={{
                fontSize: 96,
                fontWeight: 400,
                letterSpacing: "-0.03em",
                margin: 0,
                lineHeight: 1.05,
              }}
            >
              Memory
            </h1>
            <p
              style={{
                fontSize: 34,
                color: MUTED,
                marginTop: 24,
                maxWidth: 1000,
                lineHeight: 1.45,
                fontFamily: "system-ui, sans-serif",
                fontWeight: 400,
              }}
            >
              A quiet space on the edge — remember someone you love.
            </p>
          </FadeIn>
        </AbsoluteFill>
      </Section>

      {/* 8–22s — stack */}
      <Section from={8 * 30} durationInFrames={14 * 30}>
        <AbsoluteFill style={{ padding: "100px 120px" }}>
          <FadeIn>
            <p
              style={{
                fontSize: 22,
                color: ACCENT,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                fontFamily: "system-ui, sans-serif",
                marginBottom: 20,
              }}
            >
              Built on Cloudflare
            </p>
            <h2
              style={{
                fontSize: 56,
                fontWeight: 400,
                margin: "0 0 32px",
                maxWidth: 1400,
                lineHeight: 1.15,
              }}
            >
              Workers · Durable Objects · Workers AI
            </h2>
            <p
              style={{
                fontSize: 32,
                color: MUTED,
                maxWidth: 1200,
                lineHeight: 1.5,
                fontFamily: "system-ui, sans-serif",
              }}
            >
              Persistent memory per conversation — stateful agents that stay with
              you, not a stateless reply.
            </p>
          </FadeIn>
        </AbsoluteFill>
      </Section>

      {/* 22–38s — voice */}
      <Section from={22 * 30} durationInFrames={16 * 30}>
        <AbsoluteFill style={{ padding: "100px 120px" }}>
          <FadeIn>
            <p
              style={{
                fontSize: 22,
                color: ACCENT,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                fontFamily: "system-ui, sans-serif",
                marginBottom: 20,
              }}
            >
              ElevenLabs
            </p>
            <h2
              style={{
                fontSize: 56,
                fontWeight: 400,
                margin: "0 0 32px",
                lineHeight: 1.15,
              }}
            >
              Voice that carries them
            </h2>
            <p
              style={{
                fontSize: 32,
                color: MUTED,
                maxWidth: 1200,
                lineHeight: 1.5,
                fontFamily: "system-ui, sans-serif",
              }}
            >
              Text-to-speech and voice clone — hear them again, on your terms.
            </p>
          </FadeIn>
        </AbsoluteFill>
      </Section>

      {/* 38–52s — CTA story */}
      <Section from={38 * 30} durationInFrames={14 * 30}>
        <AbsoluteFill
          style={{
            justifyContent: "center",
            padding: 80,
            textAlign: "center",
          }}
        >
          <FadeIn>
            <p
              style={{
                fontSize: 40,
                lineHeight: 1.45,
                maxWidth: 1100,
                margin: "0 auto",
              }}
            >
              Cloudflare&apos;s edge + ElevenLabs&apos; voice — a small app with a
              big heart.
            </p>
          </FadeIn>
        </AbsoluteFill>
      </Section>

      {/* 52–60s — outro */}
      <Section from={52 * 30} durationInFrames={8 * 30}>
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            padding: 80,
          }}
        >
          <FadeIn>
            <p
              style={{
                fontSize: 28,
                color: MUTED,
                fontFamily: "system-ui, sans-serif",
                marginBottom: 16,
              }}
            >
              Try it live
            </p>
            <p
              style={{
                fontSize: 42,
                color: FG,
                fontWeight: 500,
                fontFamily: "system-ui, sans-serif",
              }}
            >
              memory.ori99t.workers.dev
            </p>
            <p
              style={{
                fontSize: 24,
                color: MUTED,
                marginTop: 32,
                fontFamily: "system-ui, sans-serif",
              }}
            >
              Replace this URL in the code with your final demo link.
            </p>
          </FadeIn>
        </AbsoluteFill>
      </Section>
    </AbsoluteFill>
  );
};
