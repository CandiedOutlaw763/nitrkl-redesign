"""Second crawl pass: parameterised records and pages that were rate-limited (403).

Usage: python fetch_extra.py <cache_dir>
Adds to <cache_dir>/index.json. Query URLs are keyed by their canonical form (see qkey in common.py).
"""
import hashlib
import html
import json
import os
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.parse import urlsplit, parse_qsl, urlencode, urlunsplit

import requests

cache = sys.argv[1]
index_path = os.path.join(cache, "index.json")
index = json.load(open(index_path))
deferred = json.load(open(os.path.join(cache, "deferred.json")))

session = requests.Session()
session.headers["User-Agent"] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36"
session.mount("https://", requests.adapters.HTTPAdapter(pool_connections=8, pool_maxsize=8))


def canon(u):
    p = urlsplit(html.unescape(html.unescape(u)))
    q = [(k.replace("amp;", ""), v) for k, v in parse_qsl(p.query, keep_blank_values=True)]
    return urlunsplit(("https", "www.nitrkl.ac.in", p.path, urlencode(q), ""))


todo = {}
# 1. rate-limited plain pages
for u, r in index.items():
    if r["status"] == 403 and "?" not in u:
        todo[u] = u
# 2. parameterised records
sids = {}
for u in list(index) + deferred:
    if "?" not in u:
        continue
    c = canon(u)
    p = urlsplit(c)
    ql = p.query.lower()
    pl = p.path.lower()
    if "searchalpha" in ql or "print" in pl:
        continue
    if pl.rstrip("/").endswith("/syllabus"):
        q = dict(parse_qsl(p.query))
        if q.get("sid") and q["sid"] not in sids:
            sids[q["sid"]] = "https://www.nitrkl.ac.in/Academic/Syllabus/?" + urlencode({"id": q.get("id", ""), "sid": q["sid"]})
        continue
    r = index.get(c)
    if r and r.get("status") == 200 and r.get("file"):
        continue
    todo[c] = c
for s, u in sids.items():
    r = index.get(u)
    if r and r.get("status") == 200 and r.get("file"):
        continue
    todo[u] = u

print("to fetch", len(todo), "syllabus sids", len(sids), flush=True)
json.dump(sids, open(os.path.join(cache, "syllabus_sids.json"), "w"))

delay = [0.0]


def get(u):
    for attempt in range(6):
        if delay[0]:
            time.sleep(delay[0])
        try:
            r = session.get(u, timeout=40)
        except Exception:
            time.sleep(3)
            continue
        if r.status_code in (403, 429, 503):
            delay[0] = min(5.0, delay[0] + 0.5)
            time.sleep(5 * (attempt + 1))
            continue
        delay[0] = max(0.0, delay[0] - 0.05)
        return r
    return None


def work(u):
    r = get(u)
    rec = {"status": r.status_code if r is not None else 0}
    if r is not None:
        rec["final"] = r.url
        rec["ctype"] = r.headers.get("content-type", "")
        if r.status_code == 200 and "html" in rec["ctype"]:
            fn = hashlib.sha1(u.lower().encode()).hexdigest()[:16] + ".html"
            with open(os.path.join(cache, "pages", fn), "wb") as f:
                f.write(r.content)
            rec["file"] = fn
    return u, rec


n = 0
with ThreadPoolExecutor(max_workers=6) as ex:
    for f in as_completed([ex.submit(work, u) for u in todo]):
        u, rec = f.result()
        index[u] = rec
        n += 1
        if n % 200 == 0:
            print(n, "delay", round(delay[0], 2), flush=True)
            json.dump(index, open(index_path + ".tmp", "w"))
            os.replace(index_path + ".tmp", index_path)
json.dump(index, open(index_path + ".tmp", "w"))
os.replace(index_path + ".tmp", index_path)
print("done", n)
