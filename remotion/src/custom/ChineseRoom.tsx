import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { color, display, serif, expo } from "../theme";
import { BookOpen, User2 } from "lucide-react";

const ease = (f: number, a: number, b: number) =>
  interpolate(f, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: expo });

// A floating "??" thought bubble rendered in SVG
const ThoughtBubble: React.FC<{ opacity: number }> = ({ opacity }) => (
  <svg
    width="80"
    height="54"
    viewBox="0 0 80 54"
    style={{ position: "absolute", top: -48, left: "50%", transform: "translateX(-50%)", opacity }}
  >
    {/* Main bubble */}
    <ellipse cx="38" cy="22" rx="34" ry="20" fill={color.surfaceHi} stroke={color.accent} strokeWidth="1.5" />
    {/* Tail dots */}
    <circle cx="22" cy="44" r="5" fill={color.surfaceHi} stroke={color.accent} strokeWidth="1.5" />
    <circle cx="14" cy="50" r="3" fill={color.surfaceHi} stroke={color.accent} strokeWidth="1.5" />
    {/* ? text */}
    <text x="38" y="28" textAnchor="middle" fontSize="20" fontWeight="800" fill={color.accent} fontFamily="sans-serif">??</text>
  </svg>
);

const ChineseRoom: React.FC<any> = () => {
  const frame = useCurrentFrame();

  const headerIn = ease(frame, 0, 16);
  const inputIn = ease(frame, 8, 24);
  const roomIn = ease(frame, 16, 32);
  const personIn = ease(frame, 22, 38);
  const outputIn = ease(frame, 36, 52);
  const insightIn = ease(frame, 48, 64);

  const arrowOpacity = ease(frame, 20, 36);

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        paddingTop: "22%",
        paddingBottom: "28%",
      }}
    >
      <div style={{ width: "90%", display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
        {/* Top attribution label */}
        <div
          style={{
            fontFamily: display,
            fontSize: 22,
            color: color.brand,
            letterSpacing: "0.18em",
            marginBottom: 28,
            opacity: headerIn,
          }}
        >
          JOHN SEARLE · 1980
        </div>

        {/* Main diagram row: input → room → output */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            width: "100%",
            gap: 0,
          }}
        >
          {/* ── INPUT column ── */}
          <div
            style={{
              flex: 1.4,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
              opacity: inputIn,
              transform: `translateX(${(1 - inputIn) * -36}px)`,
            }}
          >
            <div
              style={{
                fontFamily: serif,
                fontSize: 36,
                color: color.ink,
                lineHeight: 1.5,
                textAlign: "center",
                fontStyle: "italic",
              }}
            >
              我爱你
            </div>
            <div
              style={{
                fontFamily: serif,
                fontSize: 24,
                color: color.brand,
                textAlign: "center",
                fontStyle: "italic",
              }}
            >
              你好吗？
            </div>
            <div
              style={{
                marginTop: 6,
                fontFamily: display,
                fontSize: 18,
                color: color.brand,
                letterSpacing: "0.14em",
              }}
            >
              CHINESE IN
            </div>
          </div>

          {/* → arrow */}
          <div
            style={{
              fontSize: 44,
              color: color.accent,
              padding: "0 10px",
              opacity: arrowOpacity,
              lineHeight: 1,
            }}
          >
            →
          </div>

          {/* ── ROOM BOX ── */}
          <div
            style={{
              flex: 2.2,
              position: "relative",
              opacity: roomIn,
              backgroundColor: color.surface,
              border: `2px solid rgba(255,255,255,0.14)`,
              borderRadius: 16,
              padding: "26px 18px 20px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
            }}
          >
            {/* Thought bubble above person */}
            <ThoughtBubble opacity={ease(frame, 32, 48)} />

            {/* Person figure */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                opacity: personIn,
                transform: `translateY(${(1 - personIn) * 16}px)`,
              }}
            >
              <User2 size={42} color={color.ink} strokeWidth={1.5} />
            </div>

            {/* Rulebook badge */}
            <div
              style={{
                backgroundColor: color.surfaceHi,
                borderRadius: 10,
                padding: "10px 16px",
                border: `1px solid rgba(155,177,207,0.22)`,
                display: "flex",
                alignItems: "center",
                gap: 10,
                opacity: personIn,
              }}
            >
              <BookOpen size={22} color={color.accent} strokeWidth={1.5} />
              <span style={{ fontFamily: display, fontSize: 22, color: color.accent, fontWeight: 700 }}>
                RULEBOOK
              </span>
            </div>

            {/* Room label */}
            <div style={{ fontFamily: display, fontSize: 18, color: color.brand, letterSpacing: "0.14em" }}>
              THE ROOM
            </div>
          </div>

          {/* → arrow */}
          <div
            style={{
              fontSize: 44,
              color: color.accent,
              padding: "0 10px",
              opacity: arrowOpacity,
              lineHeight: 1,
            }}
          >
            →
          </div>

          {/* ── OUTPUT column ── */}
          <div
            style={{
              flex: 1.4,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
              opacity: outputIn,
              transform: `translateX(${(1 - outputIn) * 36}px)`,
            }}
          >
            <div
              style={{
                fontFamily: serif,
                fontSize: 30,
                color: color.ink,
                lineHeight: 1.5,
                textAlign: "center",
                fontStyle: "italic",
              }}
            >
              爱是复杂的
            </div>
            {/* Perfect check */}
            <div
              style={{
                fontFamily: display,
                fontSize: 26,
                color: color.accent,
                fontWeight: 800,
              }}
            >
              PERFECT ✓
            </div>
            <div
              style={{
                fontFamily: display,
                fontSize: 18,
                color: color.brand,
                letterSpacing: "0.14em",
              }}
            >
              CHINESE OUT
            </div>
          </div>
        </div>

        {/* Bottom insight strip */}
        <div
          style={{
            marginTop: 28,
            padding: "14px 22px",
            backgroundColor: "rgba(155,177,207,0.07)",
            borderRadius: 10,
            border: `1px solid rgba(155,177,207,0.18)`,
            textAlign: "center",
            opacity: insightIn,
            transform: `translateY(${(1 - insightIn) * 16}px)`,
          }}
        >
          <span style={{ fontFamily: display, fontSize: 24, color: color.ink }}>
            Zero Chinese knowledge.{" "}
            <span style={{ color: color.accent }}>Perfect output.</span>
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default ChineseRoom;
