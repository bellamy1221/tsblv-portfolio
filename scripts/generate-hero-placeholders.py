"""Generate temporary Hero layer placeholders. Replace with final assets in public/images/hero/."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

OUT = Path(__file__).resolve().parents[1] / "public" / "images" / "hero"
OUT.mkdir(parents=True, exist_ok=True)


def save(img: Image.Image, name: str) -> None:
    img.save(OUT / name, "WEBP", quality=82, method=6)
    print(f"Wrote {OUT / name}")


def mountains() -> None:
    w, h = 1920, 1080
    img = Image.new("RGB", (w, h), (18, 20, 22))
    draw = ImageDraw.Draw(img)
    peaks = [
        [(0, h), (280, 420), (520, h)],
        [(320, h), (680, 360), (980, h)],
        [(760, h), (1180, 300), (1520, h)],
        [(1200, h), (1560, 480), (1920, h)],
    ]
    for peak in peaks:
        draw.polygon(peak, fill=(32, 36, 38))
    draw.polygon([(0, h), (0, 520), (w, 380), (w, h)], fill=(24, 27, 29))
    img = img.filter(ImageFilter.GaussianBlur(1.2))
    save(img, "mountains.webp")


def tower() -> None:
    w, h = 480, 960
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    body = [(170, 120), (310, 120), (290, 820), (190, 820)]
    draw.polygon(body, fill=(58, 56, 52, 230))
    draw.polygon([(150, 120), (330, 120), (300, 60), (180, 60)], fill=(72, 70, 66, 240))
    draw.rectangle((228, 180, 252, 230), fill=(20, 22, 24, 180))
    for y in range(260, 760, 70):
        draw.line([(195, y), (285, y)], fill=(44, 42, 40, 120), width=2)
    save(img, "tower.webp")


def portrait() -> None:
    w, h = 900, 1200
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.ellipse((300, 80, 620, 420), fill=(14, 15, 16, 255))
    draw.polygon([(260, 380), (680, 420), (720, 1180), (220, 1180)], fill=(12, 13, 14, 255))
    draw.polygon([(420, 120), (520, 200), (480, 340), (390, 260)], fill=(22, 24, 26, 255))
    img = img.filter(ImageFilter.GaussianBlur(0.4))
    save(img, "portrait.webp")


def noise() -> None:
    import random

    random.seed(42)
    w, h = 512, 512
    img = Image.new("L", (w, h))
    px = img.load()
    for y in range(h):
        for x in range(w):
            px[x, y] = random.randint(0, 255)
    img = img.filter(ImageFilter.GaussianBlur(0.8))
    rgb = Image.merge("RGB", (img, img, img))
    save(rgb, "noise.webp")


if __name__ == "__main__":
    mountains()
    tower()
    portrait()
    noise()
