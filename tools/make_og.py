#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Generates the social preview card (og-image) for the StackDev Studio landing page.

Output:
  assets/img/og-image.jpg - 1200x630 social preview card (a PNG is not kept:
                            the JPG is the only format any crawler asks for)

The brand mark comes straight from the icon-512 raster -- the same one the
PWA manifest uses -- so the preview card and the site always show the same logo.

Pure Pillow + stdlib, no network. Run: python3 tools/make_og.py
"""
import os
import subprocess

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOGO_PNG = os.path.join(ROOT, "assets", "icons", "icon-512.png")

BG = (7, 8, 13)
BG_TOP = (18, 21, 38)
CYAN = (77, 216, 230)
VIOLET = (124, 107, 255)
MAGENTA = (198, 92, 255)
TEXT = (240, 241, 247)
TEXT_DIM = (184, 189, 212)

FONT_CANDIDATES = {
    "bold": ["Inter-Bold.ttf", "Inter_18pt-Bold.ttf", "DejaVuSans-Bold.ttf",
             "LiberationSans-Bold.ttf"],
    "black": ["Inter-ExtraBold.ttf", "Inter_18pt-ExtraBold.ttf", "DejaVuSans-Bold.ttf",
               "LiberationSans-Bold.ttf"],
    "semibold": ["Inter-SemiBold.ttf", "Inter_18pt-SemiBold.ttf", "DejaVuSans-Bold.ttf",
                 "LiberationSans-Bold.ttf"],
    "reg": ["Inter-Regular.ttf", "Inter_18pt-Regular.ttf", "DejaVuSans.ttf",
            "LiberationSans-Regular.ttf"],
    "mono": ["JetBrainsMono-Regular.ttf", "DejaVuSansMono.ttf", "LiberationMono-Regular.ttf"],
}
FONT_DIRS = [
    "/usr/share/fonts/truetype/dejavu",
    "/usr/share/fonts/TTF",
    "/usr/share/fonts",
    os.path.expanduser("~/.fonts"),
    os.path.expanduser("~/.local/share/fonts"),
]
FONTS = {}


def find_font(kind):
    for name in FONT_CANDIDATES[kind]:
        for d in FONT_DIRS:
            p = os.path.join(d, name)
            if os.path.exists(p):
                return p
        found = subprocess.run(
            ["fc-match", "-f", "%{file}", name], capture_output=True, text=True
        ).stdout.strip()
        if found and os.path.exists(found):
            return found
    raise RuntimeError("font not found for %s" % kind)


def font(kind, size):
    if kind not in FONTS:
        FONTS[kind] = find_font(kind)
    return ImageFont.truetype(FONTS[kind], size)


def radial(size, center, radius, color, strength):
    """Smooth radial glow: evaluated on a quarter-size grid, upscaled and
    blurred. Stacked ellipse outlines produce visible concentric banding."""
    w, h = size
    sw, sh = max(2, w // 4), max(2, h // 4)
    cx, cy, r = center[0] / 4.0, center[1] / 4.0, radius / 4.0
    cr, cg, cb = color
    small = Image.new("RGBA", (sw, sh))
    px = small.load()
    for y in range(sh):
        dy = y - cy
        for x in range(sw):
            dist = ((x - cx) ** 2 + (dy * 2) ** 2) ** 0.5 / r
            if dist >= 1.0:
                continue
            a = int(strength * (1.0 - dist) ** 2.4 + 0.5)
            if a:
                px[x, y] = (cr, cg, cb, a)
    return small.resize((w, h), Image.LANCZOS).filter(
        ImageFilter.GaussianBlur(radius=w / 220.0))


def logo_mark(size):
    """Mark from assets/icons/icon-512.png on transparency -- no backing plate."""
    return Image.open(LOGO_PNG).convert("RGBA").resize((size, size), Image.LANCZOS)


def mock_panel(size):
    """A miniature of the site's terminal panel, drawn to match the hero mock."""
    w, h = size
    panel = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    pd = ImageDraw.Draw(panel)

    pd.rounded_rectangle([0, 0, w - 1, h - 1], radius=18,
                         fill=(14, 17, 27, 242), outline=(30, 34, 51, 255), width=1)
    pd.rounded_rectangle([1, 1, w - 2, 52], radius=17, fill=(255, 255, 255, 8))
    pd.line([(0, 52), (w, 52)], fill=(23, 26, 39, 255))

    for i, c in enumerate([(255, 95, 87), (254, 188, 46), (40, 200, 64)]):
        pd.ellipse([20 + i * 20, 21, 30 + i * 20, 31], fill=c + (255,))
    pd.text((w // 2, 26), "stack-dev / deploy", font=font("mono", 13),
            fill=(134, 140, 166, 255), anchor="mm")

    rows = [
        ("✓", "bot.onUpdate", "aiogram 3.x"),
        ("✓", "db.migrate", "postgresql"),
        ("✓", "ui.build", "react"),
        ("▸", "webhook.listen", ":443"),
        ("✓", "live", "12 мс"),
    ]
    y = 88
    for mark, code, note in rows:
        colour = (74, 222, 128, 255) if mark == "✓" else (77, 216, 230, 255)
        pd.text((22, y), mark, font=font("mono", 15), fill=colour, anchor="lm")
        cx = pd.textlength(mark, font=font("mono", 15)) + 34
        pd.text((cx, y), code, font=font("mono", 15), fill=(240, 241, 247, 255), anchor="lm")
        pd.text((cx + pd.textlength(code, font=font("mono", 15)) + 10, y), note,
                font=font("mono", 14), fill=(106, 112, 137, 255), anchor="lm")
        y += 34

    pd.line([(0, h - 74), (w, h - 74)], fill=(23, 26, 39, 255))
    for i, (big, small) in enumerate([("3", "дня до запуска"), ("24/7", "работает без вас")]):
        cx = 24 + i * (w / 2)
        pd.text((cx, h - 44), big, font=font("bold", 22), fill=(198, 92, 255, 255), anchor="lm")
        pd.text((cx, h - 20), small, font=font("reg", 12), fill=(134, 140, 166, 255), anchor="lm")

    return panel


def build_og():
    W, H = 1200, 630
    img = Image.new("RGBA", (W, H), BG + (255,))

    # Ambient colour: a violet wash from the top-right, cyan from the left.
    img = Image.alpha_composite(img, radial((W, H), (1080, 40), 900, VIOLET, 120))
    img = Image.alpha_composite(img, radial((W, H), (60, 250), 620, CYAN, 60))

    # Grid, fading downward -- same visual language as the site hero.
    grid = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grid)
    for x in range(0, W, 60):
        gd.line([(x, 0), (x, H)], fill=(255, 255, 255, 10))
    for y in range(0, H, 60):
        gd.line([(0, y), (W, y)], fill=(255, 255, 255, 10))
    mask = Image.new("L", (W, H), 0)
    ImageDraw.Draw(mask).rectangle([0, 0, W, 360], fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(120))
    img = Image.alpha_composite(img, Image.composite(grid, Image.new("RGBA", (W, H)), mask))

    d = ImageDraw.Draw(img)
    X = 72

    # ---- left column: identity + headline ----
    img.alpha_composite(logo_mark(76), (X, 62))
    d = ImageDraw.Draw(img)

    d.text((X + 98, 84), "StackDev Studio", font=font("bold", 26), fill=TEXT, anchor="lm")
    d.text((X + 98, 116), "stack-dev.ru", font=font("mono", 18), fill=VIOLET, anchor="lm")

    title = font("black", 66)

    d.text((X, 196), "Разработка,", font=title, fill=TEXT)
    d.text((X, 272), "которая", font=title, fill=TEXT)
    d.text((X, 348), "автоматизирует", font=title, fill=CYAN)
    d.text((X, 424), "ваш бизнес", font=title, fill=MAGENTA)

    # ---- bottom strip: trust chips ----
    chip_f = font("semibold", 19)
    x = X
    for label in ("ИП на НПД", "Договор и чек", "Запуск от 3 дней"):
        tb = d.textbbox((0, 0), label, font=chip_f)
        cw, ch = (tb[2] - tb[0]) + 34, (tb[3] - tb[1]) + 18
        d.rounded_rectangle([x, 526, x + cw, 526 + ch], radius=ch // 2,
                            fill=(124, 107, 255, 46), outline=(124, 107, 255, 120), width=2)
        d.text((x + 17, 526 + ch // 2), label, font=chip_f, fill=TEXT_DIM, anchor="lm")
        x += cw + 12

    # ---- right column: the product mock ----
    panel = mock_panel((470, 330))
    # Soft drop shadow so the panel sits on the background instead of floating flat.
    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    shadow.paste((0, 0, 0, 190), (672 + 8, 150 + 22), panel.split()[3])
    img = Image.alpha_composite(img, shadow.filter(ImageFilter.GaussianBlur(28)))
    img.alpha_composite(panel, (672, 150))
    d = ImageDraw.Draw(img)

    # ---- footer ----
    d.line([(X, 580), (W - X, 580)], fill=(23, 26, 39, 255))
    d.text((X, 604), "Чат-боты и WebApp · Экспресс-сайты · Скрипты автоматизации",
           font=font("reg", 18), fill=(134, 140, 166, 255), anchor="lm")
    d.text((W - X, 604), "Смета и срок — до старта",
           font=font("semibold", 18), fill=(184, 189, 212, 255), anchor="rm")

    flat = Image.new("RGB", (W, H), BG)
    flat.paste(img.convert("RGB"))
    out = os.path.join(ROOT, "assets", "img", "og-image.jpg")
    flat.save(out, quality=92, optimize=True, progressive=True)
    return out


if __name__ == "__main__":
    print("og-image written to", build_og())