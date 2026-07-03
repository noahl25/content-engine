import { loadFont as loadDisplay } from "@remotion/google-fonts/BricolageGrotesque";
import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import { Easing } from "remotion";

export const display = loadDisplay().fontFamily;
export const serif = loadSerif().fontFamily;
export const mono = loadMono().fontFamily; // terminals / code mockups

// Palette: BLACK & WHITE — neutral near-black bg, white/grey text. The ONLY color is a
// restrained blue-grey ACCENT used sparingly (the one pop per scene, key lines/icons). No blue base.
export const color = {
  bg: "#0a0b0d",       // near-black (neutral, faintest cool)
  bgDeep: "#050608",   // deeper, for vignette
  ink: "#ededee",      // near-white — primary text
  accent: "#9bb1cf",   // blue-grey — the ONE accent (active word, key element, icons). Use sparingly.
  brand: "#6a727c",    // muted cool grey — secondary icons / structure
  dim: "rgba(170,172,178,0.45)",     // muted neutral grey — unspoken caption
  // CARD/NODE FILLS ARE OPAQUE so connector lines/edges never show through them.
  surface: "#1c2129",   // default card/node fill (solid, lifted from bg — substantial, not glassy)
  surfaceHi: "#2a3242", // accent/focal card fill (solid blue-grey, clearly brighter → draws the eye)
  panel: "#15191f",     // slightly darker solid for large containers (window/panel bodies)
  stroke: "rgba(255,255,255,0.16)",  // borders (neutral)
  highlight: "#2a3242", // accented card fill (kept as alias of surfaceHi — opaque)
  line: "rgba(205,210,220,0.5)",     // diagram edges (neutral grey, a touch stronger)
  glow: "rgba(155,177,207,0.22)",    // subtle accent glow
  vignette: "rgba(4,5,7,0.8)",
};

// ease-out-expo — impeccable: no bounce/elastic.
export const expo = Easing.out(Easing.exp);
