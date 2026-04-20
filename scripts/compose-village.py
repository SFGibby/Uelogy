#!/usr/bin/env python3
"""Compose a Stardew-style solar cottage village.

Cottages are hand-drawn pixel art (proper shape + solar panels baked in).
Ground/trees/bushes use Sprout Lands Basic pack by Cup Nooble (non-commercial, credited).
Output: /public/sprites/village-scene.png
"""
from PIL import Image, ImageDraw
from pathlib import Path

PACK = Path("/tmp/sprout-lands/Sprout Lands - Sprites - Basic pack")
OUT  = Path("/Users/gibson/Developer/samuel-gibson-site/public/sprites/village-scene.png")

W, H = 480, 128
TILE = 16

def load(*parts):
    return Image.open(PACK.joinpath(*parts)).convert("RGBA")

grass = load("Tilesets", "Grass.png")
biom  = load("Objects", "Basic_Grass_Biom_things.png")

canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))

grass_tile = grass.crop((5*TILE, 2*TILE, 6*TILE, 3*TILE))
for x in range(0, W, TILE):
    for y in range(0, H, TILE):
        canvas.paste(grass_tile, (x, y), grass_tile)

WALL_LIGHT = (221, 185, 134)
WALL_DARK  = (163, 119, 77)
WALL_TRIM  = (108, 68, 52)
ROOF_BASE  = (192, 108, 74)
ROOF_SHADE = (140, 70, 54)
ROOF_EDGE  = (92, 46, 38)
DOOR_BODY  = (110, 66, 44)
DOOR_DARK  = (72, 40, 26)
DOOR_KNOB  = (230, 190, 90)
WIN_FRAME  = (108, 68, 52)
WIN_GLASS  = (184, 220, 232)
WIN_HIGH   = (232, 244, 248)
PANEL_FILL = (28, 58, 124)
PANEL_EDGE = (118, 176, 232)
PANEL_DARK = (14, 28, 72)

def draw_cottage():
    w, h = 56, 52
    s = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(s)

    body_x0, body_y0 = 4, 20
    body_x1, body_y1 = w - 5, h - 2
    d.rectangle([body_x0, body_y0, body_x1, body_y1], fill=WALL_LIGHT, outline=WALL_TRIM)
    for yy in range(body_y0 + 3, body_y1, 3):
        d.line([body_x0 + 1, yy, body_x1 - 1, yy], fill=WALL_DARK)

    for wx in (body_x0 + 4, body_x1 - 11):
        wy = body_y0 + 4
        d.rectangle([wx, wy, wx + 6, wy + 6], fill=WIN_GLASS, outline=WIN_FRAME)
        d.line([wx + 3, wy, wx + 3, wy + 6], fill=WIN_FRAME)
        d.line([wx, wy + 3, wx + 6, wy + 3], fill=WIN_FRAME)
        d.point([wx + 1, wy + 1], fill=WIN_HIGH)
        d.point([wx + 4, wy + 1], fill=WIN_HIGH)

    door_w, door_h = 10, 14
    dx0 = (w - door_w) // 2
    dy0 = body_y1 - door_h
    d.rectangle([dx0, dy0, dx0 + door_w, dy0 + door_h], fill=DOOR_BODY, outline=DOOR_DARK)
    d.line([dx0 + door_w // 2, dy0 + 1, dx0 + door_w // 2, dy0 + door_h - 1], fill=DOOR_DARK)
    d.point([dx0 + door_w - 3, dy0 + door_h // 2], fill=DOOR_KNOB)

    peak_y = 0
    eave_y = 20
    roof_left, roof_right = 0, w - 1
    for yy in range(peak_y, eave_y):
        inset = (eave_y - yy) * (w // 2 - 2) // max(1, eave_y - peak_y)
        x0 = roof_left + inset
        x1 = roof_right - inset
        color = ROOF_BASE if (yy % 2 == 0) else ROOF_SHADE
        d.line([x0, yy, x1, yy], fill=color)
        d.point([x0, yy], fill=ROOF_EDGE)
        d.point([x1, yy], fill=ROOF_EDGE)
    d.line([roof_left, eave_y, roof_right, eave_y], fill=ROOF_EDGE)
    d.line([roof_left, eave_y + 1, roof_right, eave_y + 1], fill=ROOF_SHADE)

    panel_top_y = 6
    panel_bot_y = 17
    panel_left = 12
    panel_right = w - 13
    d.rectangle([panel_left - 1, panel_top_y - 1, panel_right + 1, panel_bot_y + 1], fill=PANEL_DARK)
    cols = 4
    cell_w = (panel_right - panel_left + 1) // cols
    for c in range(cols):
        px0 = panel_left + c * cell_w
        px1 = px0 + cell_w - 2
        d.rectangle([px0, panel_top_y, px1, panel_bot_y], fill=PANEL_FILL, outline=PANEL_EDGE)
        d.line([px0, panel_top_y + 5, px1, panel_top_y + 5], fill=PANEL_EDGE)
        d.line([(px0 + px1) // 2, panel_top_y + 1, (px0 + px1) // 2, panel_bot_y - 1], fill=PANEL_EDGE)

    chim_x = body_x1 - 10
    chim_top = 2
    chim_bot = 10
    d.rectangle([chim_x, chim_top, chim_x + 4, chim_bot], fill=WALL_TRIM, outline=(50, 24, 18))

    return s

cottage = draw_cottage()

def paste_with_shadow(dst, sprite, x, y):
    sw, sh = sprite.size
    shadow = Image.new("RGBA", (sw + 10, 7), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.ellipse([0, 0, sw + 9, 6], fill=(0, 0, 0, 95))
    dst.paste(shadow, (x - 5, y + sh - 3), shadow)
    dst.paste(sprite, (x, y), sprite)

cw, ch = cottage.size
cottage_y = H - ch - 16
positions_x = [40, 212, 384]
for cx in positions_x:
    paste_with_shadow(canvas, cottage, cx, cottage_y)

tree        = biom.crop((0, 0, 2*TILE, 3*TILE))
tree2       = biom.crop((2*TILE, 0, 4*TILE, 3*TILE))
tree_fruit  = biom.crop((4*TILE, 0, 6*TILE, 3*TILE))
tree_row_y = cottage_y + 8
for (src, x) in [
    (tree, 4),
    (tree_fruit, 112),
    (tree2, 180),
    (tree, 284),
    (tree_fruit, 352),
    (tree2, 452),
]:
    canvas.paste(src, (x, tree_row_y), src)

bush        = biom.crop((0, 3*TILE, TILE, 4*TILE))
bush_berry  = biom.crop((0, 2*TILE, TILE, 3*TILE))
tiny_flower = biom.crop((2*TILE, 2*TILE, 3*TILE, 3*TILE))
front_y = H - TILE - 2
for (src, x) in [
    (bush, 24),
    (tiny_flower, 72),
    (bush_berry, 104),
    (bush, 160),
    (tiny_flower, 200),
    (bush_berry, 240),
    (bush, 296),
    (tiny_flower, 336),
    (bush_berry, 376),
    (bush, 432),
]:
    canvas.paste(src, (x, front_y), src)

canvas.save(OUT)
print(f"Wrote {OUT} ({W}x{H})")
