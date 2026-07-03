# byte.sized.2 — Design System

The canonical visual reference for the channel. The renderer enforces this; the ideation +
review passes (and impeccable) should read this to stay on-brand.

## Brand
- **Channel:** byte.sized.2 — science + tech/AI explainers, faceless, one concept per video.
- **Register:** confident, editorial, "makes you feel smart fast." Premium, not flashy.
- **Format:** vertical 1080×1920, ~45–55s final (rendered ~60s, sped up 1.25×), 30fps.

## Palette — BLACK & WHITE (neutral) with a restrained blue-grey accent. NO other color, NO gradients
| token | value | use |
|---|---|---|
| bg | `#0a0b0d` near-black | flat neutral background (NO gradient wash / glow / vignette) |
| bgDeep | `#050608` | deeper, vignette |
| ink | `#ededee` near-white | primary text |
| accent | `#9bb1cf` blue-grey | the ONE focal element per scene (active word, key node, punch number). Use SPARINGLY. |
| brand | `#6a727c` muted grey | secondary icons / structure |
| dim | grey `rgba(170,172,178,0.45)` | muted / unspoken caption |
| surface | `#1c2129` solid | default card/node fill — OPAQUE (lines never show through), with depth shadow |
| surfaceHi | `#2a3242` solid | focal/accent card fill (brighter blue-grey, draws the eye) |
| stroke | neutral white alpha | borders |
| line | neutral grey | diagram edges |

Black & white is the look: near-black bg, white/grey text. The blue-grey accent is the ONLY color and
appears sparingly (one pop per scene). Background = flat near-black + faint neutral **dot-grid** + grain.

## IG safe zones (so nothing gets cut off on the phone)
Instagram overlays its own UI on the reel: a header across the top ~13% and the caption + username +
action buttons + progress bar across the bottom ~22% (and the right edge). The renderer keeps our own
top bar at y~15-19 (just below IG's header, so it isn't crowded by IG's "Reels" title/icons) and the
spoken-word caption track at y~78. **Keep all scene content between y22 and y72** (below the top bar,
above the caption track) and within x6-90. Centered content is naturally safe.

## Type
- Display / captions: **Bricolage Grotesque** (700–800).
- Accent / intro subtitle: **Instrument Serif** (italic) — contrast pairing.
- Captions: word-timed karaoke; active word in accent, spoken alabaster, unspoken dim denim.

## Motion (impeccable)
Ease-out-expo only, staggered reveals, no bounce/elastic. Intentional, not decorative.

## Scene library (`remotion/src/scenes.tsx`)
title · statement · compare · layers · nodes · stat · **canvas** (freeform diagram) · **terminal**
(realistic CLI mockup) · custom (agent-written React) · outro.
Use a **mix** — no scene type more than twice; reach for `canvas` for custom diagrams so videos
don't feel templated. `canvas` grid is 0–100 (keep x 12–88, y 22–72; our top bar sits at y~15-19, captions at y~78).

## Realistic UI mockups + real logos
The strongest interest lever: **show the actual thing** (a chat thread, IDE, phone notification,
search results, a chart, a terminal, a settings panel) with **real brand logos**, instead of abstract
boxes. These are DESIGNED per-topic in `custom` scenes — the agent writes its own markup (`<div>`/
`<svg>` + theme tokens), pixel for pixel. A small optional kit exists at `remotion/src/ui.tsx`
(`Window`, `CodeBlock`, `Card`, `Panel`, `Badge`, `BrandLogo`, `NodeChip`, `Photo`, `FlowArrow`,
layout helpers) + a declarative `terminal` scene — but it's convenience only; **don't let it become a
template** (most realistic mockups should be hand-built, not kit assembly). The one near-always-useful
piece is `BrandLogo` — a real simple-icons logo recolored to a B&W tone via CSS mask. Strictly
monochrome: logos recolored, photos desaturated, never raw color. Logos/photos are fetched by
`scripts/fetch_assets.py` from the storyboard's `assets` array before render (logo `slug` =
simpleicons slug, any of ~3000 brands; missing → falls back to a lucide icon).

## Layout rules (impeccable)
- One focal point per scene; accent reserved for it.
- Breathing room + rhythm; align to an implicit grid; vary composition across scenes (not all centered).
- **Not a wireframe:** fill the usable band, solid opaque cards with depth + bold hierarchy + density
  where it tells the story (heatmaps/grids/real mockups) — never a few thin-outlined boxes + hairlines
  floating in black. Card/node fills are OPAQUE so connector lines stop at the card edge, not through it.
- No AI-slop: no gradient/glow surfaces, no glassmorphism, no identical repeated card grids, no
  tiny tracked-uppercase eyebrows everywhere.
- canvas: balanced, aligned rows/columns, NO overlaps, labels ≤2 words, margins, meaningful connectors.

## Full impeccable rules
See `~/.claude/skills/impeccable/SKILL.md` + `reference/{layout,typeset,colorize,critique,polish}.md`.
Validate with `npx impeccable detect src/` (target: `[]`).
