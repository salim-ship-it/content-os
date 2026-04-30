#!/usr/bin/env python3
"""
process-flow.py — Generate a clean horizontal process-flow infographic.

Real brand logos (auto-downloaded from Google's high-res favicon service or
loaded from local file paths) + custom drawn icons composited into a square
LinkedIn image with arrows and labels.

Edit STEPS below, then run:
    python3 process-flow.py
"""
import io
import ssl
from pathlib import Path
from urllib.request import urlopen, Request
from PIL import Image, ImageDraw, ImageFont

SSL_CTX = ssl._create_unverified_context()

# ── EDIT THIS ─────────────────────────────────────────────────────────
STEPS = [
    {"domain": "fireflies.ai", "name": "Fireflies",   "sub": "Extract calls"},
    {"domain": "claude.ai",    "name": "Claude Code", "sub": "Feed transcripts"},
    {"icon":   "signal",       "name": "Signals",     "sub": "Spot patterns"},
    {"domain": "lemlist.com",  "name": "Lemlist",     "sub": "Send campaigns"},
]
FOOTER = "— from call to campaign"
OUTPUT = Path(__file__).parent / "assets" / "call-to-campaign-flow.png"

# Override a step's logo with a local PNG by adding "logo": "path/to.png"

# ── Layout ────────────────────────────────────────────────────────────
W, H = 1080, 1080
LOGO_BOX = 160       # logo bounding box
GAP = 36             # space between card edge and arrow
ARROW_LEN = 56
NAME_PX = 38
SUB_PX = 22
FOOTER_PX = 22
NAME_GAP = 28
SUB_GAP = 10

BG = (255, 255, 255)
INK = (15, 15, 15)
GRAY = (135, 135, 135)
ICON_COLOR = (255, 122, 0)

# ── Fonts ─────────────────────────────────────────────────────────────
def font(size, bold=False):
    paths = [
        ("/System/Library/Fonts/Helvetica.ttc", 1 if bold else 0),
        ("/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold
         else "/System/Library/Fonts/Supplemental/Arial.ttf", 0),
        ("/Library/Fonts/Arial Bold.ttf" if bold
         else "/Library/Fonts/Arial.ttf", 0),
    ]
    for p, idx in paths:
        if Path(p).exists():
            try:
                return ImageFont.truetype(p, size, index=idx)
            except Exception:
                pass
    return ImageFont.load_default()

# ── Logo fetch ────────────────────────────────────────────────────────
FAVICON_URL = (
    "https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON"
    "&fallback_opts=TYPE,SIZE,URL&url=https://{d}&size=256"
)

def fetch_logo(domain: str) -> Image.Image:
    url = FAVICON_URL.format(d=domain)
    req = Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urlopen(req, timeout=10, context=SSL_CTX) as r:
        data = r.read()
    return Image.open(io.BytesIO(data)).convert("RGBA")

def fit_logo(img: Image.Image, box: int) -> Image.Image:
    img = img.copy()
    img.thumbnail((box, box), Image.LANCZOS)
    canvas = Image.new("RGBA", (box, box), (0, 0, 0, 0))
    canvas.paste(img, ((box - img.width) // 2, (box - img.height) // 2), img)
    return canvas

# ── Custom drawn icons ────────────────────────────────────────────────
def signal_icon(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    cx, cy = size // 2, size // 2
    # central dot
    r = int(size * 0.10)
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=ICON_COLOR)
    # concentric arcs (top + bottom halves)
    for radius in (0.26, 0.40, 0.54):
        rr = int(size * radius)
        w = max(4, int(size * 0.05))
        bbox = (cx - rr, cy - rr, cx + rr, cy + rr)
        d.arc(bbox, start=200, end=340, fill=ICON_COLOR, width=w)
        d.arc(bbox, start=20,  end=160, fill=ICON_COLOR, width=w)
    return img

ICONS = {"signal": signal_icon}

# ── Render ────────────────────────────────────────────────────────────
def render():
    canvas = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(canvas)

    name_f = font(NAME_PX, bold=True)
    sub_f = font(SUB_PX)
    footer_f = font(FOOTER_PX)

    # Resolve every logo first
    logos = []
    for s in STEPS:
        if "logo" in s:
            img = Image.open(s["logo"]).convert("RGBA")
        elif s.get("icon") in ICONS:
            img = ICONS[s["icon"]](LOGO_BOX)
        elif "domain" in s:
            print(f"Fetching {s['domain']}...")
            try:
                img = fetch_logo(s["domain"])
            except Exception as e:
                print(f"  failed ({e}); using placeholder")
                img = signal_icon(LOGO_BOX)
        else:
            img = signal_icon(LOGO_BOX)
        logos.append(fit_logo(img, LOGO_BOX))

    # Card width = max(logo, name, sub)
    widths = []
    for s in STEPS:
        nw = draw.textlength(s["name"], font=name_f)
        sw = draw.textlength(s["sub"], font=sub_f)
        widths.append(int(max(LOGO_BOX, nw, sw)) + 8)

    n = len(STEPS)
    arrow_block = GAP + ARROW_LEN + GAP
    total_w = sum(widths) + (n - 1) * arrow_block
    if total_w > W - 80:
        # scale down spacing if needed
        overflow = total_w - (W - 80)
        per = overflow // max(1, (n - 1))
        ARROW_LEN_LOCAL = max(28, ARROW_LEN - per)
    else:
        ARROW_LEN_LOCAL = ARROW_LEN
    arrow_block = GAP + ARROW_LEN_LOCAL + GAP
    total_w = sum(widths) + (n - 1) * arrow_block

    x = (W - total_w) // 2
    card_h = LOGO_BOX + NAME_GAP + NAME_PX + SUB_GAP + SUB_PX
    y_top = (H - card_h) // 2

    for i, (s, logo, cw) in enumerate(zip(STEPS, logos, widths)):
        cx = x + cw // 2
        canvas.paste(logo, (cx - LOGO_BOX // 2, y_top), logo)

        ny = y_top + LOGO_BOX + NAME_GAP
        nw = draw.textlength(s["name"], font=name_f)
        draw.text((cx - nw / 2, ny), s["name"], font=name_f, fill=INK)

        sy = ny + NAME_PX + SUB_GAP
        sw = draw.textlength(s["sub"], font=sub_f)
        draw.text((cx - sw / 2, sy), s["sub"], font=sub_f, fill=GRAY)

        x += cw
        if i < n - 1:
            ax = x + GAP
            ay = y_top + LOGO_BOX // 2
            draw.line([(ax, ay), (ax + ARROW_LEN_LOCAL - 6, ay)],
                      fill=INK, width=3)
            draw.polygon(
                [(ax + ARROW_LEN_LOCAL, ay),
                 (ax + ARROW_LEN_LOCAL - 12, ay - 8),
                 (ax + ARROW_LEN_LOCAL - 12, ay + 8)],
                fill=INK,
            )
            x += arrow_block

    fw = draw.textlength(FOOTER, font=footer_f)
    draw.text(((W - fw) / 2, H - 110), FOOTER, font=footer_f, fill=GRAY)

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(OUTPUT, "PNG")
    print(f"Saved: {OUTPUT}")


if __name__ == "__main__":
    render()
