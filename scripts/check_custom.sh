#!/bin/bash
# check_custom.sh — verify agent-authored custom scene components before rendering.
#   1. regenerate the custom-scene registry
#   2. TypeScript typecheck the whole remotion project (catches syntax/type/import errors)
# Exits non-zero if the typecheck fails. Run this after writing/editing any custom scene,
# BEFORE the 15-min render. Visual correctness is still checked separately via scene_stills.py.
set -o pipefail
cd "$(dirname "$0")/.." || exit 1
PY=~/claude/trading/.venv/bin/python

echo "[check_custom] regenerating registry..."
$PY scripts/gen_custom_registry.py || exit 1

echo "[check_custom] typechecking (tsc --noEmit)..."
cd remotion || exit 1
OUT=$(timeout 180 node_modules/.bin/tsc --noEmit 2>&1)
N=$(echo "$OUT" | grep -c "error TS")
if [ "$N" -gt 0 ]; then
  echo "[check_custom] ❌ $N type error(s):"
  echo "$OUT" | grep "error TS" | head -40
  exit 1
fi
echo "[check_custom] ✅ typecheck clean — custom scenes compile."
