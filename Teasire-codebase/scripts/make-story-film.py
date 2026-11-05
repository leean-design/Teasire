"""Make the home page's osmanthus film: the osmanthus oolong photo
(dist/assets/clean/02_Oolong_Osmanthus.webp) brought to life as a seamless
10-second loop. The photo's own steam is lifted off the background and drifts
up, curling as it rises, and the flowering branch sways in a light breeze.

The first frame is the photo itself, so the page shows the photo and changes to
the film without a visible jump, and the last frame flows back into the first.

Writes dist/assets/teasire-osmanthus-film.mp4. Requires Python 3 with numpy,
scipy and Pillow (pip install numpy scipy Pillow), and ffmpeg.

Run from the Teasire-codebase folder:
    python scripts/make-story-film.py

The positions below (the steam above the glass, the branch) are measured on
this photo; another photo needs its own.
"""
import subprocess
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi

assets = Path(__file__).resolve().parent.parent / "dist" / "assets"
SOURCE = assets / "clean" / "02_Oolong_Osmanthus.webp"
OUTPUT = assets / "teasire-osmanthus-film.mp4"
SECONDS, FPS = 10.0, 24
LUMA = np.float32([0.299, 0.587, 0.114])

photo = np.asarray(Image.open(SOURCE).convert("RGB"), np.float32) / 255
H, W, _ = photo.shape
ys, xs = np.mgrid[0:H, 0:W].astype(np.float32)
rng = np.random.default_rng(7)


def blur(a, sigma):
    return ndi.gaussian_filter(a, sigma, mode="nearest")


def smoothstep(edge0, edge1, x):
    t = np.clip((x - edge0) / (edge1 - edge0), 0, 1)
    return t * t * (3 - 2 * t)


def box(top, bottom, left, right):
    m = np.zeros((H, W), np.float32)
    m[top:bottom, left:right] = 1
    return m


def waves(x, y, count, wavelengths, cycles, strength):
    """A few gentle waves across (x, y). Each repeats a whole number of times
    per loop, so the motion they make loops too. Returns t -> (dx, dy)."""
    modes = []
    for _ in range(count):
        length, angle = rng.uniform(*wavelengths), rng.uniform(0, 2 * np.pi)
        kx, ky = np.cos(angle), np.sin(angle)
        n = int(rng.integers(cycles[0], cycles[1] + 1)) * rng.choice([-1, 1])
        phase = (2 * np.pi / length) * (kx * x + ky * y) + rng.uniform(0, 2 * np.pi)
        modes.append((kx, ky, n, phase, strength * rng.uniform(0.6, 1.0)))

    def at(t):
        dx, dy = np.zeros_like(x), np.zeros_like(x)
        for kx, ky, n, phase, a in modes:
            c = a * np.cos(phase + 2 * np.pi * n * t / SECONDS)
            dx += c * ky  # across the wave, so the motion swirls
            dy -= c * kx
        return dx, dy

    return at


# 1. Lift the steam off the background.
RIM = 670  # top edge of the glass
saturation = (photo.max(2) - photo.min(2)) / (photo.max(2) + 1e-4)
blossom = (saturation > 0.58) & (photo @ LUMA > 0.18)
near_blossom = ndi.binary_dilation(blossom, iterations=9)
# Behind the steam is soft, out-of-focus green. Estimate it from the pixels
# around the steam, leaving out whatever is brighter than the estimate (the
# steam), a few times over.
known = (box(200, 720, 360, 1000) > 0) & ~near_blossom & (ys < RIM - 2)
use = known.copy()
for _ in range(6):
    weight = blur(use.astype(np.float32), 28) + 1e-6
    background = np.stack([blur(photo[..., c] * use, 28) / weight for c in range(3)], -1)
    brighter = (photo - background) @ LUMA > 0.02
    use = known & ~ndi.binary_dilation(brighter, iterations=3)
# The steam: above the rim, below the leaf, and clear of the lowest blossoms.
area = blur(box(362, RIM, 512, 858), 14) * smoothstep(RIM + 1, RIM - 10, ys)
area *= (1 - blur(box(270, 362, 630, 800), 8)) * (1 - blur(box(330, 505, 708, 880), 12))
area *= 1 - blur(near_blossom.astype(np.float32), 2)
steam = np.clip(photo - background - 0.01, 0, None) * area[..., None]
plate = photo - steam  # the photo without its steam

# 2. Steam motion. Two copies of the steam drift upward, each fading in and out
# over one cycle, half a cycle apart, so the rise never stops or jumps. Each
# cycle the copy is bent a little differently, and the column sways and curls
# more the higher it gets.
top, bottom, left, right = 250, 700, 440, 920
tex = steam[top:bottom, left:right]
Y, X = ys[top:bottom, left:right], xs[top:bottom, left:right]
height = RIM - Y
CYCLES = 3
cycle = SECONDS / CYCLES
rise_speed = 38.0 * (0.3 + 0.7 * smoothstep(0, 150, height))  # pixels a second
loose = smoothstep(-20, 260, height)


