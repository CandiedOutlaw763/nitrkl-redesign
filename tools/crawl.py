"""Crawl www.nitrkl.ac.in (HTML pages only) into a local cache.

Usage: python crawl.py <cache_dir> [max_pages]
Writes <cache_dir>/pages/<sha1>.html and <cache_dir>/index.json
({url: {"file":..., "status":..., "final":...}}) plus links.json (doc/image refs).
"""
import hashlib
import html as htmlmod
import json
import os
import re
import sys
import threading
import time
from collections import deque
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import urljoin, urlsplit, urlunsplit, unquote

import requests


HOST = "www.nitrkl.ac.in"
BASE = "https://" + HOST
SKIP_EXT = re.compile(
    r"\.(pdf|docx?|xlsx?|pptx?|zip|rar|7z|jpe?g|png|gif|webp|svg|bmp|tiff?|mp4|mp3|avi|mov|wmv|ico|css|js|xml|txt|csv|odt|ods|exe|apk|msi|woff2?|ttf|eot)$",
    re.I,
)
SKIP_PATH = re.compile(r"^/(assets|docs|Images|images|uploads|Uploads|css|js|bundles|Content|Scripts)/", re.I)

cache = sys.argv[1]
MAX = int(sys.argv[2]) if len(sys.argv) > 2 else 6000
os.makedirs(os.path.join(cache, "pages"), exist_ok=True)

session = requests.Session()
session.headers["User-Agent"] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36"
adapter = requests.adapters.HTTPAdapter(pool_connections=16, pool_maxsize=16, max_retries=2)
session.mount("https://", adapter)

lock = threading.Lock()
index_path = os.path.join(cache, "index.json")
index = json.load(open(index_path)) if os.path.exists(index_path) else {}
files = set()
seen = set(k.lower() for k in index)
queue = deque()
assets = {}
qcount = {}
deferred = []


def norm(href, base):
    if not href:
        return None
    href = href.strip()
    if href.startswith(("mailto:", "tel:", "javascript:", "#", "data:")):
        return None
    u = urljoin(base, href)
    p = urlsplit(u)
    if p.scheme not in ("http", "https"):
        return None
    host = p.netloc.lower()
    if host in ("nitrkl.ac.in",):
        host = HOST
    if host != HOST:
        return None
    path = re.sub(r"/{2,}", "/", p.path or "/")
    return urlunsplit(("https", HOST, path, p.query, ""))


def extract_links(html, base):
    out = []
    for m in re.finditer(r"""(?:href|src)\s*=\s*["']([^"']+)["']""", html, re.I):
        u = norm(htmlmod.unescape(htmlmod.unescape(m.group(1))), base)
        if u:
            out.append(u)
    return out


def fetch(url):
    for attempt in range(3):
        try:
            r = session.get(url, timeout=40, allow_redirects=True)
            return r
        except Exception as e:  # noqa
            time.sleep(2 + attempt * 3)
    return None


def process(url):
    r = fetch(url)
    rec = {"status": r.status_code if r is not None else 0}
    links = []
    if r is not None:
        rec["final"] = r.url
        ctype = r.headers.get("content-type", "")
        rec["ctype"] = ctype
        if r.status_code == 200 and "html" in ctype:
            h = hashlib.sha1(url.lower().encode()).hexdigest()[:16]
            fn = h + ".html"
            with open(os.path.join(cache, "pages", fn), "wb") as f:
                f.write(r.content)
            rec["file"] = fn
            text = r.content.decode("utf-8", "ignore")
            links = extract_links(text, r.url)
    return url, rec, links


def enqueue(u):
    path = urlsplit(u).path
    if SKIP_EXT.search(path) or SKIP_PATH.match(path):
        with lock:
            assets[u] = assets.get(u, 0) + 1
        return
    k = u.lower()
    if k in seen:
        return
    seen.add(k)
    sp = urlsplit(u)
    if sp.query:
        pk = sp.path.lower().rstrip("/")
        with lock:
            qcount[pk] = qcount.get(pk, 0) + 1
            if qcount[pk] > 12:
                deferred.append(u)
                return
    queue.append(u)


seed = [BASE + "/"]
if os.path.exists(os.path.join(cache, "seeds.txt")):
    seed += [l.strip() for l in open(os.path.join(cache, "seeds.txt")) if l.strip()]
for s in seed:
    u = norm(s, BASE)
    if u and u.lower() not in seen:
        seen.add(u.lower())
        queue.append(u)

# re-enqueue links from pages already in the cache (resume)
for u0, r0 in list(index.items()):
    sp0 = urlsplit(u0)
    if sp0.query:
        pk0 = sp0.path.lower().rstrip("/")
        qcount[pk0] = qcount.get(pk0, 0) + 1
for u0, r0 in list(index.items()):
    if r0.get("file"):
        t0 = open(os.path.join(cache, "pages", r0["file"]), encoding="utf-8", errors="ignore").read()
        for l in extract_links(t0, r0.get("final", u0)):
            enqueue(l)
print("resumed; queue", len(queue), "deferred", len(deferred), flush=True)

done = 0
with ThreadPoolExecutor(max_workers=10) as ex:
    futures = set()
    while (queue or futures) and done < MAX:
        while queue and len(futures) < 20:
            futures.add(ex.submit(process, queue.popleft()))
        # wait for any
        finished = [f for f in list(futures) if f.done()]
        if not finished:
            time.sleep(0.05)
            continue
        for f in finished:
            futures.discard(f)
            url, rec, links = f.result()
            index[url] = rec
            done += 1
            for l in links:
                enqueue(l)
            if done % 100 == 0:
                print(f"{done} done, queue {len(queue)}", flush=True)
                json.dump(index, open(index_path, "w"), indent=0)

json.dump(index, open(index_path, "w"), indent=0)
json.dump(assets, open(os.path.join(cache, "assets.json"), "w"), indent=0)
json.dump(list(queue), open(os.path.join(cache, "pending.json"), "w"), indent=0)
json.dump(deferred, open(os.path.join(cache, "deferred.json"), "w"), indent=0)
print("finished", done, "pending", len(queue))
