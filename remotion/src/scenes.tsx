import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Img, staticFile } from "remotion";
import { color, display, serif } from "./theme";
import { reveal, ramp } from "./anim";
import * as Icons from "lucide-react";
import { CUSTOM } from "./custom/registry";
import { Window, CodeBlock, CodeLine } from "./ui";

const ICO = (name?: string, fallback: any = Icons.Cpu) =>
  (name && (Icons as any)[name]) || fallback;

const surface = color.surface;
const stroke = color.stroke;
const highlight = color.highlight;

// ── shared chrome ───────────────────────────────────────────────────────────

export const BackgroundField: React.FC = () => {
  // Flat brand surface — no gradient wash, no glow, no vignette. A faint technical
  // dot-grid (blueprint feel) + light grain give texture without a gradient.
  return (
    <>
      <AbsoluteFill style={{ backgroundColor: color.bg }} />
      <AbsoluteFill style={{ opacity: 0.6 }}>
        <svg width="100%" height="100%">
          <defs>
            <pattern id="dotgrid" width="60" height="60" patternUnits="userSpaceOnUse">
              <circle cx="3" cy="3" r="2.2" fill="rgba(200,205,215,0.07)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dotgrid)" />
        </svg>
      </AbsoluteFill>
      <AbsoluteFill style={{ opacity: 0.04, mixBlendMode: "overlay" }}>
        <svg width="100%" height="100%">
          <filter id="gr">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" />
          </filter>
          <rect width="100%" height="100%" filter="url(#gr)" />
        </svg>
      </AbsoluteFill>
    </>
  );
};

