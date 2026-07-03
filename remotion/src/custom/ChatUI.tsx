import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { color, display, expo } from "../theme";
import { BrandLogo } from "../ui";

const ease = (f: number, a: number, b: number) =>
  interpolate(f, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: expo });

const ChatUI: React.FC<any> = () => {
  const frame = useCurrentFrame();

  const panelIn = ease(frame, 0, 18);
  const userIn = ease(frame, 12, 28);
  const aiIn = ease(frame, 32, 48);
  const tagIn = ease(frame, 52, 66);

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        paddingTop: "22%",
        paddingBottom: "28%",
      }}
    >
      {/* Chat panel */}
      <div
        style={{
          width: "84%",
          opacity: panelIn,
          transform: `translateY(${(1 - panelIn) * 40}px)`,
          backgroundColor: color.surface,
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: "0 12px 60px rgba(0,0,0,0.7)",
          border: `1px solid ${color.stroke}`,
        }}
      >
        {/* Header bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "22px 24px",
            borderBottom: `1px solid ${color.stroke}`,
            backgroundColor: color.panel,
          }}
        >
          <BrandLogo slug="openai" size={34} tone="ink" />
          <span
            style={{
              fontFamily: display,
              fontSize: 32,
              fontWeight: 700,
              color: color.ink,
              letterSpacing: "0.01em",
            }}
          >
            ChatGPT
          </span>
          {/* Model badge */}
          <span
            style={{
              marginLeft: "auto",
              fontFamily: display,
              fontSize: 22,
              fontWeight: 600,
              color: color.brand,
              backgroundColor: color.surface,
              border: `1px solid ${color.stroke}`,
              borderRadius: 8,
              padding: "4px 12px",
            }}
          >
            GPT-4o
          </span>
        </div>

        {/* Chat messages */}
        <div style={{ padding: "24px 20px", display: "flex", flexDirection: "column", gap: 18 }}>
          {/* User message — right aligned */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              opacity: userIn,
              transform: `translateY(${(1 - userIn) * 24}px)`,
            }}
          >
            <div
              style={{
                backgroundColor: color.surfaceHi,
                borderRadius: "18px 18px 4px 18px",
                padding: "16px 20px",
                maxWidth: "72%",
                border: `1px solid rgba(155,177,207,0.18)`,
              }}
            >
              <span
                style={{
                  fontFamily: display,
                  fontSize: 28,
                  color: color.ink,
                  lineHeight: 1.45,
                }}
              >
                Can machines be conscious?
              </span>
            </div>
          </div>

          {/* AI response — left aligned */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-start",
              opacity: aiIn,
              transform: `translateY(${(1 - aiIn) * 24}px)`,
            }}
          >
            <div
              style={{
                backgroundColor: color.panel,
                borderRadius: "18px 18px 18px 4px",
                padding: "16px 20px",
                maxWidth: "86%",
                border: `1px solid ${color.stroke}`,
              }}
            >
              <span
                style={{
                  fontFamily: display,
                  fontSize: 27,
                  color: color.ink,
                  lineHeight: 1.5,
                }}
              >
                Whether machines can have{" "}
                <span style={{ color: color.accent }}>subjective experience</span>{" "}
                is deeply contested. They can model it, simulate it — but truly{" "}
                <span style={{ color: color.accent }}>experiencing</span>{" "}
                it? That's the open question.
              </span>
            </div>
          </div>
        </div>

        {/* Bottom tag */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: `1px solid ${color.stroke}`,
            opacity: tagIn,
            textAlign: "center",
          }}
        >
          <span
            style={{
              fontFamily: display,
              fontSize: 22,
              color: color.brand,
              letterSpacing: "0.1em",
            }}
          >
            perfect answer — but did it{" "}
            <span style={{ color: color.accent, fontWeight: 700 }}>understand?</span>
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default ChatUI;
