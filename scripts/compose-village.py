#!/usr/bin/env python3
"""Compose a Stardew-style solar cottage village from Sprout Lands tiles.

Tiles: Sprout Lands Basic pack by Cup Nooble (non-commercial, credited).
Output: /public/sprites/village-scene.png
"""
from PIL import Image, ImageDraw
from pathlib import Path
import random

random.seed(11)

PACK = Path("/tmp/sprout-lands/Sprout Lands - Sprites - Basic pack")
OUT  = Path("/Users/gibson/Developer/samuel-gibson-site/public/sprites/village-scene.png")

W, H = 480, 160
TILE = 16

def load(*parts):
    return Image.open(PACK.joinpath(*parts)).convert("RGBA")

grass      = load("Tilesets", "Grass.png")
wood_house = load("Tilesets", "Wooden House.png")
biom       = load("Objects", "Basic_Grass_Biom_things.png")

# The leftmost cottage in Wooden House.png is a pre-rendered 2×5-tile house:
# brick window on top, wood walls with door below.
cottage = wood_house.crop((0, 0, 32, 80))

canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))

# Ground: uniform Stardew grass interior tile
grass_tile = grass.crop((5*TILE, 2*TILE, 6*TILE, 3*TILE))
for x in range(0, W, TILE):
    for y in range(0, H, TILE):
        canvas.paste(grass_tile, (x, y), grass_tile)

def add_solar_panels_to_roof(sprite):
    """Overlay a dark blue solar panel array on the brick window area
    (the top 'roof' portion of the pre-rendered cottage)."""
    d = ImageDraw.Draw(sprite)
    panel_fill = (26, 56, 118, 235)
    panel_edge = (100, 160, 220, 255)
    x0, y0 = 4, 12
    pw, ph = 7, 8
    cols, rows = 3, 2
    gap = 1
    for r in range(rows):
        for c in range(cols):
            px = x0 + c * (pw + gap)
            py = y0 + r * (ph + gap)
            d.rectangle([px, py, px + pw - 1, py + ph - 1],
                        fill=panel_fill, outline=panel_edge)
            d.line([px + pw//2, py + 1, px + pw//2, py + ph - 2], fill=panel_edge)
    return sprite

solar_cottage = add_solar_panels_to_roof(cottage.copy())

def paste_with_shadow(dst, sprite, x, y):
    sw, sh = sprite.size
    shadow = Image.new("RGBA", (sw + 8, 6), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.ellipse([0, 0, sw + 7, 5], fill=(0, 0, 0, 90))
    dst.paste(shadow, (x - 4, y + sh - 3), shadow)
    dst.paste(sprite, (x, y), sprite)

cottage_top_y = H - 80 - 16  # cottage baseline is 16px above bottom
for cx in [52, 224, 396]:
    paste_with_shadow(canvas, solar_cottage, cx, cottage_top_y)

# Trees (2×3 sprite from biom top row)
tree        = biom.crop((0, 0, 2*TILE, 3*TILE))
tree2       = biom.crop((2*TILE, 0, 4*TILE, 3*TILE))
tree_fruit  = biom.crop((4*TILE, 0, 6*TILE, 3*TILE))
for (src, x, y) in [
    (tree,       4, 86),
    (tree2,    104, 82),
    (tree_fruit,160, 86),
    (tree,     276, 82),
    (tree2,    332, 86),
    (tree_fruit,448, 82),
]:
    canvas.paste(src, (x, y), src)

# Bushes & flowers along the front grass
bush        = biom.crop((0, 3*TILE, TILE, 4*TILE))
bush_berry  = biom.crop((0, 2*TILE, TILE, 3*TILE))
tiny_flower = biom.crop((2*TILE, 2*TILE, 3*TILE, 3*TILE))
for (src, x, y) in [
    (bush,         16, 142),
    (bush_berry,   92, 144),
    (tiny_flower, 128, 146),
    (bush,        176, 144),
    (tiny_flower, 212, 146),
    (bush_berry,  256, 142),
    (bush,        308, 144),
    (tiny_flower, 348, 146),
    (bush_berry,  384, 144),
    (bush,        440, 142),
]:
    canvas.paste(src, (x, y), src)

canvas.save(OUT)
print(f"Wrote {OUT} ({W}×{H})")
