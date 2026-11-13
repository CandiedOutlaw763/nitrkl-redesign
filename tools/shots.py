"""Screenshot pages of the built site for review.

Usage: python shots.py <base_url> <out_dir> <width> <path> [<path> ...]
Each path is saved as <out_dir>/<slug>-<width>.png (first 2400px of the page).
"""
import re
import sys

from playwright.sync_api import sync_playwright

base, out, width, paths = sys.argv[1], sys.argv[2], int(sys.argv[3]), sys.argv[4:]
with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome")
    ctx = b.new_context(viewport={"width": width, "height": 900}, device_scale_factor=1)
    page = ctx.new_page()
    errors = []
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    for path in paths:
        page.goto(base + path, wait_until="networkidle", timeout=60000)
        page.evaluate("""() => document.querySelectorAll('button').forEach(b => { if (/^(English|Reject non-essential)$/.test(b.textContent.trim())) b.click(); })""")
        page.wait_for_timeout(600)
        h = page.evaluate("document.documentElement.scrollHeight")
        slug = re.sub(r"[^A-Za-z0-9]+", "_", path).strip("_") or "home"
        page.screenshot(path=f"{out}/{slug}-{width}.png", full_page=True, clip={"x": 0, "y": 0, "width": width, "height": min(h, 2400)})
        print(path, "height", h)
    if errors:
        print("console errors:", errors[:10])
    b.close()
