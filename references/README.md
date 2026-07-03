# Visual references — composition inspiration for the channel

Screenshots from an account whose **scene composition** the channel owner likes. During ideation,
**Read these images with vision** and study HOW they make a tech concept visually interesting, then
translate those ideas into our own design system.

## ⚠️ Study the STRUCTURE, not the surface
These references are **colorful** (cyan / orange / purple / red) and use a **hand-drawn marker font**
with squiggly underlines. **Our channel is the opposite on purpose:** strict BLACK & WHITE with a
single blue-grey accent, and clean fonts (Bricolage Grotesque + Instrument Serif) — NO marker
lettering, NO multi-color, NO hand-drawn underlines. So do **not** copy their palette or typography.

What TO take from them (this is the gold):
- **Show the real thing** — realistic mockups instead of abstract boxes: terminal windows (mac dots +
  syntax-highlighted commands), app/dashboard panels, ticket cards, config snippets.
- **Real product logos** as first-class elements (GitHub, Kubernetes, Argo CD, Jenkins, Prometheus…).
- **Spatial storytelling** — a labelled arrow carrying the eye between mockups ("PULL", "every 15s"),
  a fan-in of many sources into one, a YES/NO branch, a source-of-truth on the left feeding a cluster.
- **Annotation + density** — short labels pinned to parts of a diagram; "+100 more" to imply scale;
  a question rendered as a real terminal line (`? cluster == repo ?`).
- **One bespoke hero diagram per video**, built for that exact concept — not a reused template.

Translate each of those into B&W: logos recolored to a B&W tone, the one accent reserved for a single
focal element, clean type, our top-bar + caption safe zones. The kit in `remotion/src/ui.tsx` plus
your own hand-written custom-scene markup is how you build these — see `prompts/ideate.md`.

## The files
- **01-traditional-cd.png** — a CI/CD story: a real **terminal** (`ci-pipeline ▸ deploy.sh`, `kubectl
  apply`, ✓ output) → arrow "PUSH" → a **k8s cluster panel** (node-1/2/3, pod chips, version badge) →
  a **Jira ticket card** (logo, "Deploy v1.4.2 to prod", DONE ✓). Vertical flow, mockups stacked.
- **02-gitops-pull-loop.png** — a **GitHub "Git" card** (desired-state YAML, "source of truth") on the
  left feeding a **cluster** on the right, with the **Argo CD** logo as a watcher pulling on a loop;
  a **reconcile terminal** (`? cluster == repo ?`) branching into YES (✓ all good) / NO (fix it) arrows.
- **03-gitops-the-trap.png** — a comparison: two **app cards with real logos** side by side (Argo CD
  "installed ✓" vs Jenkins "still pushing!") joined by a "+", an arrow down to a punchline. Shows how
  to use two product cards to contrast two approaches.
- **04-prometheus-scrape.png** — **scale/fan-in**: a grid of 8 identical service tiles (k8s `/metrics`
  endpoints) with "+100 more", curved lines converging into one **Prometheus** app icon ("every 15s"),
  then a "local disk · TSDB" storage strip. Great pattern for "many → one, on an interval".
