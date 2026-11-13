"""Look up the size of every linked document (HEAD requests) so links can say "(PDF, 277 KB)".

Usage: python docsizes.py <cache_dir>   (reads doclinks.json written by build.py, updates docsizes.json)
"""
import json
import os
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed

import requests

cache = sys.argv[1]
links = json.load(open(os.path.join(cache, "doclinks.json")))
out_path = os.path.join(cache, "docsizes.json")
sizes = json.load(open(out_path)) if os.path.exists(out_path) else {}
todo = [u for u in links if u not in sizes]
print("to check", len(todo), flush=True)

s = requests.Session()
s.headers["User-Agent"] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36"
s.mount("https://", requests.adapters.HTTPAdapter(pool_connections=8, pool_maxsize=8))


def head(u):
    for _ in range(3):
        try:
            r = s.head(u, timeout=30, allow_redirects=True)
            if r.status_code == 200:
                n = int(r.headers.get("content-length") or 0)
                return u, n or None
            if r.status_code == 404:
                return u, 0
        except Exception:
            pass
    return u, None


n = 0
with ThreadPoolExecutor(max_workers=8) as ex:
    for f in as_completed([ex.submit(head, u) for u in todo]):
        u, size = f.result()
        if size is not None:
            sizes[u] = size
        n += 1
        if n % 500 == 0:
            print(n, flush=True)
            json.dump(sizes, open(out_path, "w"))
json.dump(sizes, open(out_path, "w"))
print("done", len(sizes), "missing (404):", sum(1 for v in sizes.values() if v == 0))
