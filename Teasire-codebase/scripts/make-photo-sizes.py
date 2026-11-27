"""Create the copies of each tea photo that the site needs.

For every photo in dist/assets/clean/ (e.g. 09_New_Tea.webp) this writes:
- 09_New_Tea-480.webp and 09_New_Tea-800.webp next to it: the smaller copies
  the site serves to phones;
- dist/assets/share/09_New_Tea.jpg: the wide picture shown when the tea's page
  is shared on WhatsApp or social media (1200 x 630, cut from the photo).

It also writes dist/assets/share/teasire.jpg, the picture shared for every
other page: three teas side by side.

Existing copies are left alone: delete one to have it made again. Requires
Python 3 with Pillow (pip install Pillow).

Run from the Teasire-codebase folder:
    python scripts/make-photo-sizes.py
"""
from pathlib import Path

from PIL import Image

assets = Path(__file__).resolve().parent.parent / "dist" / "assets"
clean = assets / "clean"
share = assets / "share"
SHARE_SIZE = (1200, 630)
# Where the middle of a tea's shared picture sits in its photo, from 0 (top) to
# 1 (bottom). Most cups sit a little below the middle; a photo with a tall
# glass needs the cut higher up. Add a line here if a new photo is cut badly.
SHARE_MIDDLE = {
    "03_Oolong_Rose": 0.46,
    "06_Oolong_Orange": 0.48,
    "07_Green_Tea_Orange": 0.48,
}
# The three photos in the picture shared for the rest of the site, left to right.
SHARE_TRIO = ("01_Green_Tea_Jasmine", "09_Osmanthus_Rose", "07_Green_Tea_Orange")
IVORY = (240, 237, 229)


def save_share(picture, name):
    picture.save(share / f"{name}.jpg", "JPEG", quality=84, optimize=True, progressive=True)
    print("created", f"share/{name}.jpg")


share.mkdir(exist_ok=True)
originals = [
    photo for photo in sorted(clean.glob("*.webp")) if not photo.stem.endswith(("-480", "-800"))
]
for original in originals:
    with Image.open(original) as im:
        for width in (480, 800):
            copy = original.with_name(f"{original.stem}-{width}.webp")
            if copy.exists():
                continue
            height = round(im.height * width / im.width)
            im.resize((width, height), Image.LANCZOS).save(copy, "WEBP", quality=82, method=6)
            print("created", copy.name)
        if not (share / f"{original.stem}.jpg").exists():
            # As wide as the shared picture, then a band cut from its height.
            width, height = SHARE_SIZE
            wide = im.convert("RGB").resize((width, round(im.height * width / im.width)), Image.LANCZOS)
            middle = SHARE_MIDDLE.get(original.stem, 0.56)
            top = int(min(max(wide.height * middle - height / 2, 0), wide.height - height))
            save_share(wide.crop((0, top, width, top + height)), original.stem)

if not (share / "teasire.jpg").exists():
    trio = [clean / f"{stem}.webp" for stem in SHARE_TRIO]
    if not all(photo.exists() for photo in trio):
        trio = originals[:3]
    width, height = SHARE_SIZE
    gap = 6  # ivory line between the photos
    column = (width - 2 * gap) // 3
    picture = Image.new("RGB", SHARE_SIZE, IVORY)
    for place, photo in enumerate(trio):
        with Image.open(photo) as im:
            tall = im.convert("RGB").resize((round(im.width * height / im.height), height), Image.LANCZOS)
        left = (tall.width - column) // 2
        picture.paste(tall.crop((left, 0, left + column, height)), (place * (column + gap), 0))
    save_share(picture, "teasire")
