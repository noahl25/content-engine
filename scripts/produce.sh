#!/bin/bash
# produce.sh [morning|evening] — launch ONE agent that owns a video end-to-end:
# research → render → Telegram (send + wait) → in-context edits → post. Singleton via flock.
exec 9>/tmp/bytesized_produce.lock
flock -n 9 || { echo "[produce] another run already in progress, skipping"; exit 0; }
# Pause guard (indefinite): if this flag file exists, skip every run (no video, no post)
# until it's removed. Remove the file to resume. Set at user request 2026-07-02.
PAUSE_FILE="/home/claude/claude/content-engine/memory/paused.flag"
if [ -f "$PAUSE_FILE" ]; then
  echo "=== $(date -u '+%F %T UTC') produce (${1:-slot}) PAUSED — paused.flag present ===" \
    >> /home/claude/claude/content-engine/memory/produce.log
  exit 0
fi
# Skip-dates guard (self-expiring): if today's UTC date is listed in memory/skip_dates.txt,
# skip this run entirely (no video, no post). One YYYY-MM-DD per line; '#' comments allowed.
SKIP_FILE="/home/claude/claude/content-engine/memory/skip_dates.txt"
TODAY_UTC="$(date -u '+%F')"
if [ -f "$SKIP_FILE" ] && grep -qE "^[[:space:]]*${TODAY_UTC}([[:space:]]|#|$)" "$SKIP_FILE"; then
  echo "=== $(date -u '+%F %T UTC') produce (${1:-slot}) SKIPPED — $TODAY_UTC in skip_dates.txt ===" \
    >> /home/claude/claude/content-engine/memory/produce.log
  exit 0
fi
# cron has a minimal PATH — add the dirs our tools live in (claude, yt-dlp, node, etc.)
export PATH="/home/claude/.local/bin:/usr/local/bin:/usr/bin:/bin:$PATH"
export HOME=/home/claude
CLAUDE=/home/claude/.local/bin/claude
cd ~/claude/content-engine || exit 1
SLOT="${1:-slot}"
echo "=== $(date -u '+%F %T UTC') produce ($SLOT) start ===" >> memory/produce.log
PROMPT=$(sed "s/__SLOT__/$SLOT/g" prompts/produce.md)
"$CLAUDE" -p "$PROMPT" --dangerously-skip-permissions >> memory/produce.log 2>&1
echo "=== $(date -u '+%F %T UTC') produce ($SLOT) end ===" >> memory/produce.log
