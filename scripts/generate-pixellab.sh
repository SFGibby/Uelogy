#!/usr/bin/env bash
# Usage: generate-pixellab.sh <output-png-path> <width> <height> "<description>"
set -euo pipefail

OUT="$1"
W="$2"
H="$3"
DESC="$4"

if [ -z "${PIXELLAB_KEY:-}" ]; then
  # Try loading from .env.local
  if [ -f "$(dirname "$0")/../.env.local" ]; then
    export $(grep PIXELLAB_KEY "$(dirname "$0")/../.env.local" | xargs)
  fi
fi

if [ -z "${PIXELLAB_KEY:-}" ]; then
  echo "PIXELLAB_KEY not set" >&2
  exit 1
fi

BODY=$(python3 -c "import json,sys; print(json.dumps({
  'description': sys.argv[1],
  'image_size': {'width': int(sys.argv[2]), 'height': int(sys.argv[3])},
  'no_background': True,
  'text_guidance_scale': 8,
}))" "$DESC" "$W" "$H")

echo "Calling PixelLab (${W}x${H}): $DESC" >&2

RESP=$(curl -sS -X POST https://api.pixellab.ai/v1/generate-image-pixflux \
  -H "Authorization: Bearer $PIXELLAB_KEY" \
  -H "Content-Type: application/json" \
  -d "$BODY")

# Error?
if echo "$RESP" | python3 -c "import json,sys; d=json.load(sys.stdin); sys.exit(0 if d.get('image') else 1)" 2>/dev/null; then
  echo "$RESP" | python3 -c "
import json, sys, base64
d = json.load(sys.stdin)
b64 = d['image']['base64']
with open(sys.argv[1], 'wb') as f:
    f.write(base64.b64decode(b64))
print(f\"saved {sys.argv[1]}  (cost: \${d['usage']['usd']})\", file=sys.stderr)
" "$OUT"
else
  echo "API error response:" >&2
  echo "$RESP" | head -c 1000 >&2
  echo >&2
  exit 1
fi
