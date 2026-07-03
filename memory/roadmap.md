# byte.sized.2 — Roadmap / Status

## Done ✅
- Tooling: Remotion, impeccable skill, lucide-react, ffmpeg, piper-tts, ElevenLabs (working key),
  Pexels/Pixabay keys (verified).
- Scene library (8 types incl. freeform `canvas`), blue-grey monochrome palette, flat (no-gradient) bg.
- `voice.py` (ElevenLabs word timings + Piper fallback).
- `build_storyboard.py` (storyboard → narration + timed scenes).
- `ideate.py` reasoner: web research → varied storyboard + IG caption + hashtags; `--render` chains
  build → review → render → 1.25× speedup.
- `prompts/ideate.md` (hooks: 9 patterns, varied scenes, impeccable design rules, caption rules).
- `review_scenes.py` + `prompts/review.md` — IMPECCABLE visual review pass (reads skill files).
- End-to-end verified: rendered Docker + CPU-cache explainers.

## Now built ✅ (this session)
- **post_reel.py** + `prompts/post.md` — reasoner-driven stealth-browser auto-upload (open IG create
  flow → `upload_file` the mp4 as a Reel → set caption + hashtags → publish → capture shortcode).
  Logs to `memory/post_log.csv`. (Needs the `upload_file` MCP tool → `/mcp` reconnect to load it.)
- **track_perf.py** — pulls own reel metrics via IG web API → `memory/performance.csv` +
  auto-writes `memory/LEARNINGS.md`; the ideation reasoner reads LEARNINGS.md to favor what works.
- **daily_run.sh** — full cycle: track perf → ideate+render → (post, gated by `ENABLE_POSTING=1`).
- **scripts/crontab.txt** — ready cron lines (disarmed; not installed): weekly trends + daily cycle.
- `upload_file` tool added to the stealth-browser MCP.
- **trends.py** + `prompts/trends.md` — WEEKLY external IG trend analysis (PhysicsCreations session)
  → `memory/TRENDS.md`, read by ideation alongside LEARNINGS.md. So ideation has 3 signals: own
  performance + external trends + live web research.
- **Two-account split:** PhysicsCreations = trend analysis/downloads (`~/instagram_physics_cookies.txt`);
  byte.sized.2 = own analytics + posting (`~/instagram_bytesized_cookies.txt`, stealth profile).

## LIVE (2026-06-28) ✅
- byte.sized.2 created + logged into stealth profile; cookies `~/instagram_bytesized_cookies.txt`.
- **Crons installed + started** (approval-gated, NOT auto-posting):
  - `0 13 * * 1` weekly trends (Mon 6 AM PT)
  - `0 14 * * *` morning generate + track_perf (7 AM PT)
  - `0 0 * * *` evening generate (5 PM PT)
- `generate.sh` = cron entry: research→render→speedup→queue PENDING (`memory/queue.json`) + push. NO post.

## Approval flow (posting)
1. Cron generates a video → queues pending → notifies.
2. **Review:** the video is sent to the user (SendUserFile) for a go-ahead.
3. **Approve → post:** `python scripts/post_reel.py --slug <slug>` (needs a one-time `/mcp` reconnect
   so `upload_file` is loaded). Link saved to `memory/posted.md` + `post_log.csv`.

## Heads-up
- **ElevenLabs free tier = 10k chars/mo → ~5 days at 2/day.** voice.py is EL-only and fails loudly
  when EL is out (no robotic Piper fallback, per user) — reload/refill EL credits before then.

## Optional polish
Pexels/Pixabay B-roll behind some scenes, music bed, cover/thumbnail frame, alt text, length tuning.

## Open decisions
- Posting mode fully-auto (config.json). Cron kept DISARMED until account exists (also avoids burning
  ElevenLabs credits on unposted daily renders).
- ElevenLabs free tier = 10k chars/month (~15–20 videos); upgrade or rotate if it runs out.
