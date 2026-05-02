#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

CAST="$ROOT/demo/demo.cast"
GIF="$ROOT/demo/demo.gif"
MP4="$ROOT/demo/demo.mp4"

rm -f "$CAST" "$GIF" "$MP4"

asciinema rec -q --overwrite "$CAST" -c "bash '$ROOT/demo/run-demo.sh'"

agg --idle-time-limit 0.5 --cols 92 --font-size 18 "$CAST" "$GIF"

ffmpeg -y -i "$GIF" \
	-movflags +faststart \
	-pix_fmt yuv420p \
	-vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" \
	"$MP4"

echo "Wrote: $CAST"
echo "Wrote: $GIF"
echo "Wrote: $MP4"
ls -lh "$GIF" "$MP4"
