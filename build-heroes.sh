#!/bin/bash
# Larger renders of the frames used full-bleed (cover, day openers,
# interstitials). The 1800px gallery versions soften when they fill a wide
# viewport, so these go out at 2200px. Quality is tuned down because the
# page loads eleven of them; they sit behind gradient overlays anyway.
set -u
SRC="/Users/ericchemwor/Desktop/kilimanjaro Site"
OUT="$SRC/site/assets/photos/hero"
mkdir -p "$OUT"
cd "$SRC" || exit 1

for base in "$@"; do
  [ -f "$OUT/$base.jpg" ] && continue
  src=""
  for ext in HEIC JPG PNG; do [ -f "$base.$ext" ] && src="$base.$ext" && break; done
  [ -z "$src" ] && { echo "missing source for $base"; continue; }
  sips -s format jpeg -s formatOptions 58 -Z 2200 "$src" --out "$OUT/$base.jpg" >/dev/null 2>&1
done
echo "hero frames: $(ls "$OUT" | wc -l | tr -d ' ')"
du -sh "$OUT"
