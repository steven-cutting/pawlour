"""Draw the room's only texture maps with the already pinned Pillow.

Original artwork made here, CC0. Never imports an image or uses generated art.
"""

from pathlib import Path

from PIL import Image, ImageDraw


def build():
    folder = Path(__file__).parent / "textures"
    folder.mkdir(parents=True, exist_ok=True)
    rug = Image.new("RGB", (512, 512), "#a0582d")
    draw = ImageDraw.Draw(rug)
    draw.rectangle((15, 15, 496, 496), outline="#d9b58c", width=8)
    draw.rectangle((30, 30, 481, 481), outline="#5c331d", width=3)
    for y in (69, 424):
        draw.rectangle((32, y, 479, y + 10), fill="#d9b58c")
    for x in (102, 205, 307, 410):
        draw.polygon(((x, 193), (x + 32, 256), (x, 319), (x - 32, 256)), fill="#5c331d")
        draw.polygon(((x, 219), (x + 18, 256), (x, 293), (x - 18, 256)), fill="#b07a52")
    rug.save(folder / "rug.png", optimize=True)
    sleeves = Image.new("RGB", (512, 512), "#e6ceae")
    draw = ImageDraw.Draw(sleeves)
    for index, colour in enumerate(
        ("#8c5a34", "#a0582d", "#b07a52", "#d9b58c", "#5c331d", "#6e5646")
    ):
        x = index * 512 // 6
        right = (index + 1) * 512 // 6 - 1
        draw.rectangle((x, 0, right, 511), fill=colour)
        draw.rectangle((x + 8, 36, right - 8, 43), fill="#e6ceae")
        draw.rectangle((x + 8, 58, right - 19, 63), fill="#e6ceae")
        draw.ellipse((x + 10, 156, right - 10, 396), outline="#e6ceae", width=4)
    sleeves.save(folder / "sleeves.png", optimize=True)


if __name__ == "__main__":
    build()
