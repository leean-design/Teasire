"""Create the smaller copies of each tea photo that the site serves to phones.

For every photo in dist/assets/clean/ (e.g. 09_New_Tea.webp) this writes
09_New_Tea-480.webp and 09_New_Tea-800.webp next to it. Existing copies are
left alone. Requires Python 3 with Pillow (pip install Pillow).

Run from the Teasire-codebase folder:
    python scripts/make-photo-sizes.py
"""
from pathlib import Path

from PIL import Image

clean = Path(__file__).resolve().parent.parent / "dist" / "assets" / "clean"
for original in sorted(clean.glob("*.webp")):
    if original.stem.endswith(("-480", "-800")):
        continue
    with Image.open(original) as im:
        for width in (480, 800):
            copy = original.with_name(f"{original.stem}-{width}.webp")
            if copy.exists():
                continue
            height = round(im.height * width / im.width)
            im.resize((width, height), Image.LANCZOS).save(copy, "WEBP", quality=82, method=6)
            print("created", copy.name)
