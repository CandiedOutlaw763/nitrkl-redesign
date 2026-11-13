"""Download the images used in page content and store them as WebP (1280px, album photos 720px).

Usage: python images.py <cache_dir>   (reads imglinks.json written by build.py; writes <cache_dir>/media/...)
The local file for https://www.nitrkl.ac.in/a/b/c.jpg is media/a/b/c.jpg.webp (see media_path in build.py).
"""
import io
import json
import os
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.parse import urlsplit, unquote

import requests
from PIL import Image, ImageOps

Image.MAX_IMAGE_PIXELS = 120_000_000
cache = sys.argv[1]
links = json.load(open(os.path.join(cache, "imglinks.json")))
media = os.path.join(cache, "media")
failed_path = os.path.join(cache, "imgfailed.json")
failed = set(json.load(open(failed_path))) if os.path.exists(failed_path) else set()

s = requests.Session()
s.headers["User-Agent"] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36"
s.mount("https://", requests.adapters.HTTPAdapter(pool_connections=8, pool_maxsize=8))


def local_file(u):
    p = unquote(urlsplit(u).path).lstrip("/")
    return os.path.join(media, *p.split("/")) + ".webp"


def work(u):
    out = local_file(u)
    if os.path.exists(out):
        return u, True
    try:
        r = s.get(u, timeout=60)
        if r.status_code != 200 or not r.content:
            return u, False
        im = Image.open(io.BytesIO(r.content))
        im = ImageOps.exif_transpose(im)
        if im.mode in ("P", "LA", "L") or (im.mode == "RGBA"):
            im = im.convert("RGBA")
        else:
            im = im.convert("RGB")
        album = "gallery" in u.lower()
        lim = 720 if album else 1280
        im.thumbnail((lim, lim))
        os.makedirs(os.path.dirname(out), exist_ok=True)
        im.save(out, "WEBP", quality=62 if album else 74, method=4)
        return u, True
    except Exception:
        return u, False


todo = [u for u in links if u not in failed and not os.path.exists(local_file(u))]
print("to download", len(todo), "of", len(links), flush=True)
n = ok = 0
with ThreadPoolExecutor(max_workers=8) as ex:
    for f in as_completed([ex.submit(work, u) for u in todo]):
        u, good = f.result()
        n += 1
        ok += good
        if not good:
            failed.add(u)
        if n % 250 == 0:
            print(n, "ok", ok, flush=True)
json.dump(sorted(failed), open(failed_path, "w"))
print("done", n, "ok", ok, "failed", n - ok)
