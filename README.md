# content-engine

An autonomous **faceless Instagram Reels channel** for short explainer videos. An AI agent researches
a topic, writes a scripted storyboard, renders an animated ~50s vertical video (Remotion), sends it to
you on Telegram for approval, posts it, and learns from each video's performance. Two production modes:

- **Explainer mode** — generate a fully animated explainer from a topic (research → script → B&W
  motion-graphics scenes, including agent-written custom React scenes, real brand logos, and optional
  AI-generated illustrations).
- **Overlay mode** — take a video *you already have* and add on-brand motion graphics on top of it (or
  video-in-a-region with graphics beside it). See `prompts/overlay.md`.

It is **account-agnostic**: everything channel-specific (handle, niche, voice, API keys, cookies,
Telegram) lives in `config.json`. Point it at *your* account and it's your channel.

## How it works

- **Agent-owned pipeline.** One agent owns a video end-to-end (`prompts/produce.md`): research it,
  write the storyboard JSON, build + render, send to Telegram, apply your edits in-context, post on
  approval. It writes real Remotion/React for bespoke scenes — not a fixed template.
- **Rendering** is [Remotion](https://remotion.dev) (`remotion/`), 1080×1920 @ 30fps, a strict
  black-and-white design system (`memory/design-system.md`).
- **Voice** is ElevenLabs (word-level timing for karaoke captions), with a Google **Gemini TTS**
  fallback if ElevenLabs runs out of credits (`scripts/voice.py`).
- **Assets:** real brand logos (simple-icons), stock photos (Pexels), and optional **AI images**
  (Gemini 2.5 Flash Image), all rendered strictly monochrome (`scripts/fetch_assets.py`, `gen_image.py`).
- **Self-improvement:** `scripts/track_perf.py` pulls the channel's own analytics → `memory/LEARNINGS.md`,
  which the ideation prompt reads to favor what works. `scripts/trends.py` does weekly external
  trend analysis → `memory/TRENDS.md`.

## Setup (use your own account)

1. **Dependencies:** `ffmpeg`, Node (for Remotion — `cd remotion && npm install`), and a Python venv
   with `requests` + `faster-whisper` (used for caption timing on the fallback/overlay paths).
2. **Config:** copy the example and edit it:
   ```bash
   cp config.example.json config.json
   ```
   Set `channel.handle`, `channel.niche`, and `channel.voice_id` (your ElevenLabs voice).
3. **Keys & secrets.** These are **never stored in the repo** — `config.json` only holds a *reference*
   to each secret, which is either a file path (`~/keys/elevenlabs.txt`) or an env var (`env:MY_VAR`).
   Provide (as files or env vars):
   - `keys.elevenlabs`, `keys.gemini`, `keys.pexels`, `keys.pixabay`
   - `telegram.token` + `telegram.chat_id` (a Telegram bot for review/approval — talk to @BotFather;
     run `python scripts/telegram.py capture-chat` after messaging your bot to save the chat id)
   - `accounts.posting.cookies` (Instagram cookies for the account you post from) and, optionally,
     `accounts.trends.cookies` (a separate account used only to scan trends)

   Every secret can also be overridden by an environment variable — `CE_ELEVENLABS_KEY`,
   `CE_GEMINI_KEY`, `CE_PEXELS_KEY`, `CE_PIXABAY_KEY`, `CE_TELEGRAM_TOKEN`, `CE_TELEGRAM_CHAT`,
   `CE_VOICE_ID` — which take precedence over `config.json`. See `scripts/ceconfig.py`.
4. **Check it:** `python scripts/ceconfig.py` prints your resolved handle/niche/voice and whether each
   key/cookie/token is found (secrets are never printed).

## Running

- **Explainer video:** launch the producer agent with `prompts/produce.md` (research → render →
  Telegram approve → post). `scripts/produce.sh [morning|evening]` wraps this for cron; it honors
  `memory/paused.flag` (create the file to pause all automation; delete it to resume).
- **Overlay a video you have:** follow `prompts/overlay.md` — normalize the clip to
  `remotion/public/upload.mp4`, write `remotion/src/overlay/Overlay.tsx` (your bespoke component),
  then `bash scripts/render_and_speedup.sh <slug> 1.0 Overlay`.
- **Render** (either mode) is `scripts/render_and_speedup.sh <slug> [speed] [composition]` — it renders
  in the background and drops an `output/<slug>.done` marker (renders take ~15 min).

## Notes

- Not affiliated with Instagram. Automating posting may violate platform terms — use a throwaway
  account and your own judgment.
- The design system, roadmap, and architecture notes live in `memory/`.
