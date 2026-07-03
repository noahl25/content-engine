---
name: content-engine
description: >-
  Faceless short-form explainer VIDEO generator for Instagram Reels / TikTok / Shorts. Use when
  the user wants to MAKE A VIDEO — "make a Reel", "create an explainer video", "turn this topic
  into a video", "generate a faceless video", "make a tech/science explainer", "a NotebookLM-style
  video", or "add graphics/captions to a video I have". It researches a topic (web), writes a
  scripted storyboard with a real narrative arc, and renders an animated ~50s vertical video with
  Remotion (voiceover via ElevenLabs, word-timed karaoke captions), then can send it for review and
  post it. Two explainer FORMATS — `graphics` (bespoke animated diagrams, real logos, UI mockups)
  and `photo` (NotebookLM-style: full-frame AI-generated images + captions + Ken Burns) — plus an
  OVERLAY mode that adds motion graphics onto a video the user uploads. Strict, configurable brand
  design system. NOT for long videos or live-action editing beyond graphic overlays.
---

# Content Engine — faceless explainer video generator

Turns ONE concept into a punchy animated vertical explainer, or adds graphics onto a user's clip.
The pipeline is **agent-owned**: one agent researches, writes real Remotion/React, renders, QAs its
own stills, and (optionally) posts — following the detailed prompt files below. This SKILL.md is the
router; the prompts are the full playbooks.

## First: setup check
Everything account/brand-specific lives in `config.json` (copy from `config.example.json`). Run
`python scripts/ceconfig.py` to confirm the handle/niche/voice and that keys (ElevenLabs, Gemini,
Pexels) + Telegram are resolved. Keys are file-paths or env vars — never stored in the repo. Full
setup: `README.md`. The brand contract (palette, type, motion, scenes): `memory/design-system.md`.

## Pick what to build

### A) A daily/topic explainer video  → follow **`prompts/produce.md`** end-to-end
That prompt owns the whole loop: pick/accept a topic → research (web) → **lock the story spine**
(hook → stakes → mechanism → payoff → button; it must read as ONE story, not fact-cards, per
`prompts/ideate.md`) → choose the **format**:
- **`graphics`** (default): bespoke animated diagrams, `canvas`/`custom` React scenes, real brand
  logos + UI mockups. Best for mechanisms/systems/data.
- **`photo`** (NotebookLM style): mostly full-frame AI-generated images (`photo` scenes) carried by
  narration + captions, gentle Ken Burns, occasional animated label. Best for conceptual/narrative
  topics. Set `art_style` (`bw`|`color`|`duotone`|custom) + `art_note` for a consistent image set.

Then: write the storyboard JSON → `scripts/build_storyboard.py` (TTS + timings + props) →
`scripts/render_and_speedup.sh <slug> 1.25` (background render, ~15 min, drops a `.done` marker) →
**mandatory visual QA** on `scripts/scene_stills.py` output (read every still, fix overlaps) → send
to Telegram (`scripts/queue_video.py`) → act on the reply (post via `prompts/post.md`, edit, or skip).

### B) Add graphics onto a video the user has  → follow **`prompts/overlay.md`**
Agent-writes-code: normalize their clip to `remotion/public/upload.mp4`, sample frames (vision) +
optional whisper caption timing, then WRITE `remotion/src/overlay/Overlay.tsx` (bespoke `OffthreadVideo`
+ timed graphics; full-bleed "overlay" or video-in-region "split"). Render with
`render_and_speedup.sh <slug> 1.0 Overlay` (1.0 = no speed change to their footage).

## Key pieces (reference)
- **Prompts** (the playbooks): `prompts/ideate.md` (script + storyboard schema + all visual rules),
  `prompts/produce.md` (orchestration), `prompts/overlay.md`, `prompts/trends.md`, `prompts/revise.md`,
  `prompts/post.md`.
- **Render** (`remotion/src/`): `scenes.tsx` (scene library incl. `photo`), `theme.ts` (B&W palette),
  `ui.tsx` (logo/mockup kit), `custom/` (agent-written scenes), `overlay/Overlay.tsx`, `TechExplainer.tsx`.
- **Scripts**: `ceconfig.py` (config), `voice.py` (ElevenLabs + Gemini-TTS fallback + word timings),
  `gen_image.py` (Gemini images, styles bw/color/duotone), `fetch_assets.py` (logos/photos/AI images),
  `build_storyboard.py`, `render_and_speedup.sh`, `scene_stills.py`, `track_perf.py`, `trends.py`,
  `queue_video.py`, `telegram.py`.
- **Options** (config or per-storyboard): `mode` (graphics|photo), `art_style`/`art_note`, `topBar`
  (default OFF) + `progress`.

## Principles
- **Reasoner in the loop at every step** — the agent uses judgment (research, script, design, QA), it
  is not a fixed template. Design bespoke graphics; don't lean on the fixed scene types.
- **Accuracy** — verify facts/numbers with web search before scripting.
- **One story** — the narration is a single coherent arc, not disconnected facts.
- **Visual QA is mandatory** — render stills and check with vision before anything ships.
- **Posting is approval-gated** — never auto-post; send for review and wait.

## Automation (optional)
`scripts/produce.sh [morning|evening]` wraps mode A for cron; it honors `memory/paused.flag` (create
the file to pause everything, delete to resume). On-demand overlay/explainer runs don't need cron.
