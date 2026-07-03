#!/bin/bash
# render_and_speedup.sh <slug> [speed] [composition]
# Renders a Remotion composition, then applies the ffmpeg speedup, as ONE self-contained
# background-safe job. Writes:
#   output/<slug>.mp4         the final video
#   output/<slug>.done        marker written ONLY on full success
#   output/<slug>.failed      marker written on any failure (with the reason)
# A poller can watch for these markers with a BOUNDED loop instead of `watch`/`tail -f`
# (which never exit and hung the whole pipeline once — see produce.md step 3).
#   composition defaults to TechExplainer (the daily explainer). Pass "Overlay" for the
#   upload-a-video mode. speed 1.0 = NO speedup (straight copy) — use it for Overlay so the
#   user's own video + audio aren't tempo/pitch-shifted.
cd "$(dirname "$0")/.." || exit 1
SLUG="$1"; SPEED="${2:-1.25}"; COMP="${3:-TechExplainer}"
[ -z "$SLUG" ] && { echo "usage: render_and_speedup.sh <slug> [speed] [composition]"; exit 2; }
OUT="output/$SLUG.mp4"; FULL="output/$SLUG.full.mp4"
DONE="output/$SLUG.done"; FAILED="output/$SLUG.failed"
rm -f "$DONE" "$FAILED" "$OUT" "$FULL"

LOG="output/$SLUG.render.log"
{
  echo "=== $(date -u '+%F %T UTC') render start: $SLUG (comp $COMP, speed $SPEED) ==="
  ( cd remotion && node_modules/.bin/remotion render src/index.ts "$COMP" "../$FULL" ) \
    && { if [ "$SPEED" = "1.0" ] || [ "$SPEED" = "1" ]; then cp "$FULL" "$OUT"; else bash scripts/speedup.sh "$FULL" "$OUT" "$SPEED"; fi; } \
    && [ -s "$OUT" ] \
    && { echo "=== $(date -u '+%F %T UTC') render OK (kept $FULL for fast re-speed) ==="; touch "$DONE"; } \
    || { echo "=== $(date -u '+%F %T UTC') render FAILED ==="; echo "render or speedup failed" > "$FAILED"; }
} >> "$LOG" 2>&1
