# byte.sized.2 — Architecture

Autonomous faceless IG Reels channel: research → script → render → (post) → learn. Reasoner in the
loop at every step.

## Pipeline (one command: `python scripts/ideate.py [--topic "X"] --render`)
1. **ideate.py** — picks a topic (arg, or next from `topics.json`), runs the reasoner headless
   (`claude -p` + `prompts/ideate.md`): RESEARCHES via web search (facts, best visual layout, hooks),
   READS the impeccable rule files + project `memory/design-system.md` and applies them while
   composing, emits a validated storyboard JSON → `storyboards/<slug>.json` (scenes + caption + hashtags).
   (impeccable at CREATION = rules applied to the composition, blind to pixels.)
2. **build_storyboard.py** — concatenates per-scene narration → **ElevenLabs TTS** via `voice.py`
   (`/with-timestamps` → word timings; Piper fallback) → `remotion/public/narration.mp3` +
   `remotion/src/story-props.json` (each scene gets a `durationInFrames` from where its words land).
3. **review_scenes.py** — IMPECCABLE review pass: renders a still per scene, a `claude -p` vision
   agent reads them + the impeccable skill files (`prompts/review.md`) and patches scene props in
   story-props.json for visual appeal. Skip with `--no-review`.
4. **remotion render** — `TechExplainer` composition → full mp4.
5. **speedup.sh** — ffmpeg 1.25× (pitch-preserved) → final `output/<slug>.mp4`.

## Key files
- `scripts/ideate.py` · `build_storyboard.py` · `review_scenes.py` · `voice.py` · `speedup.sh`
- `scripts/lucide_icons.json` — 1986 valid Lucide names (icon validation)
- `prompts/ideate.md` (reasoner) · `prompts/review.md` (impeccable reviewer)
- `remotion/src/` — `Root.tsx`, `TechExplainer.tsx`, `scenes.tsx` (scene library), `Captions.tsx`,
  `theme.ts` (palette/fonts)
- `topics.json` (backlog) · `config.json` (channel config) · `storyboards/` · `output/`

## Tooling / env
- Remotion 4.0.481 (headless chrome render; 1-core ARM ≈ 0.5s/frame → ~50s video ≈ 12–18 min).
- piper-tts in `.venv`; faster-whisper in `~/claude/trading/.venv` (Piper fallback only); ffmpeg.
- Keys: `~/elevenlabs.txt`, `~/pexels.txt`, `~/pixabay.txt` (perms 600, never echo).

## Run model — AGENT-OWNED (one agent owns each video, incl. edits)
Cron `scripts/produce.sh [morning|evening]` (flock singleton) launches ONE agent:
`claude -p "$(prompts/produce.md)" --dangerously-skip-permissions`. That single agent does the whole
lifecycle, keeping the storyboard in its own context the entire time:
1. (morning) `track_perf.py`; read LEARNINGS/TRENDS/design-system/ideate.md; pick topic.
2. research (web) + WRITE `storyboards/<slug>.json` itself.
3. `build_storyboard.py` → `remotion render` → `speedup.sh`.
4. `queue_video.py` sends the mp4 to **Telegram**; `telegram_wait.py 14400` BLOCKS up to 4h for the reply.
5. **yes** → the agent posts it ITSELF via the stealth-browser MCP (per `prompts/post.md`) + records
   the link to `memory/posted.md` + `post_log.csv`. **no** → skip. **edits** → the agent edits
   `storyboards/<slug>.json` in-context (surgical) → rebuild/render/resend → wait again (loops).
No separate poller / no second claude -p — the producing agent has full context, so edits are precise.
Telegram bot **@claude_cloudvm_bot** (token `~/telegram.txt`, chat `~/telegram_chat.txt`); helpers
`telegram.py` + `telegram_wait.py`; offset `memory/telegram_offset.txt`.

RETIRED (kept for manual use, not in cron): `telegram_poll.py` listener, `ensure_listener.sh`,
`generate.sh`, standalone `ideate.py`/`post_reel.py`/`review_scenes.py`.

## Weekly external trend analysis (`trends.py`)
Runs weekly (cron, NOT in the daily cycle — it's heavier). Uses the **PhysicsCreations** session
(`~/instagram_physics_cookies.txt`) to pull top reels across niche hashtags (config `trends.hashtags`)
via the insta-trends `find_reels.py`, then a `claude -p` synthesis (`prompts/trends.md`) writes
`memory/TRENDS.md` (hot subtopics, winning hooks/formats, takeaways). The ideation reasoner reads
TRENDS.md alongside LEARNINGS.md. `--deep` also downloads+transcribes the top few for hook teardown.

## Two Instagram accounts (deliberate split)
- **PhysicsCreations** = outward-facing: trend analysis + downloads (`trends.py`, insta-trends).
  Cookie file `~/instagram_physics_cookies.txt`. Keeps scraping off the channel account.
- **byte.sized.2** = the channel: own analytics (`track_perf.py`) + posting (`post_reel.py`).
  Cookie file `~/instagram_bytesized_cookies.txt`; the stealth-browser persistent profile is logged
  in as this one (for posting + analytics browser-fallback).

## Performance / analytics (self-improvement)
`track_perf.py` — **requests-first, stealth-browser fallback** (`--source auto|requests|browser`):
- requests path: IG web API (`web_profile_info`) with cookies + spoofed headers (cheap).
- browser fallback (`prompts/track_browser.md`): if requests is blocked/empty/login-walled, a
  headless agent reads the profile + reels via the logged-in stealth session (block-proof).
Writes `memory/performance.csv` (per-reel) + `memory/analytics.csv` (followers/reach over time) +
`memory/LEARNINGS.md` (read by ideation). Posting cookies + requests cookies are the same session.
