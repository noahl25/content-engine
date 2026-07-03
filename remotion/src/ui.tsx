// ─────────────────────────────────────────────────────────────────────────────
// UI-CHROME KIT — realistic interface mockups in the channel's BLACK & WHITE look.
//
// These are the building blocks for "show the real thing" scenes: terminals, app
// cards, dashboard panels, ticket cards, code, badges, real brand logos, photos,
// labelled flow arrows. Compose them in a `custom` scene (import from "../ui") or
// use the declarative `terminal` / `mockup` scene types.
//
// EVERYTHING is monochrome by design: near-black surfaces, white/grey text, the ONE
// blue-grey accent (color.accent) reserved for a single focal element per scene.
// Real logos are recolored to a B&W tone; photos render desaturated. No raw color.
// ─────────────────────────────────────────────────────────────────────────────
import React from "react";
import { useCurrentFrame, staticFile, Img } from "remotion";
import { color, display, mono } from "./theme";
import { reveal } from "./anim";
import * as Icons from "lucide-react";

const ICO = (name?: string, fb: any = Icons.Box) => (name && (Icons as any)[name]) || fb;
type Tone = "ink" | "brand" | "accent" | "dim" | "dark";
const TONE: Record<Tone, string> = {
  ink: color.ink, brand: color.brand, accent: color.accent, dim: "rgba(170,172,178,0.7)",
  dark: color.bg, // for logos placed on light/white surfaces
};

// Wrap any element with a staggered fade+rise. delay in frames.
export const In: React.FC<{ delay?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ delay = 0, children, style }) => {
  const f = useCurrentFrame();
  const r = reveal(f, delay, 16);
  return <div style={{ opacity: r.opacity, transform: `translateY(${r.y}px)`, ...style }}>{children}</div>;
};

// ── BrandLogo ────────────────────────────────────────────────────────────────
// Real brand mark from simple-icons (fetched into public/assets/logos/<slug>.svg),
// recolored to a B&W tone via CSS mask. Falls back to a lucide icon if absent.
export const BrandLogo: React.FC<{ slug: string; size?: number; tone?: Tone; fallback?: string }> = ({
  slug, size = 64, tone = "ink", fallback,
}) => {
  const col = TONE[tone];
  // mask the monochrome SVG so any single-color logo paints in `col`
  return (
    <div
      style={{
        width: size, height: size, backgroundColor: col, display: "inline-block",
        WebkitMaskImage: `url(${staticFile(`assets/logos/${slug}.svg`)})`,
        maskImage: `url(${staticFile(`assets/logos/${slug}.svg`)})`,
        WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat",
        WebkitMaskPosition: "center", maskPosition: "center",
        WebkitMaskSize: "contain", maskSize: "contain",
      }}
    />
  );
};

// ── Badge / Pill ─────────────────────────────────────────────────────────────
export const Badge: React.FC<{ children: React.ReactNode; variant?: "outline" | "solid" | "accent"; mono?: boolean }> = ({
  children, variant = "outline", mono: m,
}) => {
  const base: React.CSSProperties = {
    fontFamily: m ? mono : display, fontWeight: 600, fontSize: 26, padding: "8px 16px",
    borderRadius: 10, letterSpacing: m ? 0 : "0.01em", whiteSpace: "nowrap",
    display: "inline-flex", alignItems: "center", gap: 8,
  };
  if (variant === "solid") return <span style={{ ...base, background: color.ink, color: color.bg }}>{children}</span>;
  if (variant === "accent") return <span style={{ ...base, background: color.highlight, color: color.accent, border: `1.5px solid ${color.accent}` }}>{children}</span>;
  return <span style={{ ...base, background: color.surface, color: color.ink, border: `1.5px solid ${color.stroke}` }}>{children}</span>;
};

