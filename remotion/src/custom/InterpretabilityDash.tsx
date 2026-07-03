import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { color, display, expo } from "../theme";
import { BrandLogo } from "../ui";

const ease = (f: number, a: number, b: number) =>
  interpolate(f, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: expo });

// Positions in a 480×300 logical coordinate space (scaled to panel)
const COL1 = 80, COL2 = 250, COL3 = 420;

const FEATURES = [
  { label: "love", y: 38 },
  { label: "choice", y: 108 },
  { label: "emotion", y: 178 },
  { label: "recur", y: 248 },
];

const CONCEPTS = [
  { label: "FEELING", y: 73 },
  { label: "RELAT.", y: 210 },
];

const OUTPUT_Y = 143;

// Which connections are the "active" traced circuit
type Conn = { x1: number; y1: number; x2: number; y2: number; active: boolean; delay: number };
const CONNECTIONS: Conn[] = [
  { x1: COL1 + 42, y1: 38, x2: COL2 - 42, y2: 73, active: true, delay: 20 },
  { x1: COL1 + 42, y1: 108, x2: COL2 - 42, y2: 73, active: true, delay: 25 },
  { x1: COL1 + 42, y1: 178, x2: COL2 - 42, y2: 73, active: false, delay: 28 },
  { x1: COL1 + 42, y1: 178, x2: COL2 - 42, y2: 210, active: false, delay: 28 },
  { x1: COL1 + 42, y1: 248, x2: COL2 - 42, y2: 210, active: false, delay: 32 },
  { x1: COL2 + 42, y1: 73, x2: COL3 - 42, y2: OUTPUT_Y, active: true, delay: 36 },
  { x1: COL2 + 42, y1: 210, x2: COL3 - 42, y2: OUTPUT_Y, active: false, delay: 36 },
];

