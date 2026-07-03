#!/bin/bash
# daily_run.sh — one autonomous content cycle for byte.sized.2:
#   track yesterday's performance → ideate+render next topic → (optionally) post.
#
# Posting is GATED by ENABLE_POSTING=1 (off by default) so it won't post until the
# byte.sized.2 account is created + logged into the stealth profile, and you arm it.
#
# Arm:   ENABLE_POSTING=1 bash daily_run.sh         (or set it in the crontab line)
# Test:  bash daily_run.sh                          (builds a video, does NOT post)

cd ~/claude/content-engine || exit 1
PY=~/claude/trading/.venv/bin/python   # EL path needs no whisper; this venv also has the Piper fallback
LOG=~/claude/content-engine/memory/daily.log

echo "=== $(date -u '+%Y-%m-%d %H:%M:%S UTC') daily_run start ===" >> "$LOG"

# 1. refresh performance from already-posted reels (feeds today's ideation via LEARNINGS.md)
$PY scripts/track_perf.py >> "$LOG" 2>&1 || echo "[daily] track_perf skipped" >> "$LOG"

# 2. ideate next backlog topic → research → varied scenes → impeccable review → render → 1.25x speedup
$PY scripts/ideate.py --render >> "$LOG" 2>&1 || { echo "[daily] ideate/render FAILED" >> "$LOG"; exit 1; }

# 3. newest produced video
SLUG=$(ls -t output/*.mp4 2>/dev/null | head -1 | xargs -r basename | sed 's/\.mp4$//')
echo "[daily] produced: $SLUG" >> "$LOG"

# 4. post (gated)
if [ "${ENABLE_POSTING:-0}" = "1" ] && [ -n "$SLUG" ]; then
  $PY scripts/post_reel.py --slug "$SLUG" >> "$LOG" 2>&1 || echo "[daily] post FAILED" >> "$LOG"
else
  echo "[daily] ENABLE_POSTING!=1 — built but did NOT post: $SLUG" >> "$LOG"
fi

echo "=== $(date -u '+%Y-%m-%d %H:%M:%S UTC') daily_run done ===" >> "$LOG"