// ── Window (terminal / browser / app) ────────────────────────────────────────
export type WindowProps = {
  variant?: "terminal" | "browser" | "app";
  title?: string;          // titlebar label (terminal path / browser url / app name)
  width?: number | string;
  accent?: boolean;        // accent-tint the frame (use sparingly — once per scene)
  children: React.ReactNode;
  delay?: number;
};
const Dots = () => (
  <div style={{ display: "flex", gap: 10 }}>
    {[0.5, 0.32, 0.2].map((o, i) => (
      <div key={i} style={{ width: 16, height: 16, borderRadius: 8, background: `rgba(237,237,238,${o})` }} />
    ))}
  </div>
);
export const Window: React.FC<WindowProps> = ({ variant = "terminal", title, width = 880, accent, children, delay = 0 }) => {
  const f = useCurrentFrame();
  const r = reveal(f, delay, 18);
  const border = accent ? color.accent : color.stroke;
  return (
    <div style={{
      width, borderRadius: 22, overflow: "hidden", border: `2px solid ${border}`,
      background: color.panel, boxShadow: "0 24px 60px rgba(0,0,0,0.55)",
      opacity: r.opacity, transform: `translateY(${r.y}px)`,
    }}>
      {/* titlebar */}
      <div style={{
        display: "flex", alignItems: "center", gap: 18, padding: "16px 22px",
        background: "#20252e", borderBottom: `1.5px solid ${color.stroke}`,
      }}>
        {variant === "terminal" && <Dots />}
        {variant === "browser" && (
          <div style={{ display: "flex", gap: 8 }}>
            {[Icons.ChevronLeft, Icons.ChevronRight, Icons.RotateCw].map((I, i) => (
              <I key={i} size={22} color={color.brand} strokeWidth={2.4} />
            ))}
          </div>
        )}
        {title && (
          <span style={{
            fontFamily: mono, fontSize: 26, color: "rgba(237,237,238,0.7)",
            ...(variant === "browser" ? { background: color.surface, borderRadius: 999, padding: "6px 20px", flex: 1, textAlign: "center" } : {}),
          }}>{title}</span>
        )}
      </div>
      {/* body */}
      <div style={{ padding: variant === "app" ? 0 : "26px 30px" }}>{children}</div>
    </div>
  );
};

// ── CodeBlock — terminal/code lines with light monochrome syntax emphasis ──────
// Each line: {p:"$"|">"|"" prompt, cmd?:true accent the text, ok?:true check, text}
export type CodeLine = { p?: string; cmd?: boolean; ok?: boolean; dim?: boolean; text: string };
export const CodeBlock: React.FC<{ lines: CodeLine[]; size?: number; delay?: number }> = ({ lines, size = 30, delay = 0 }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ fontFamily: mono, fontSize: size, lineHeight: 1.7 }}>
      {lines.map((l, i) => {
        const r = reveal(f, delay + i * 6, 10);
        const col = l.cmd ? color.accent : l.dim ? "rgba(170,172,178,0.6)" : color.ink;
        return (
          <div key={i} style={{ display: "flex", gap: 14, opacity: r.opacity, alignItems: "baseline" }}>
            {l.p && <span style={{ color: "rgba(170,172,178,0.7)" }}>{l.p}</span>}
            {l.ok && <Icons.Check size={size} color={color.ink} strokeWidth={3} style={{ alignSelf: "center" }} />}
            <span style={{ color: col, fontWeight: l.cmd ? 600 : 400 }}>{l.text}</span>
          </div>
        );
      })}
    </div>
  );
};

// ── Card — generic UI card. variant "dark" (surface) or "light" (white pop). ───
export const Card: React.FC<{
  variant?: "dark" | "light"; width?: number | string; delay?: number;
  logo?: { slug?: string; icon?: string }; title?: string; badge?: React.ReactNode;
  children?: React.ReactNode;
}> = ({ variant = "dark", width = 560, delay = 0, logo, title, badge, children }) => {
  const f = useCurrentFrame();
  const r = reveal(f, delay, 16);
  const light = variant === "light";
  const Icon = logo?.icon ? ICO(logo.icon) : null;
  return (
    <div style={{
      width, borderRadius: 20, overflow: "hidden",
      background: light ? color.ink : color.surface,
      border: `2px solid ${light ? "transparent" : color.stroke}`,
      color: light ? color.bg : color.ink, boxShadow: "0 18px 50px rgba(0,0,0,0.4)",
      opacity: r.opacity, transform: `translateY(${r.y}px)`,
    }}>
      {(logo || title || badge) && (
        <div style={{
          display: "flex", alignItems: "center", gap: 16, padding: "20px 24px",
          borderBottom: `1.5px solid ${light ? "rgba(10,11,13,0.12)" : color.stroke}`,
        }}>
          {logo?.slug && <BrandLogo slug={logo.slug} size={36} tone={light ? "dark" : "ink"} />}
          {Icon && <Icon size={34} color={light ? color.bg : color.accent} strokeWidth={2.4} />}
          {title && <span style={{ fontFamily: display, fontWeight: 700, fontSize: 32, flex: 1 }}>{title}</span>}
          {badge}
        </div>
      )}
      {children && <div style={{ padding: "22px 24px", fontFamily: display, fontSize: 32, fontWeight: 600 }}>{children}</div>}
    </div>
  );
};