const InterpretabilityDash: React.FC<any> = () => {
  const frame = useCurrentFrame();

  const panelIn = ease(frame, 0, 18);
  const headerIn = ease(frame, 6, 22);
  const graphIn = ease(frame, 14, 30);

  // Scale factor: panel SVG is 480×300, rendered in CSS at ~740px wide
  const svgW = 480, svgH = 300;

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        paddingTop: "22%",
        paddingBottom: "28%",
      }}
    >
      <div
        style={{
          width: "86%",
          opacity: panelIn,
          transform: `translateY(${(1 - panelIn) * 40}px)`,
          backgroundColor: color.surface,
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: "0 12px 60px rgba(0,0,0,0.7)",
          border: `1px solid ${color.stroke}`,
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "20px 24px",
            borderBottom: `1px solid ${color.stroke}`,
            backgroundColor: color.panel,
            opacity: headerIn,
          }}
        >
          <BrandLogo slug="anthropic" size={32} tone="ink" />
          <div>
            <div style={{ fontFamily: display, fontSize: 28, fontWeight: 700, color: color.ink }}>
              ANTHROPIC RESEARCH
            </div>
            <div style={{ fontFamily: display, fontSize: 20, color: color.brand, marginTop: 2 }}>
              Circuit Tracing · Claude 3 · 2025
            </div>
          </div>
          {/* Status badge */}
          <div
            style={{
              marginLeft: "auto",
              backgroundColor: color.surfaceHi,
              border: `1px solid rgba(155,177,207,0.3)`,
              borderRadius: 8,
              padding: "6px 14px",
            }}
          >
            <span style={{ fontFamily: display, fontSize: 20, color: color.accent, fontWeight: 700 }}>
              LIVE
            </span>
          </div>
        </div>

        {/* ── Attribution graph ── */}
        <div style={{ position: "relative", width: "100%", opacity: graphIn }}>
          {/* SVG lines FIRST (behind nodes) */}
          <svg
            viewBox={`0 0 ${svgW} ${svgH}`}
            style={{ width: "100%", display: "block" }}
          >
            {CONNECTIONS.map((c, i) => {
              const prog = ease(frame, c.delay, c.delay + 14);
              return (
                <line
                  key={i}
                  x1={c.x1} y1={c.y1} x2={c.x2} y2={c.y2}
                  stroke={c.active ? color.accent : "rgba(255,255,255,0.1)"}
                  strokeWidth={c.active ? 2.5 : 1.2}
                  strokeDasharray={c.active ? "8 4" : "4 6"}
                  opacity={prog}
                />
              );
            })}
          </svg>

          {/* Nodes overlaid absolutely */}
          <div style={{ position: "absolute", inset: 0 }}>
            {/* Feature nodes (col 1) */}
            {FEATURES.map((f, i) => {
              const nodeIn = ease(frame, 14 + i * 4, 28 + i * 4);
              const pctY = (f.y / svgH) * 100;
              const isActive = i < 2; // "love" and "choice" are on the active circuit
              return (
                <div
                  key={f.label}
                  style={{
                    position: "absolute",
                    left: `${(COL1 / svgW) * 100 - 8.5}%`,
                    top: `${pctY}%`,
                    transform: "translate(0, -50%)",
                    opacity: nodeIn,
                    backgroundColor: isActive ? color.surfaceHi : color.panel,
                    border: `1.5px solid ${isActive ? color.accent : color.stroke}`,
                    borderRadius: 10,
                    padding: "8px 14px",
                    minWidth: "13.5%",
                    textAlign: "center",
                    boxShadow: isActive ? `0 0 14px rgba(155,177,207,0.15)` : "none",
                  }}
                >
                  <span style={{ fontFamily: display, fontSize: 20, color: isActive ? color.accent : color.brand, fontWeight: 600 }}>
                    {f.label}
                  </span>
                </div>
              );
            })}

            {/* Concept nodes (col 2) */}
            {CONCEPTS.map((c, i) => {
              const nodeIn = ease(frame, 26 + i * 6, 40 + i * 6);
              const pctY = (c.y / svgH) * 100;
              const isActive = i === 0;
              return (
                <div
                  key={c.label}
                  style={{
                    position: "absolute",
                    left: `${(COL2 / svgW) * 100 - 9}%`,
                    top: `${pctY}%`,
                    transform: "translate(0, -50%)",
                    opacity: nodeIn,
                    backgroundColor: isActive ? color.surfaceHi : color.panel,
                    border: `1.5px solid ${isActive ? color.accent : color.stroke}`,
                    borderRadius: 12,
                    padding: "10px 16px",
                    minWidth: "14%",
                    textAlign: "center",
                    boxShadow: isActive ? `0 0 18px rgba(155,177,207,0.2)` : "none",
                  }}
                >
                  <span style={{ fontFamily: display, fontSize: 20, color: isActive ? color.accent : color.brand, fontWeight: 700 }}>
                    {c.label}
                  </span>
                </div>
              );
            })}

            {/* Output node (col 3) */}
            {(() => {
              const nodeIn = ease(frame, 36, 52);
              return (
                <div
                  style={{
                    position: "absolute",
                    left: `${(COL3 / svgW) * 100 - 10}%`,
                    top: `${(OUTPUT_Y / svgH) * 100}%`,
                    transform: "translate(0, -50%)",
                    opacity: nodeIn,
                    backgroundColor: color.surfaceHi,
                    border: `2px solid ${color.accent}`,
                    borderRadius: 14,
                    padding: "14px 18px",
                    minWidth: "15%",
                    textAlign: "center",
                    boxShadow: `0 0 24px rgba(155,177,207,0.25)`,
                  }}
                >
                  <span style={{ fontFamily: display, fontSize: 22, color: color.accent, fontWeight: 800 }}>
                    MEANING
                  </span>
                </div>
              );
            })()}
          </div>
        </div>

        {/* ── Bottom stat ── */}
        <div
          style={{
            padding: "18px 24px",
            borderTop: `1px solid ${color.stroke}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            opacity: ease(frame, 40, 56),
          }}
        >
          <span style={{ fontFamily: display, fontSize: 22, color: color.brand }}>
            Reasoning path: interpretable, not symbolic
          </span>
          <span style={{ fontFamily: display, fontSize: 28, fontWeight: 800, color: color.accent }}>
            ✓ TRACED
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default InterpretabilityDash;
