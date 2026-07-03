import React from "react";
import {
  AbsoluteFill,
  Audio,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import { color, display, serif, expo } from "./theme";
import { Captions, Word } from "./Captions";
import * as Icons from "lucide-react";

export type Props = {
  topic: string;
  hook: string;
  audioDurationSec: number;
  words: Word[];
  accentIcon?: string;
};

const Grain: React.FC = () => (
  <AbsoluteFill style={{ opacity: 0.05, mixBlendMode: "overlay", pointerEvents: "none" }}>
    <svg width="100%" height="100%">
      <filter id="grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" />
      </filter>
      <rect width="100%" height="100%" filter="url(#grain)" />
    </svg>
  </AbsoluteFill>
);

export const FactExplainer: React.FC<Props> = ({ topic, hook, words, accentIcon }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const drift = interpolate(frame, [0, durationInFrames], [0, 1]);
  const progress = interpolate(frame, [0, durationInFrames], [0, 100]);
  const Icon = (accentIcon && (Icons as any)[accentIcon]) || Icons.Atom;

  const hookIn = interpolate(t, [0.1, 0.7], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: expo,
  });
  const hookOut = interpolate(t, [1.9, 2.5], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: color.bg, fontFamily: display }}>
      {/* depth: one large soft brand field slowly drifting (flat, not a glow-accent) */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(58% 38% at ${28 + drift * 44}% ${26 + drift * 12}%, oklch(0.42 0.12 245 / 0.6), transparent 62%)`,
        }}
      />
      {/* vignette toward the deep brand tone */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(120% 78% at 50% 36%, transparent 42%, oklch(0.12 0.05 264 / 0.7) 100%)",
          pointerEvents: "none",
        }}
      />
      <Grain />

      {/* top: icon + topic */}
      <div
        style={{
          position: "absolute",
          top: 70,
          left: 70,
          right: 70,
          display: "flex",
          alignItems: "center",
          gap: 22,
        }}
      >
        <Icon size={48} color={color.accent} strokeWidth={2.4} />
        <span
          style={{
            fontFamily: display,
            fontWeight: 700,
            fontSize: 38,
            letterSpacing: "0.01em",
            color: color.ink,
            textTransform: "uppercase",
          }}
        >
          {topic}
        </span>
      </div>
      {/* progress bar */}
      <div
        style={{
          position: "absolute",
          top: 150,
          left: 70,
          right: 70,
          height: 6,
          borderRadius: 3,
          background: "oklch(1 0 0 / 0.14)",
          overflow: "hidden",
        }}
      >
        <div style={{ height: "100%", width: `${progress}%`, background: color.accent }} />
      </div>

      {/* intro hook (editorial serif, contrast to the sans captions) */}
      {t < 2.6 && (
        <AbsoluteFill
          style={{ justifyContent: "center", alignItems: "center", padding: "0 100px", opacity: hookOut }}
        >
          <div
            style={{
              transform: `translateY(${(1 - hookIn) * 56}px)`,
              opacity: hookIn,
              textAlign: "center",
              fontFamily: serif,
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: 130,
              lineHeight: 1.0,
              color: color.ink,
              textShadow: "0 8px 40px oklch(0.15 0.055 264 / 0.7)",
            }}
          >
            {hook}
          </div>
        </AbsoluteFill>
      )}

      {/* word-timed captions for the body */}
      {t >= 2.3 && <Captions words={words} />}

      <Audio src={staticFile("narration.wav")} />
    </AbsoluteFill>
  );
};
