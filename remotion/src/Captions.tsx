import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { color, display, expo } from "./theme";

export type Word = { word: string; start: number; end: number };

// Group words into short punchy caption chunks (≤3 words / ≤16 chars, break on sentence end).
function buildChunks(words: Word[]) {
  const chunks: { words: Word[]; start: number; end: number }[] = [];
  let cur: Word[] = [];
  const flush = () => {
    if (cur.length) {
      chunks.push({ words: cur, start: cur[0].start, end: cur[cur.length - 1].end });
      cur = [];
    }
  };
  for (const w of words) {
    cur.push(w);
    const text = cur.map((x) => x.word).join(" ");
    if (cur.length >= 3 || text.length >= 16 || /[.!?,]$/.test(w.word)) flush();
  }
  flush();
  return chunks;
}

export const Captions: React.FC<{ words: Word[]; fontSize?: number; bottom?: string }> = ({
  words,
  fontSize = 100,
  bottom = "26%",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const chunks = React.useMemo(() => buildChunks(words), [words]);
  if (!chunks.length) return null;

  let idx = 0;
  for (let i = 0; i < chunks.length; i++) if (chunks[i].start <= t + 0.05) idx = i;
  const chunk = chunks[idx];

  const entrance = interpolate(t, [chunk.start - 0.15, chunk.start + 0.22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: expo,
  });

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom,
        display: "flex",
        justifyContent: "center",
        padding: "0 90px",
      }}
    >
      <div
        style={{
          transform: `translateY(${(1 - entrance) * 44}px)`,
          opacity: entrance,
          display: "flex",
          flexWrap: "wrap",
          gap: "6px 20px",
          justifyContent: "center",
          fontFamily: display,
          fontWeight: 800,
          fontSize,
          lineHeight: 1.02,
          textAlign: "center",
          textTransform: "uppercase",
          letterSpacing: "-0.025em",
        }}
      >
        {chunk.words.map((w, i) => {
          const active = t >= w.start && t < w.end + 0.08;
          const spoken = t >= w.start - 0.02;
          const pop = active
            ? interpolate(t, [w.start, w.start + 0.13], [0.84, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: expo,
              })
            : 1;
          return (
            <span
              key={i}
              style={{
                color: active ? color.accent : spoken ? color.ink : color.dim,
                transform: `scale(${pop})`,
                display: "inline-block",
                textShadow: "0 6px 30px oklch(0.15 0.055 264 / 0.7)",
              }}
            >
              {w.word}
            </span>
          );
        })}
      </div>
    </div>
  );
};
