#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Renders the full PNG icon set straight from the vector brand mark.

assets/brand/logo.svg is the single source of truth. Each raster is rendered
by rsvg-convert at its exact target size, so no intermediate master and no
downscaling step is involved.

Outputs (all transparent):
  assets/icons/favicon-16/32.png           - browser tabs
  assets/icons/apple-touch-icon.png        - iOS home screen, 180x180
  assets/icons/icon-192.png / icon-512.png - PWA manifest
  assets/img/logo.png                      - 256x256 mark for the JSON-LD logo

Run: python3 tools/make_icons.py   (requires rsvg-convert)
"""
import os
import shutil
import subprocess
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VECTOR = os.path.join(ROOT, "assets", "brand", "logo.svg")

RASTERS = [
    # path, size
    ("assets/icons/favicon-16.png", 16),
    ("assets/icons/favicon-32.png", 32),
    ("assets/icons/apple-touch-icon.png", 180),
    ("assets/icons/icon-192.png", 192),
    ("assets/icons/icon-512.png", 512),
    ("assets/img/logo.png", 256),
]


def render(size):
    """Rasterise the vector at exactly `size` px, one surface, full antialias."""
    out = os.path.join(ROOT, "assets", ".icon-tmp.png")
    cmd = ["rsvg-convert", "-w", str(size), "-h", str(size), VECTOR, "-o", out]
    if subprocess.call(cmd) != 0:
        sys.exit("rendering %s at %dpx failed" % (VECTOR, size))
    img = Image.open(out).convert("RGBA")
    os.remove(out)
    return img


def main():
    if not os.path.exists(VECTOR):
        raise SystemExit("assets/brand/logo.svg is missing -- it is the brand master")
    if shutil.which("rsvg-convert") is None:
        raise SystemExit("rsvg-convert not found -- install librsvg2-bin to rebuild the icons")

    for name, size in RASTERS:
        out = render(size)

        target = os.path.join(ROOT, name)
        os.makedirs(os.path.dirname(target), exist_ok=True)
        out.save(target, optimize=True)
        print("%-34s %4dx%-4d %6.1f KB"
              % (name, size, size, os.path.getsize(target) / 1024))


if __name__ == "__main__":
    main()