// `showProgress` toggles the animated progress line; the label (icon + topic) always shows when the
// bar is rendered at all. Whether the bar renders is decided by the caller (TechExplainer/Overlay).
export const TopBar: React.FC<{ topic: string; icon?: string; showProgress?: boolean }> = ({ topic, icon, showProgress = true }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const Icon = ICO(icon, Icons.Atom);
  const progress = interpolate(frame, [0, durationInFrames], [0, 100]);
  return (
    <>
      {/* IG safe zone: sits at ~15-19% so it clears Instagram's Reels header (status bar + "Reels"
          title + camera/search icons), which covers roughly the top ~13% of the frame. */}
      <div style={{ position: "absolute", top: 300, left: 70, right: 70, display: "flex", alignItems: "center", gap: 20 }}>
        <Icon size={46} color={color.accent} strokeWidth={2.4} />
        <span style={{ fontFamily: display, fontWeight: 700, fontSize: 36, color: color.ink, textTransform: "uppercase", letterSpacing: "0.01em" }}>
          {topic}
        </span>
      </div>
      {showProgress && (
        <div style={{ position: "absolute", top: 372, left: 70, right: 70, height: 6, borderRadius: 3, background: color.stroke, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${progress}%`, background: color.accent }} />
        </div>
      )}
    </>
  );
};

// ── scenes ──────────────────────────────────────────────────────────────────

export const TitleScene: React.FC<{ title: string; subtitle?: string; icon?: string }> = ({ title, subtitle, icon }) => {
  const f = useCurrentFrame();
  const Icon = ICO(icon, Icons.Cpu);
  const ico = reveal(f, 0, 16);
  const ttl = reveal(f, 8, 18);
  const sub = reveal(f, 18, 18);
  const line = ramp(f, 20, 44);
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "0 110px", textAlign: "center" }}>
      <div style={{ opacity: ico.opacity, transform: `translateY(${ico.y}px)`, marginBottom: 54 }}>
        <div style={{ width: 168, height: 168, borderRadius: 38, background: highlight, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 30px 80px oklch(0.12 0.05 264 / 0.6)", border: `2px solid ${color.accent}` }}>
          <Icon size={96} color={color.accent} strokeWidth={2.2} />
        </div>
      </div>
      <div style={{ opacity: ttl.opacity, transform: `translateY(${ttl.y}px)`, fontFamily: display, fontWeight: 800, fontSize: 156, lineHeight: 0.96, color: color.ink, textTransform: "uppercase", letterSpacing: "-0.035em" }}>
        {title}
      </div>
      <div style={{ height: 10, width: line * 240, background: color.accent, borderRadius: 5, marginTop: 30 }} />
      {subtitle && (
        <div style={{ opacity: sub.opacity, transform: `translateY(${sub.y}px)`, fontFamily: serif, fontStyle: "italic", fontSize: 64, color: color.ink, marginTop: 34 }}>
          {subtitle}
        </div>
      )}
    </AbsoluteFill>
  );
};

type Col = { title: string; icon?: string; blocks: string[]; tone?: "heavy" | "light" };

export const CompareSplit: React.FC<{ left: Col; right: Col }> = ({ left, right }) => {
  const f = useCurrentFrame();
  const Column: React.FC<{ col: Col; side: number }> = ({ col, side }) => {
    const head = reveal(f, 4 + side * 3, 16);
    const Icon = ICO(col.icon, Icons.Box);
    const accentTone = col.tone === "light";
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
        <div style={{ opacity: head.opacity, transform: `translateY(${head.y}px)`, display: "flex", alignItems: "center", gap: 14 }}>
          <Icon size={50} color={accentTone ? color.accent : color.brand} strokeWidth={2.3} />
          <span style={{ fontFamily: display, fontWeight: 800, fontSize: 50, color: color.ink }}>{col.title}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%" }}>
          {col.blocks.map((b, i) => {
            const r = reveal(f, 22 + side * 4 + i * 9, 14);
            const isApp = i === col.blocks.length - 1;
            return (
              <div key={i} style={{
                opacity: r.opacity, transform: `translateY(${r.y}px)`,
                padding: "32px 22px", borderRadius: 20,
                background: isApp ? highlight : surface,
                border: `2px solid ${isApp ? color.accent : stroke}`,
                textAlign: "center", fontFamily: display, fontWeight: 600, fontSize: 40, color: color.ink,
              }}>{b}</div>
            );
          })}
        </div>
      </div>
    );
  };
  return (
    <AbsoluteFill style={{ flexDirection: "row", gap: 48, justifyContent: "center", alignItems: "center", padding: "280px 80px 440px" }}>
      <Column col={left} side={0} />
      <div style={{ width: 3, alignSelf: "stretch", background: stroke, margin: "80px 0" }} />
      <Column col={right} side={1} />
    </AbsoluteFill>
  );
};

export const LayerStack: React.FC<{ title?: string; layers: { label: string; icon?: string }[] }> = ({ title, layers }) => {
  const f = useCurrentFrame();
  const ttl = reveal(f, 2, 14);
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "270px 90px 440px" }}>
      {title && (
        <div style={{ opacity: ttl.opacity, transform: `translateY(${ttl.y}px)`, fontFamily: display, fontWeight: 700, fontSize: 56, color: color.ink, marginBottom: 40, textAlign: "center" }}>
          {title}
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column-reverse", gap: 18, width: "100%" }}>
        {layers.map((L, i) => {
          const r = reveal(f, 10 + i * 11, 16);
          const Icon = ICO(L.icon, Icons.Layers);
          const top = i === layers.length - 1;
          return (
            <div key={i} style={{
              opacity: r.opacity, transform: `translateY(${-r.y}px)`,
              display: "flex", alignItems: "center", gap: 24, padding: "36px 38px", borderRadius: 22,
              background: top ? highlight : surface, border: `2px solid ${top ? color.accent : stroke}`,
            }}>
              <Icon size={56} color={top ? color.accent : color.brand} strokeWidth={2.3} />
              <span style={{ fontFamily: display, fontWeight: 700, fontSize: 50, color: color.ink }}>{L.label}</span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export const NodeDiagram: React.FC<{ hub: { label: string; icon?: string }; nodes: { label: string; icon?: string }[] }> = ({ hub, nodes }) => {
  const f = useCurrentFrame();
  const W = 1080;
  const hubX = W / 2, hubY = 620, nodeY = 1180;
  const n = nodes.length;
  const xs = nodes.map((_, i) => 170 + (i + 0.5) * ((W - 340) / n));
  const HubIcon = ICO(hub.icon, Icons.Cog);
  const hubR = reveal(f, 2, 16);
  const box = (r: { opacity: number; y: number }, accent: boolean, w: number): React.CSSProperties => ({
    opacity: r.opacity, transform: `translateY(${r.y}px)`,
    width: w, padding: "26px 16px", borderRadius: 22,
    background: accent ? highlight : surface, border: `2px solid ${accent ? color.accent : stroke}`,
    display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
    position: "absolute",
  });
  return (
    <AbsoluteFill>
      <svg width={W} height={1920} style={{ position: "absolute", inset: 0 }}>
        {xs.map((x, i) => {
          const draw = ramp(f, 16 + i * 5, 38 + i * 5);
          const y0 = hubY + 110, y1 = nodeY - 10;
          const ex = hubX + (x - hubX) * draw, ey = y0 + (y1 - y0) * draw;
          const period = 48;
          const dt = ((f - (40 + i * 6)) % period) / period;
          const show = f > 40 + i * 6 && dt >= 0;
          const dx = hubX + (x - hubX) * dt, dy = y0 + (y1 - y0) * dt;
          return (
            <g key={i}>
              <line x1={hubX} y1={y0} x2={ex} y2={ey} stroke={color.line} strokeWidth={4} />
              {show && <circle cx={dx} cy={dy} r={9} fill={color.accent} />}
            </g>
          );
        })}
      </svg>
      <div style={{ ...box(hubR, true, 300), left: hubX - 150, top: hubY - 40 }}>
        <HubIcon size={64} color={color.accent} strokeWidth={2.3} />
        <span style={{ fontFamily: display, fontWeight: 700, fontSize: 40, color: color.ink, textAlign: "center" }}>{hub.label}</span>
      </div>
      {xs.map((x, i) => {
        const r = reveal(f, 34 + i * 6, 14);
        const Icon = ICO(nodes[i].icon, Icons.Box);
        const w = 220;
        return (
          <div key={i} style={{ ...box(r, false, w), left: x - w / 2, top: nodeY - 40 }}>
            <Icon size={50} color={color.brand} strokeWidth={2.3} />
            <span style={{ fontFamily: display, fontWeight: 600, fontSize: 34, color: color.ink, textAlign: "center" }}>{nodes[i].label}</span>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

export const StatScene: React.FC<{ value: string; label: string }> = ({ value, label }) => {
  const f = useCurrentFrame();
  const v = reveal(f, 2, 18);
  const l = reveal(f, 14, 16);
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "0 100px", textAlign: "center" }}>
      <div style={{ opacity: v.opacity, transform: `scale(${0.82 + 0.18 * v.opacity})`, fontFamily: display, fontWeight: 800, fontSize: 300, lineHeight: 0.88, color: color.accent, letterSpacing: "-0.04em" }}>
        {value}
      </div>
      <div style={{ opacity: l.opacity, transform: `translateY(${l.y}px)`, fontFamily: display, fontWeight: 600, fontSize: 66, color: color.ink, marginTop: 24 }}>
        {label}
      </div>
    </AbsoluteFill>
  );
};

export const OutroScene: React.FC<{ cta: string; handle?: string; icon?: string }> = ({ cta, handle, icon }) => {
  const f = useCurrentFrame();
  const Icon = ICO(icon, Icons.ArrowRight);
  const c = reveal(f, 4, 18);
  const h = reveal(f, 16, 16);
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "0 100px", textAlign: "center", gap: 30 }}>
      <div style={{ opacity: c.opacity, transform: `translateY(${c.y}px)`, fontFamily: display, fontWeight: 800, fontSize: 110, color: color.ink, textTransform: "uppercase", letterSpacing: "-0.03em", lineHeight: 1.0 }}>
        {cta}
      </div>
      {handle && (
        <div style={{ opacity: h.opacity, transform: `translateY(${h.y}px)`, display: "flex", alignItems: "center", gap: 16, padding: "20px 36px", borderRadius: 999, background: highlight, border: `2px solid ${color.accent}` }}>
          <Icon size={48} color={color.accent} strokeWidth={2.4} />
          <span style={{ fontFamily: display, fontWeight: 700, fontSize: 56, color: color.ink }}>{handle}</span>
        </div>
      )}
    </AbsoluteFill>
  );
};

// Statement — big emphasis text with optional highlighted keywords (word-staggered).
export const Statement: React.FC<{ text: string; highlight?: string }> = ({ text, highlight }) => {
  const f = useCurrentFrame();
  const words = (text || "").split(" ");
  const hl = (highlight || "").toLowerCase().split(/\s+/).filter(Boolean);
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "0 110px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 24px", justifyContent: "center", fontFamily: display, fontWeight: 800, fontSize: 112, lineHeight: 1.04, textAlign: "center", letterSpacing: "-0.03em" }}>
        {words.map((w, i) => {
          const r = reveal(f, 4 + i * 3, 12);
          const on = hl.includes(w.toLowerCase().replace(/[.,!?;:]/g, ""));
          return (
            <span key={i} style={{ opacity: r.opacity, transform: `translateY(${r.y}px)`, color: on ? color.accent : color.ink }}>
              {w}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// Canvas — FREEFORM scene. The reasoner places its own elements on a 0-100 × 0-100
// grid (→ 1080×1920). Breaks template reliance: any custom diagram, flow, cycle, map.
type El = any;
const W = 1080, H = 1920;
const PX = (v: number, dim: number) => (Number(v) / 100) * dim;
const SZ: any = { s: 36, m: 52, l: 78, xl: 116 };

export const Canvas: React.FC<{ elements: El[] }> = ({ elements }) => {
  const f = useCurrentFrame();
  const els = elements || [];
  const back = els.filter((e) => e.kind === "edge" || e.kind === "circle");
  const front = els.filter((e) => e.kind !== "edge" && e.kind !== "circle");
  return (
    <AbsoluteFill>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        {back.map((e, i) => {
          if (e.kind === "circle") {
            const r = reveal(f, i * 4, 14);
            return <circle key={i} cx={PX(e.x, W)} cy={PX(e.y, H)} r={PX(e.r ?? 10, W)} fill="none"
              stroke={e.accent ? color.accent : color.line} strokeWidth={4} opacity={r.opacity} />;
          }
          const draw = ramp(f, i * 4, i * 4 + 22);
          const x1 = PX(e.x1, W), y1 = PX(e.y1, H), x2 = PX(e.x2, W), y2 = PX(e.y2, H);
          const ex = x1 + (x2 - x1) * draw, ey = y1 + (y2 - y1) * draw;
          const col = e.accent ? color.accent : color.line;
          const period = 48, dt = ((f - (i * 4 + 26)) % period) / period;
          const dx = x1 + (x2 - x1) * dt, dy = y1 + (y2 - y1) * dt;
          return (
            <g key={i}>
              <line x1={x1} y1={y1} x2={ex} y2={ey} stroke={col} strokeWidth={4} />
              {e.flow && f > i * 4 + 26 && <circle cx={dx} cy={dy} r={9} fill={color.accent} />}
            </g>
          );
        })}
      </svg>
      {front.map((e, i) => {
        const r = reveal(f, 6 + i * 5, 14);
        const base: React.CSSProperties = {
          position: "absolute", left: PX(e.x, W), top: PX(e.y, H),
          transform: `translate(-50%,-50%) translateY(${r.y}px)`, opacity: r.opacity,
        };
        if (e.kind === "node") {
          const Icon = e.icon ? ICO(e.icon, Icons.Box) : null;
          return (
            <div key={i} style={{ ...base, width: PX(e.w ?? 22, W), padding: "24px 16px", borderRadius: 20, background: e.accent ? highlight : surface, border: `2px solid ${e.accent ? color.accent : stroke}`, boxShadow: e.accent ? "0 14px 36px rgba(0,0,0,0.5), 0 0 24px rgba(155,177,207,0.12)" : "0 12px 30px rgba(0,0,0,0.45)", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              {Icon && <Icon size={48} color={e.accent ? color.accent : color.brand} strokeWidth={2.3} />}
              {e.label && <span style={{ fontFamily: display, fontWeight: 700, fontSize: 34, color: color.ink, textAlign: "center" }}>{e.label}</span>}
            </div>
          );
        }
        if (e.kind === "icon") {
          const Icon = ICO(e.name, Icons.Box);
          return <div key={i} style={base}><Icon size={e.size ?? 72} color={e.accent ? color.accent : color.brand} strokeWidth={2.2} /></div>;
        }
        return (
          <div key={i} style={{ ...base, fontFamily: display, fontWeight: 800, fontSize: SZ[e.size ?? "m"], color: e.accent ? color.accent : color.ink, textAlign: "center", maxWidth: 880, letterSpacing: "-0.02em", lineHeight: 1.05 }}>
            {e.text}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ── terminal — realistic command-line mockup (heading + window + code) ────────
// props: { heading?, windowTitle?, lines: CodeLine[], accent? }
export const TerminalScene: React.FC<{ heading?: string; windowTitle?: string; lines: CodeLine[]; accent?: boolean }> = ({
  heading, windowTitle = "bash", lines, accent,
}) => {
  const f = useCurrentFrame();
  const h = reveal(f, 2, 16);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: "0 70px" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 44, width: "100%" }}>
        {heading && (
          <div style={{ opacity: h.opacity, transform: `translateY(${h.y}px)`, fontFamily: display, fontWeight: 800, fontSize: 64, color: color.ink, textAlign: "center", letterSpacing: "-0.02em", lineHeight: 1.04 }}>
            {heading}
          </div>
        )}
        <Window variant="terminal" title={windowTitle} width={900} accent={accent} delay={8}>
          <CodeBlock lines={lines} size={32} delay={16} />
        </Window>
      </div>
    </AbsoluteFill>
  );
};

// ── photo — NotebookLM-style: full-bleed generated image + Ken Burns + optional label ────
// props: { id, label?, sublabel?, kenburns?: "in"|"out"|"left"|"right"|"up", accent?,
//          labelPos?: "top"|"bottom", pointer?: {x,y,label} }
// The image (assets/img/<id>.jpg) fills the frame; a slow scale/pan gives it life; an optional
// headline fades/rises in. The global karaoke captions still burn in over the bottom.
export const PhotoScene: React.FC<{
  id: string; label?: string; sublabel?: string; kenburns?: string; accent?: boolean;
  labelPos?: string; mono?: boolean; pointer?: { x: number; y: number; label?: string };
}> = ({ id, label, sublabel, kenburns = "in", accent, labelPos = "top", mono, pointer }) => {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const t = interpolate(f, [0, Math.max(1, durationInFrames)], [0, 1], { extrapolateRight: "clamp" });
  // Ken Burns: a gentle scale + directional drift.
  const scale = kenburns === "out" ? 1.12 - t * 0.1 : 1.04 + t * 0.09;
  const dx = kenburns === "left" ? -t * 40 : kenburns === "right" ? t * 40 : 0;
  const dy = kenburns === "up" ? -t * 40 : 0;
  const lab = reveal(f, 6, 18);
  const top = labelPos !== "bottom";

  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: color.bg }}>
      <Img
        src={staticFile(`assets/img/${id}.jpg`)}
        style={{ width: "100%", height: "100%", objectFit: "cover",
                 filter: mono ? "grayscale(1) contrast(1.05) brightness(0.95)" : "none",
                 transform: `scale(${scale}) translate(${dx}px, ${dy}px)` }}
      />
      {/* legibility scrims: top (for a top label + our top bar) and bottom (for captions) */}
      <AbsoluteFill style={{ background:
        "linear-gradient(180deg, rgba(10,11,13,0.66) 0%, rgba(10,11,13,0) 24%, rgba(10,11,13,0) 55%, rgba(10,11,13,0.82) 100%)" }} />

      {/* optional pointer/annotation onto a spot in the image */}
      {pointer && (
        <div style={{ position: "absolute", left: `${pointer.x}%`, top: `${pointer.y}%`,
          transform: `translate(-50%,-50%) scale(${lab.opacity})`, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 18, height: 18, borderRadius: 999, background: color.accent, boxShadow: "0 0 0 6px rgba(155,177,207,0.28)" }} />
          {pointer.label && <span style={{ fontFamily: display, fontWeight: 700, fontSize: 34, color: color.ink, background: "rgba(13,20,32,0.7)", padding: "6px 14px", borderRadius: 10 }}>{pointer.label}</span>}
        </div>
      )}

      {label && (
        <div style={{ position: "absolute", left: "8%", right: "8%",
          ...(top ? { top: "23%" } : { bottom: "27%" }),
          opacity: lab.opacity, transform: `translateY(${lab.y}px)`, textAlign: "center" }}>
          <div style={{ fontFamily: display, fontWeight: 800, fontSize: 76, lineHeight: 1.03,
            letterSpacing: "-0.02em", color: accent ? color.accent : color.ink,
            textShadow: "0 6px 34px rgba(0,0,0,0.8)" }}>
            {label}
          </div>
          {sublabel && (
            <div style={{ fontFamily: serif, fontStyle: "italic", fontSize: 44, color: color.ink,
              opacity: 0.9, marginTop: 12, textShadow: "0 4px 20px rgba(0,0,0,0.8)" }}>
              {sublabel}
            </div>
          )}
        </div>
      )}
    </AbsoluteFill>
  );
};

// ── router ──────────────────────────────────────────────────────────────────

export type Scene = { type: string; durationInFrames: number; props: any };

export const SceneRouter: React.FC<{ scene: Scene }> = ({ scene }) => {
  const p = scene.props || {};
  switch (scene.type) {
    case "title": return <TitleScene {...p} />;
    case "compare": return <CompareSplit {...p} />;
    case "layers": return <LayerStack {...p} />;
    case "nodes": return <NodeDiagram {...p} />;
    case "stat": return <StatScene {...p} />;
    case "statement": return <Statement {...p} />;
    case "canvas": return <Canvas {...p} />;
    case "terminal": return <TerminalScene {...p} />;
    case "photo": return <PhotoScene {...p} />;
    case "outro": return <OutroScene {...p} />;
    case "custom": {
      // agent-authored scene component, resolved from the generated registry.
      const C = p.component && CUSTOM[p.component];
      if (C) {
        // if the custom component throws at render, fall back instead of crashing the whole video.
        return (
          <CustomBoundary fallbackText={p.fallbackText}>
            <C {...p} />
          </CustomBoundary>
        );
      }
      return <Statement text={p.fallbackText || ""} />;
    }
    default: return null;
  }
};

// Error boundary so one bad agent-written scene can't take down the render.
type CBProps = { fallbackText?: string; children: React.ReactNode };
type CBState = { failed: boolean };
class CustomBoundary extends React.Component<CBProps, CBState> {
  declare props: CBProps;
  state: CBState = { failed: false };
  static getDerivedStateFromError(): CBState {
    return { failed: true };
  }
  render() {
    if (this.state.failed) return <Statement text={this.props.fallbackText || ""} />;
    return this.props.children as any;
  }
}
