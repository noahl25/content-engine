#!/bin/bash
# speedup.sh IN.mp4 OUT.mp4 [factor=1.25]
# Uniformly speeds up video + audio (atempo preserves pitch). Captions stay in sync
# because both streams scale together.
set -e
IN="$1"; OUT="$2"; F="${3:-1.25}"
PTS=$(python3 -c "print(f'{1/$F:.6f}')")
ffmpeg -y -i "$IN" \
  -filter:v "setpts=${PTS}*PTS" \
  -filter:a "atempo=${F}" \
  -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p \
  -c:a aac -b:a 160k \
  "$OUT" 2>&1 | tail -2
echo "sped up ${F}x -> $OUT"
