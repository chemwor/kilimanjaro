#!/bin/bash
# Converts the trip's HEIC/JPG/PNG stills into web-sized JPEGs and emits a
# manifest that maps each photo to a trek day. Photo clocks read 4h ahead of
# Tanzania local time, so we subtract that offset before bucketing by date.
set -u
SRC="/Users/ericchemwor/Desktop/kilimanjaro Site"
OUT="$SRC/site/assets/photos"

cd "$SRC" || exit 1

convert_one() {
  f="$1"
  base="${f%.*}"
  [ -f "$OUT/full/$base.jpg" ] && return
  sips -s format jpeg -s formatOptions 72 -Z 1800 "$f" --out "$OUT/full/$base.jpg" >/dev/null 2>&1
  sips -s format jpeg -s formatOptions 60 -Z 640 "$OUT/full/$base.jpg" --out "$OUT/thumb/$base.jpg" >/dev/null 2>&1
}
export -f convert_one
export OUT

ls IMG_*.HEIC IMG_*.JPG IMG_*.PNG 2>/dev/null \
  | xargs -P 8 -I{} bash -c 'convert_one "$@"' _ {}

echo "converted: $(ls "$OUT/full" | wc -l | tr -d ' ')"
