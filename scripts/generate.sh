#!/bin/bash
# generate.sh [morning|evening] — generate ONE video and queue it for your approval.
# Does NOT post. Posting happens only after you approve (you review the video, then it's posted).
# The morning run also refreshes performance analytics first (feeds that day's ideation).
cd ~/claude/content-engine || exit 1
PY=~/claude/trading/.venv/bin/python
LOG=memory/daily.log
SLOT="${1:-slot}"

echo "=== $(date -u '+%F %T UTC') generate ($SLOT) start ===" >> "$LOG"

# performance analyzer on the first (morning) run of the day
if [ "$SLOT" = "morning" ]; then
  $PY scripts/track_perf.py >> "$LOG" 2>&1 || echo "[gen] track_perf skipped" >> "$LOG"
fi

# research → varied scenes → impeccable review → render → 1.25x speedup
$PY scripts/ideate.py --render >> "$LOG" 2>&1 || { echo "[gen] ideate/render FAILED" >> "$LOG"; exit 1; }

SLUG=$(ls -t output/*.mp4 2>/dev/null | head -1 | xargs -r basename | sed 's/\.mp4$//')
if [ -n "$SLUG" ]; then
  $PY scripts/queue_video.py --slug "$SLUG" --slot "$SLOT" >> "$LOG" 2>&1
  echo "=== $(date -u '+%F %T UTC') generate done: $SLUG (PENDING APPROVAL — not posted) ===" >> "$LOG"
else
  echo "[gen] no video produced" >> "$LOG"
fi
