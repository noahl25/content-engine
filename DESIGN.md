# DESIGN — faceless explainer channel

The visual contract for the channel's videos. Full detail in `memory/design-system.md`.
Apply the impeccable design system (`~/.claude/skills/impeccable`) on top of this.

## Palette — BLACK & WHITE with a restrained blue-grey accent (NO other color, NO gradients)
- bg `#0a0b0d` (near-black, neutral, FLAT — dot-grid + grain, never a gradient/glow/vignette)
- text `#ededee` (near-white) · secondary grey `#6a727c` · muted grey dim
- accent `#9bb1cf` (blue-grey) = the ONE focal element per scene, used SPARINGLY. No blue base, no other hues.

## IG safe zones
IG covers the top ~13% (header) and bottom ~22% (caption + buttons); the subtitle track sits at y~78.
Our own top bar sits just below IG's header at y~15-19. Keep scene content between y22–y72, x6–90.
Top bar + captions are pinned inside the safe zone by the renderer.

## Type
- Bricolage Grotesque (display/captions, 700–800) + Instrument Serif (italic accents). Contrast pairing.

## Motion
Ease-out-expo, staggered reveals, no bounce. Intentional only.

## Composition rules (impeccable)
- One focal point per scene; accent reserved for it. Breathing room; align to a grid; vary
  composition across scenes (avoid everything-centered monotony).
- No AI-slop: no gradient/glow surfaces, no glassmorphism, no identical repeated card grids,
  no tiny tracked-uppercase eyebrows everywhere.
- Scenes: title · statement · compare · layers · nodes · stat · canvas (freeform) · terminal (CLI
  mockup) · custom (agent-written React) · outro. Mix them; prefer `canvas` for custom diagrams.
  canvas grid 0–100, keep x 12–88 / y 20–80, no overlaps, balanced.
- **Realistic UI mockups + real logos**: show the actual thing — a chat thread, IDE, phone
  notification, search results, chart, terminal, settings panel — with real brand logos, instead of
  abstract boxes when the topic has one. DESIGN each per-topic by writing your own markup in a `custom`
  scene (not by assembling a fixed kit — that's just a new template). `remotion/src/ui.tsx` is an
  OPTIONAL helper; `BrandLogo` (real simple-icons logo, recolored to B&W) is the one piece worth
  reusing. Strictly B&W: logos recolored, photos desaturated. Declare logo slugs / photo ids in the
  storyboard's `assets` array (auto-fetched).

Validate: `npx impeccable detect src/` → should be `[]`.
