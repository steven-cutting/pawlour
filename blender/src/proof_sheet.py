"""Assemble the four native renders into a review sheet (requires Pillow)."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
BG = '#f4ede2'
INK = '#49382c'
MUTED = '#8a705b'


def font(size, serif=False):
    choices = ([Path('/System/Library/Fonts/Supplemental/Georgia.ttf')]
        if serif else [Path('/System/Library/Fonts/Helvetica.ttc')])
    choices += [Path('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf')]
    for path in choices:
        if path.exists():
            return ImageFont.truetype(str(path), size)
    return ImageFont.load_default(size=size)


def main():
    sheet = Image.new('RGB', (1920, 2070), BG)
    draw = ImageDraw.Draw(sheet)
    draw.text((72, 42), 'Biscuit', fill=INK, font=font(66, True))
    draw.text((74, 129), 'POSEABLE EDITION  /  FOUR STARTING POSES', fill=MUTED, font=font(24))
    poses = [('standing', 'Standing', 'The approved standing silhouette'),
             ('sitting', 'Sitting', 'Folded hind legs and an upright chest'),
             ('lying', 'Lying down', 'A relaxed pose with the legs folded'),
             ('paw-raised', 'Paw raised', 'One bent foreleg and a slight head tilt')]
    for index, (key, label, caption) in enumerate(poses):
        left = 64 + (index % 2) * 916
        top = 198 + (index // 2) * 896
        draw.rounded_rectangle((left, top, left + 888, top + 862), radius=20,
                               fill='#faf6ef', outline='#e1d5c4', width=2)
        render = Image.open(ROOT / 'previews/native' / (key + '.png')).convert('RGBA')
        render.thumbnail((830, 756), Image.Resampling.LANCZOS)
        sheet.paste(render, (left + (888 - render.width) // 2, top + 12), render)
        draw.text((left + 34, top + 758), f'{index + 1:02d}  {label}', fill=INK, font=font(34, True))
        draw.text((left + 34, top + 807), caption, fill=MUTED, font=font(23))
    draw.text((74, 2009), 'Open viewer.html to adjust a pose, save it, or export a PNG.', fill=MUTED, font=font(25))
    output = ROOT / 'previews/pose-overview.jpg'
    sheet.save(output, quality=94, subsampling=0)
    print(output)


if __name__ == '__main__':
    main()