def bend():
    field = [blur(rng.standard_normal(X.shape).astype(np.float32), 26) for _ in range(2)]
    return [6 * f / f.std() * loose for f in field]


variants = [[bend() for _ in range(CYCLES)] for _ in range(2)]
variants[1][0] = [np.zeros_like(X), np.zeros_like(X)]  # the copy on show at the start is the photo's
swirl = waves(X, Y, 7, (70, 160), (1, 3), 2.6)


def sway(t):
    rel = height / 230 - t / (SECONDS / 2)
    return loose * (7 * np.sin(2 * np.pi * rel) + 3 * np.sin(2 * np.pi * (height / 120 - 3 * t / SECONDS) + 1.1))


front = blur(ndi.binary_dilation(blossom, iterations=3).astype(np.float32), 3)[top:bottom, left:right]
fade = (smoothstep(290, 345, Y) * (1 - 0.85 * front))[..., None]  # dissolves at the top; blossoms stay in front
swirl0, sway0 = swirl(0), sway(0)


def steam_at(t):
    out = np.zeros_like(tex)
    sx, sy = swirl(t)
    dx_all = (sx - swirl0[0]) * loose + sway(t) - sway0
    dy_all = (sy - swirl0[1]) * loose
    for k in (0, 1):
        u = t / cycle + k / 2
        tau, n = u % 1, int(np.floor(u)) % CYCLES
        bx, by = variants[k][n]
        rows = Y + rise_speed * (tau - 0.5) * cycle - dy_all - by - top
        cols = X - dx_all - bx - left
        w = np.sin(np.pi * tau) ** 2
        for c in range(3):
            out[..., c] += w * ndi.map_coordinates(tex[..., c], [rows, cols], order=1, cval=0.0)
    return out * fade


# What the drifting steam can't reproduce on the first frame (a thin top edge), held still.
steady = tex - steam_at(0)

# 3. The branch sways around a point off the top-right corner; its far end lags
# a little, like a flexible twig, and its flowers tremble slightly.
b_bottom, b_left = 600, 540
outline = Image.new("L", (W, H))
ImageDraw.Draw(outline).polygon(
    [(600, 0), (W, 0), (W, 560), (960, 548), (830, 520), (700, 515), (628, 440), (612, 330), (590, 250), (600, 120)],
    fill=255,
)
reach = blur(np.asarray(outline, np.float32) / 255, 26)[:b_bottom, b_left:]
BY, BX = ys[:b_bottom, b_left:], xs[:b_bottom, b_left:]
rx, ry = BX - 1260.0, BY + 170.0  # from the pivot
lag = (np.hypot(rx, ry) - 300) / 1400
tremble = waves(BX, BY, 6, (50, 90), (5, 8), 0.3)
tremble0 = tremble(0)
tips = np.clip(np.hypot(rx, ry) / 800, 0, 1)


def turn(t):
    return np.deg2rad(0.36) * (
        0.78 * np.sin(2 * np.pi * (t / SECONDS - 0.12 * lag))
        + 0.22 * np.sin(2 * np.pi * (3 * t / SECONDS - 0.25 * lag) + 1.3)
    )


turn0 = turn(0)


def branch_offset(t):
    a = turn(t) - turn0
    dx = (np.cos(a) - 1) * rx - np.sin(a) * ry
    dy = np.sin(a) * rx + (np.cos(a) - 1) * ry
    fx, fy = tremble(t)
    dx += (fx - tremble0[0]) * tips
    dy += (fy - tremble0[1]) * tips
    return dx * reach, dy * reach


splines = [ndi.spline_filter(plate[:b_bottom, b_left:, c], order=3, mode="mirror") for c in range(3)]


def frame(i):
    t = i / FPS
    out = plate.copy()
    dx, dy = branch_offset(t)
    for c in range(3):
        out[:b_bottom, b_left:, c] = ndi.map_coordinates(
            splines[c], [BY - dy, BX - dx - b_left], order=3, mode="mirror", prefilter=False
        )
    out[top:bottom, left:right] += steam_at(t) + steady
    return (np.clip(out, 0, 1) * 255 + 0.5).astype(np.uint8)


# 4. Encode. Colours are tagged as standard web colours (BT.709, sRGB), so the
# film matches the photo it replaces on screen.
encoder = subprocess.Popen(
    ["ffmpeg", "-y", "-loglevel", "error",
     "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
     "-vf", "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p",
     "-c:v", "libx264", "-preset", "veryslow", "-tune", "film", "-crf", "18", "-level:v", "4.0",
     "-x264-params", "aq-mode=3",
     "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "iec61966-2-1",
     "-movflags", "+faststart", "-an", str(OUTPUT)],
    stdin=subprocess.PIPE,
)
for i in range(int(SECONDS * FPS)):
    encoder.stdin.write(frame(i).tobytes())
encoder.stdin.close()
if encoder.wait():
    raise SystemExit("ffmpeg could not write the film")
print("created", OUTPUT.name)
