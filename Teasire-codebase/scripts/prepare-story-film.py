"""Put a new film in the home page's osmanthus spot, beside "Nothing to rush".

Takes a video made elsewhere (for example with Runway) and writes:
- dist/assets/teasire-osmanthus-film.mp4: the film, made to loop smoothly (its
  last second fades into its first), silent and compressed for the web;
- dist/assets/teasire-osmanthus-still.webp and its -480 copy: the film's first
  frame, shown until the film plays and to visitors who prefer less motion.

The video should be portrait with a still camera. It is cropped to 3:4 if
needed, and made at most 834 pixels wide. Requires Python 3 with Pillow
(pip install Pillow) and ffmpeg.

Run from the Teasire-codebase folder:
    python scripts/prepare-story-film.py path/to/video.mp4
"""
import io
import json
import subprocess
import sys
from pathlib import Path

from PIL import Image

assets = Path(__file__).resolve().parent.parent / "dist" / "assets"
FILM = assets / "teasire-osmanthus-film.mp4"
STILL = assets / "teasire-osmanthus-still.webp"
BLEND = 1.0  # seconds at the end that fade into the start

if len(sys.argv) != 2:
    raise SystemExit(__doc__)
probe = subprocess.run(
    ["ffprobe", "-v", "error", "-select_streams", "v:0", "-count_frames",
     "-show_entries", "stream=nb_read_frames,r_frame_rate", "-of", "json", sys.argv[1]],
    capture_output=True, check=True,
)
stream = json.loads(probe.stdout)["streams"][0]
frames = int(stream["nb_read_frames"])
num, den = map(int, stream["r_frame_rate"].split("/"))
fps = num / den
blend = round(BLEND * fps)

# The film starts `blend` frames into the video. Its last `blend` frames fade
# into the video's first ones, which lead straight on to the film's start.
graph = (
    "[0:v]crop='min(iw,ih*3/4)':'min(ih,iw*4/3)',scale='min(834,iw)':-2,split[a][b];"
    f"[a]trim=start_frame={blend},setpts=PTS-STARTPTS[main];"
    f"[b]trim=end_frame={blend},setpts=PTS-STARTPTS[head];"
    f"[main][head]xfade=transition=fade:duration={blend / fps}:offset={(frames - 2 * blend) / fps},"
    "format=yuv420p[film]"
)
# Colours are tagged as standard web colours (BT.709, sRGB), so every browser
# shows the film the same way, and the same as the still.
subprocess.run(
    ["ffmpeg", "-y", "-v", "error", "-i", sys.argv[1], "-filter_complex", graph, "-map", "[film]",
     "-c:v", "libx264", "-preset", "veryslow", "-tune", "film", "-crf", "23", "-level:v", "4.0",
     "-x264-params", "aq-mode=3",
     "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "iec61966-2-1", "-color_range", "tv",
     "-movflags", "+faststart", "-an", str(FILM)],
    check=True,
)
first = subprocess.run(
    ["ffmpeg", "-v", "error", "-i", str(FILM), "-frames:v", "1",
     "-vf", "scale=in_color_matrix=bt709:in_range=tv,format=rgb24", "-f", "image2pipe", "-c:v", "png", "-"],
    capture_output=True, check=True,
).stdout
still = Image.open(io.BytesIO(first))
still.save(STILL, "WEBP", quality=85, method=6)
small = still.resize((480, round(still.height * 480 / still.width)), Image.LANCZOS)
small.save(STILL.with_name(STILL.stem + "-480.webp"), "WEBP", quality=82, method=6)
print(f"created {FILM.name} ({FILM.stat().st_size / 1e6:.1f} MB, {(frames - blend) / fps:.1f} s) "
      f"and {STILL.name} ({still.width} x {still.height})")
