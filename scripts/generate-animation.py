#!/usr/bin/env python3
"""Generate animation frames for an existing PixelLab sprite.

Usage:
  python3 scripts/generate-animation.py <reference_png> <out_prefix> <n_frames> <action_description>

Frames are saved as <out_prefix>-frame-0.png ... <out_prefix>-frame-(n-1).png
"""
import base64, json, sys, os, subprocess, tempfile
from pathlib import Path

# Load API key from .env.local
env_path = Path(__file__).parent.parent / ".env.local"
key = None
if env_path.exists():
    for line in env_path.read_text().splitlines():
        if line.startswith("PIXELLAB_KEY="):
            key = line.split("=", 1)[1].strip()
            break
if not key:
    key = os.environ.get("PIXELLAB_KEY")
if not key:
    sys.exit("PIXELLAB_KEY not set")

ref_path, out_prefix, n_frames, action = sys.argv[1], sys.argv[2], int(sys.argv[3]), sys.argv[4]

ref_b64 = base64.b64encode(Path(ref_path).read_bytes()).decode()

body = {
    "image_size": {"width": 64, "height": 64},
    "description": "pixel art chubby young adult male professor, long wavy dark brown hair, full beard, glasses, brown tweed blazer, white shirt, dark tie, dark slacks, 16-bit RPG style",
    "action": action,
    "reference_image": {"type": "base64", "base64": ref_b64, "format": "png"},
    "view": "low top-down",
    "direction": "south",
    "n_frames": n_frames,
    "text_guidance_scale": 7.5,
    "image_guidance_scale": 1.8,
    "init_image_strength": 300,
    "seed": 42,
}

print(f"Requesting {n_frames}-frame animation: {action!r}", file=sys.stderr)

with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as tf:
    json.dump(body, tf)
    body_path = tf.name

try:
    result = subprocess.run(
        ["curl", "-sS", "--max-time", "300",
         "-X", "POST", "https://api.pixellab.ai/v1/animate-with-text",
         "-H", f"Authorization: Bearer {key}",
         "-H", "Content-Type: application/json",
         "--data-binary", f"@{body_path}"],
        capture_output=True, text=True, check=True,
    )
    data = json.loads(result.stdout)
    if "images" not in data:
        print(f"API error: {result.stdout[:800]}", file=sys.stderr)
        sys.exit(1)
finally:
    os.unlink(body_path)

for i, img in enumerate(data["images"]):
    out = f"{out_prefix}-frame-{i}.png"
    Path(out).write_bytes(base64.b64decode(img["base64"]))
    print(f"  saved {out}", file=sys.stderr)

cost = data.get("usage", {}).get("usd", 0)
print(f"cost: ${cost}", file=sys.stderr)
