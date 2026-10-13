"""Build the Padel Counter icons from the approved source photo.

The JPEG is not stored in this branch. Fetch it with:

    git fetch origin assets/icon-source
    git show origin/assets/icon-source:assets/final/quelle-final.jpg > /tmp/quelle-final.jpg

Then run: python3 scripts/generate-icons.py /tmp/quelle-final.jpg
"""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
ICONS = PUBLIC / "icons"


def measured_blue(image: Image.Image) -> tuple[int, int, int]:
    """Average of the dark corner pixels, ignoring the motif."""
    rgb = image.convert("RGB")
    width, height = rgb.size
    samples: list[tuple[int, int, int]] = []
    span = max(4, min(width, height) // 24)
    for x0, y0 in ((0, 0), (width - span, 0), (0, height - span), (width - span, height - span)):
        for y in range(y0, y0 + span):
            for x in range(x0, x0 + span):
                pixel = rgb.getpixel((x, y))
                if pixel[2] >= pixel[0] and pixel[0] < 40 and pixel[1] < 40:
                    samples.append(pixel)
    if not samples:
        return (0, 7, 35)
    count = len(samples)
    return (
        round(sum(pixel[0] for pixel in samples) / count),
        round(sum(pixel[1] for pixel in samples) / count),
        round(sum(pixel[2] for pixel in samples) / count),
    )


def square_crop(source: Image.Image) -> Image.Image:
    rgb = source.convert("RGB")
    width, height = rgb.size
    side = min(width, height)
    left = (width - side) // 2
    top = (height - side) // 2
    return rgb.crop((left, top, left + side, top + side))


def save_png(image: Image.Image, path: Path, *, quantize: bool = False) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    rgb = image.convert("RGB")
    if quantize:
        stored = rgb.quantize(colors=256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.FLOYDSTEINBERG)
    else:
        stored = rgb
    stored.save(path, "PNG", optimize=True, compress_level=9)


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("usage: python3 scripts/generate-icons.py <source.jpg>")
    source = Image.open(sys.argv[1])
    master = square_crop(source)
    blue = measured_blue(master)
    print(f"theme #{blue[0]:02x}{blue[1]:02x}{blue[2]:02x}")

    icon_512 = master.resize((512, 512), Image.Resampling.LANCZOS)
    save_png(icon_512, ICONS / "icon-512.png", quantize=True)
    save_png(master.resize((192, 192), Image.Resampling.LANCZOS), ICONS / "icon-192.png", quantize=True)
    # Apple's touch icon must be opaque. Keep full RGB, no alpha.
    save_png(master.resize((180, 180), Image.Resampling.LANCZOS), ICONS / "apple-touch-icon.png")

    maskable = Image.new("RGB", (512, 512), blue)
    inner = round(512 * 0.8)
    motif = icon_512.resize((inner, inner), Image.Resampling.LANCZOS)
    offset = (512 - inner) // 2
    maskable.paste(motif, (offset, offset))
    save_png(maskable, ICONS / "icon-maskable-512.png", quantize=True)

    favicon_32 = master.resize((32, 32), Image.Resampling.LANCZOS)
    favicon_16 = master.resize((16, 16), Image.Resampling.LANCZOS)
    save_png(favicon_32, PUBLIC / "favicon-32.png")
    favicon_32.save(
        PUBLIC / "favicon.ico",
        format="ICO",
        sizes=[(16, 16), (32, 32)],
        append_images=[favicon_16],
    )


if __name__ == "__main__":
    main()
