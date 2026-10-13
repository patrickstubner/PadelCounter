"""Rasterize the Padel Counter icons. Requires Pillow."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "icons"
FONT = "/usr/share/fonts/truetype/macos/Inter-Bold.ttf"
LIME = "#e4ff47"
AMBER = "#ffb020"
WHITE = "#ffffff"
BLACK = "#000000"


def draw_icon(size: int, inset: float) -> Image.Image:
    image = Image.new("RGB", (size, size), BLACK)
    draw = ImageDraw.Draw(image)
    pad = size * inset
    bar = max(4, round(size * 0.07))
    radius = bar // 2
    draw.rounded_rectangle([pad, pad, pad + bar, size - pad], radius=radius, fill=LIME)
    draw.rounded_rectangle(
        [size - pad - bar, pad, size - pad, size - pad],
        radius=radius,
        fill=AMBER,
    )
    font = ImageFont.truetype(FONT, int(size * (0.52 if inset < 0.12 else 0.42)))
    text = "0"
    box = draw.textbbox((0, 0), text, font=font)
    width = box[2] - box[0]
    height = box[3] - box[1]
    x = (size - width) / 2 - box[0]
    y = (size - height) / 2 - box[1] - size * 0.02
    draw.text((x, y), text, font=font, fill=WHITE)
    return image


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    draw_icon(512, 0.09).save(OUT / "icon-512.png", "PNG")
    draw_icon(192, 0.09).save(OUT / "icon-192.png", "PNG")
    draw_icon(180, 0.1).save(OUT / "apple-touch-icon.png", "PNG")
    draw_icon(512, 0.18).save(OUT / "icon-maskable-512.png", "PNG")


if __name__ == "__main__":
    main()
