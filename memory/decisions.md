# byte.sized.2 — Decisions & Gotchas

## Decisions
- **Graphics-first, not text-on-screen.** Videos must use animated diagrams (Remotion's whole point).
  Plain captions over a background was rejected.
- **Not template-bound.** Added the freeform `canvas` scene so the reasoner draws custom diagrams;
  rule: vary scene types, no type more than twice. Goal = more visually appealing, varied scenes.
- **Palette:** black-and-white-leaning blue-grey monochrome (user-provided). Amber accent rejected.
  **No gradient backgrounds** (glow/vignette) — user disliked them; flat field + dot-grid instead.
- **Voice:** ElevenLabs (George) over Piper, per user. Piper kept as offline fallback.
- **Length:** 45–60s final (sped up 1.25× from ~60–70s raw) — user wanted longer + snappier.
- **impeccable** used in the creation loop (ideate prompt rules + review_scenes vision pass that reads
  the skill files + detect), to keep scenes visually appealing & on-brand. Skill is NOT re-installed
  per-project; it's global at `~/.claude/skills/impeccable`.
- **social-media-skills repo** (blacktwist): hook patterns + caption anatomy baked into prompts, NOT
  installed as a skill (user's call).
- **Web search** is part of the content workflow (facts/accuracy + layout + ideas), per user.
- **Three learning signals into ideation:** own performance (`LEARNINGS.md`), external IG trends
  (`TRENDS.md`, weekly via `trends.py`), and live web research (facts + recent breakthroughs).
- **Two-account split (user's call):** PhysicsCreations does all outward trend analysis + downloads;
  byte.sized.2 is used only where necessary — its own analytics + posting. Keeps the channel account
  low-risk (no scraping on it). Separate cookie files; stealth browser profile = byte.sized.2.

## Gotchas
- **ElevenLabs free tier blocks the premade voice LIBRARY via API** ("Free users cannot use library
  voices"); restricted keys also lack `voices_read`/`user_read`. Need a full-permission key + the
  account's default voices. First key failed both ways; second key works.
- **Render is slow** on this 1-core ARM box (~0.5s/frame). Use `remotion still` for design iteration;
  only full-render for the final. Fine for an unattended daily cron.
- **headless `claude -p` + impeccable:** read the `reference/*.md` rule files directly; do NOT invoke
  the skill's setup/init (`context.mjs`) or it derails on `NO_PRODUCT_MD`.
- Lucide icon names must be valid PascalCase — validated against `scripts/lucide_icons.json` (1986).
- `~/instagram_cookies.txt` currently holds the PhysicsCreations session (from the insta-trends
  project), NOT byte.sized.2 — posting needs a fresh login + cookie file for the new account.
