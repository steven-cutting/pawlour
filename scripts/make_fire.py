"""Draw the eight cel flame frames; no filtering, gradients or generated artwork."""

import math
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SIZE = 256
FRAMES = 8
COLOURS = ("#c8501e", "#f08a2a", "#ffd27a")


def tongue(layer, frame):
    """Nested convex masses with alternating sharp notches at their junctions.

    A fixed integer sequence chooses each tongue's phase and height. Sampling a
    full sine cycle makes the last-to-first frame as continuous as the others.
    """
    seed = 713
    points = []
    left = 20 + layer * 23
    right = 236 - layer * 23
    base = 246 - layer * 8
    points.append((left, base))
    for index in range(11):
        seed = (1664525 * seed + 1013904223) % (2**32)
        phase = (seed % 256) * math.tau / 256
        wave = math.sin(frame * math.tau / FRAMES + phase)
        x = left + (right - left) * index / 10
        arch = math.sin(index * math.pi / 10)
        height = (155 - layer * 38) * arch
        notch = 29 if index % 2 else 0
        y = base - max(0, height + wave * (13 - layer * 2) - notch)
        points.append((round(x + wave * 6), round(y)))
    points.extend(((right, base), (204 - layer * 18, 253), (52 + layer * 18, 253)))
    return points


def main():
    atlas = Image.new("RGBA", (SIZE, SIZE * FRAMES))
    for frame in range(FRAMES):
        cel = Image.new("RGBA", (SIZE, SIZE))
        draw = ImageDraw.Draw(cel)
        for layer, colour in enumerate(COLOURS):
            draw.polygon(tongue(layer, frame), fill=colour)
        atlas.paste(cel, (0, frame * SIZE))
    output = ROOT / "src/lib/assets/fire.webp"
    atlas.save(output, lossless=True, exact=True, method=6)
    print(f"{output.relative_to(ROOT)}: {atlas.size} {atlas.mode}; eight flat-colour frames")


if __name__ == "__main__":
    main()