// ── Panel — titled bordered container (e.g. a cluster / dashboard). ────────────
export const Panel: React.FC<{
  title?: string; logo?: { slug?: string; icon?: string }; badge?: React.ReactNode;
  width?: number | string; accent?: boolean; delay?: number; children?: React.ReactNode;
}> = ({ title, logo, badge, width = 900, accent, delay = 0, children }) => {
  const f = useCurrentFrame();
  const r = reveal(f, delay, 18);
  const Icon = logo?.icon ? ICO(logo.icon) : null;
  return (
    <div style={{
      width, borderRadius: 22, overflow: "hidden",
      border: `2px solid ${accent ? color.accent : color.stroke}`,
      background: color.panel, boxShadow: "0 22px 56px rgba(0,0,0,0.52)",
      opacity: r.opacity, transform: `translateY(${r.y}px)`,
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 16, padding: "20px 26px",
        background: accent ? color.highlight : "#20252e",
        borderBottom: `1.5px solid ${color.stroke}`,
      }}>
        {logo?.slug && <BrandLogo slug={logo.slug} size={38} tone="ink" />}
        {Icon && <Icon size={36} color={color.accent} strokeWidth={2.4} />}
        {title && <span style={{ fontFamily: display, fontWeight: 800, fontSize: 38, color: color.ink, flex: 1 }}>{title}</span>}
        {badge}
      </div>
      <div style={{ padding: "24px 26px" }}>{children}</div>
    </div>
  );
};

// ── NodeChip — small numbered/labelled circle (e.g. a pod / unit). ─────────────
export const NodeChip: React.FC<{ label?: string | number; accent?: boolean; size?: number; delay?: number }> = ({
  label, accent, size = 84, delay = 0,
}) => {
  const f = useCurrentFrame();
  const r = reveal(f, delay, 14);
  return (
    <div style={{
      width: size, height: size, borderRadius: size / 2, display: "flex",
      alignItems: "center", justifyContent: "center",
      border: `2.5px solid ${accent ? color.accent : color.line}`,
      background: accent ? color.highlight : color.surface,
      color: accent ? color.accent : color.ink, fontFamily: display, fontWeight: 700, fontSize: size * 0.36,
      opacity: r.opacity, transform: `scale(${0.85 + r.opacity * 0.15})`,
    }}>{label}</div>
  );
};

// ── Photo — a real photo, desaturated to fit the B&W palette. ──────────────────
export const Photo: React.FC<{ id: string; width?: number | string; height?: number; round?: number; delay?: number }> = ({
  id, width = 560, height = 720, round = 22, delay = 0,
}) => {
  const f = useCurrentFrame();
  const r = reveal(f, delay, 18);
  return (
    <div style={{
      width, height, borderRadius: round, overflow: "hidden", border: `2px solid ${color.stroke}`,
      opacity: r.opacity, transform: `translateY(${r.y}px)`,
    }}>
      <Img src={staticFile(`assets/img/${id}.jpg`)} style={{
        width: "100%", height: "100%", objectFit: "cover",
        filter: "grayscale(1) contrast(1.05) brightness(0.92)",
      }} />
    </div>
  );
};

// ── FlowArrow — labelled connector between mockups (e.g. "PUSH"). ──────────────
export const FlowArrow: React.FC<{
  dir?: "down" | "right"; label?: string; length?: number; accent?: boolean; delay?: number;
}> = ({ dir = "down", label, length = 120, accent, delay = 0 }) => {
  const f = useCurrentFrame();
  const r = reveal(f, delay, 14);
  const col = accent ? color.accent : color.line;
  const vert = dir === "down";
  return (
    <div style={{
      display: "flex", flexDirection: vert ? "column" : "row", alignItems: "center", gap: 14,
      opacity: r.opacity,
    }}>
      <svg width={vert ? 40 : length} height={vert ? length : 40} style={{ overflow: "visible" }}>
        <defs>
          <marker id={`ah-${dir}-${accent ? "a" : "n"}`} markerWidth="10" markerHeight="10" refX="6" refY="5" orient="auto">
            <path d="M0,0 L8,5 L0,10 z" fill={col} />
          </marker>
        </defs>
        {vert
          ? <line x1="20" y1="0" x2="20" y2={length - 8} stroke={col} strokeWidth="4" markerEnd={`url(#ah-${dir}-${accent ? "a" : "n"})`} />
          : <line x1="0" y1="20" x2={length - 8} y2="20" stroke={col} strokeWidth="4" markerEnd={`url(#ah-${dir}-${accent ? "a" : "n"})`} />}
      </svg>
      {label && (
        <span style={{ fontFamily: display, fontWeight: 800, fontSize: 34, letterSpacing: "0.04em", color: accent ? color.accent : color.ink, textTransform: "uppercase" }}>
          {label}
        </span>
      )}
    </div>
  );
};

// ── Row / Stack — light layout helpers for composing the above. ────────────────
export const Row: React.FC<{ gap?: number; align?: string; justify?: string; children: React.ReactNode; style?: React.CSSProperties }> = ({ gap = 24, align = "center", justify = "center", children, style }) => (
  <div style={{ display: "flex", flexDirection: "row", alignItems: align as any, justifyContent: justify as any, gap, ...style }}>{children}</div>
);
export const Stack: React.FC<{ gap?: number; align?: string; children: React.ReactNode; style?: React.CSSProperties }> = ({ gap = 24, align = "center", children, style }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: align as any, gap, ...style }}>{children}</div>
);
