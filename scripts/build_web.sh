#!/usr/bin/env bash
# Builds the web version (for iPhone: add to Home Screen) under a sub-path of GitHub Pages.
#   bash scripts/build_web.sh <out dir>      e.g. ../docs/quran/app
set -euo pipefail
cd "$(dirname "$0")/.."
BASE=/Awradna/quran/app
OUT=$(realpath -m "$1")
rm -rf "$OUT"
WEB_BASE=$BASE EXPO_OFFLINE=1 npx expo export --platform web --output-dir "$OUT" >/dev/null
# the page's own links (manifest, icon) live under the sub-path too
sed -i "s#href=\"/manifest.webmanifest\"#href=\"$BASE/manifest.webmanifest\"#; s#href=\"/icons/#href=\"$BASE/icons/#" "$OUT/index.html"
rm -f "$OUT/metadata.json"
echo "built $(du -sh "$OUT" | cut -f1) in $OUT"
