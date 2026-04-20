#!/usr/bin/env python3
"""Compose a Stardew-style solar cottage village scene from Sprout Lands tiles."""
from PIL import Image, ImageDraw
from pathlib import Path
import random

random.seed(7)

PACK = Path("/tmp/sprout-lands/Sprout Lands - Sprites - Basic pack")
OUT  = Path("/Users/gibson/Developer/samuel-gibson-site/public/sprites/village-scene.png")

W, H = 480, 144  # 10:3 wide banner
TILE = 16

def load(*parts):
    return Image.open(PACK.joinpath(*parts)).convert("RGBA")

grass = load("Tilesets", "Grass.png")
roof  = load("Tilesets", "Wooden_House_Roof_Tilset.png")
walls = load("Tilesets", "Wooden_House_Walls_Tilset.png")
doors = load("Tilesets", "Doors.png")
biom  = load("Objects", "Basic_Grass_Biom_things.png")

def tile(img, col, row, w=1, h=1):
    return img.crop((col*TILE, row*TILE, (col+w)*TILE, (row+h)*TILE))

canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))

# --- Ground: uniform plain interior grass ---
grass_tile = tile(grass, 5, 2)
for x in range(0, W, TILE):
    for y in range(0, H, TILE):
        canvas.paste(grass_tile, (x, y), grass_tile)

# --- Cottage builder ---
def build_cottage():
    c = Image.new("RGBA", (48, 64), (0, 0, 0, 0))
    # Roof: 3 tiles wide × 2 tall. Use cols 2-4 rows 1-2 of roof tileset.
    roof_block = roof.crop((2*TILE, 1*TILE, 5*TILE, 3*TILE))
    c.paste(roof_block, (0, 0), roof_block)
    # Walls: center 3x2 block from walls tileset cols 1-3 rows 1-2
    wall_block = walls.crop((1*TILE, 1*TILE, 4*TILE, 3*TILE))
    c.paste(wall_block, (0, 32), wall_block)
    # Door at bottom center (1 tile wide × 2 tall)
    door = doors.crop((0, 0, TILE, 2*TILE))
    c.paste(door, (16, 32), door)
    return c

def add_solar_panels(c):
    d = ImageDraw.Draw(c)
    panel_fill = (28, 55, 115, 235)
    panel_edge = (90, 145, 215, 255)
    # Position over roof (0..32 tall). Leave gap at top for slope peak.
    pad_x, pad_y = 5, 4
    pw, ph = 11, 6
    gap = 1
    for r in range(3):
        for col in range(3):
            x0 = pad_x + col * (pw + gap)
            y0 = pad_y + r * (ph + gap)
            d.rectangle([x0, y0, x0 + pw - 1, y0 + ph - 1], fill=panel_fill, outline=panel_edge)
            d.line([x0 + pw//3, y0 + 1, x0 + pw//3, y0 + ph - 2], fill=panel_edge)
            d.line([x0 + 2*pw//3, y0 + 1, x0 + 2*pw//3, y0 + ph - 2], fill=panel_edge)
    return c

cottage = build_cottage()
add_solar_panels(cottage)

# Soft ground shadow under cottage
def paste_with_shadow(canvas, sprite, x, y):
    sw, sh = sprite.size
    shadow = Image.new("RGBA", (sw + 8, 6), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.ellipse([0, 0, sw + 7, 5], fill=(0, 0, 0, 90))
    canvas.paste(shadow, (x - 4, y + sh - 3), shadow)
    canvas.paste(sprite, (x, y), sprite)

# Place 3 cottages
cottage_y = 40
for x in [40, 216, 392]:
    paste_with_shadow(canvas, cottage, x, cottage_y)

# --- Trees (2x3 from biom top-left: cols 0-1 rows 0-2) ---
tree1 = biom.crop((0, 0, 2*TILE, 3*TILE))
tree2 = biom.crop((2*TILE, 0, 4*TILE, 3*TILE))
tree_fruit = biom.crop((4*TILE, 0, 6*TILE, 3*TILE))

for (src, x, y) in [
    (tree1, 4, 56),
    (tree2, 128, 52),
    (tree_fruit, 176, 58),
    (tree1, 296, 52),
    (tree2, 352, 58),
    (tree_fruit, 456, 56),
]:
    canvas.paste(src, (x, y), src)

# --- Bushes & flowers along the front grass ---
bush = biom.crop((0, 3*TILE, TILE, 4*TILE))        # round green bush
bush_flower = biom.crop((0, 2*TILE, TILE, 3*TILE)) # bush w/ berries
flower_row = biom.crop((2*TILE, 2*TILE, 3*TILE, 3*TILE))  # small red flowers

for (src, x, y) in [
    (bush, 16, 120),
    (bush_flower, 76, 124),
    (flower_row, 108, 126),
    (bush, 160, 124),
    (flower_row, 200, 126),
    (bush_flower, 248, 120),
    (bush, 312, 124),
    (flower_row, 352, 126),
    (bush_flower, 416, 124),
    (bush, 452, 120),
]:
    canvas.paste(src, (x, y), src)

canvas.save(OUT)
print(f"Wrote {OUT} ({W}×{H})")
