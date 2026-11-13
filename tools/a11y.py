"""Run axe-core (WCAG 2.0/2.1 A and AA rules) on pages of the built site.

Usage: python a11y.py <base_url> <axe.min.js> <path> [<path> ...]
Prints each violation with its impact, rule and how many elements it affects.
"""
import sys
from collections import Counter

from playwright.sync_api import sync_playwright

base, axe_path, paths = sys.argv[1], sys.argv[2], sys.argv[3:]
axe = open(axe_path, encoding="utf-8").read()
totals = Counter()
with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome")
    page = b.new_page(viewport={"width": 1280, "height": 900})
    for path in paths:
        page.goto(base + path, wait_until="networkidle", timeout=60000)
        page.evaluate("""() => document.querySelectorAll('button').forEach(b => { if (/^(English|Reject non-essential)$/.test(b.textContent.trim())) b.click(); })""")
        page.wait_for_timeout(500)
        page.add_script_tag(content=axe)
        res = page.evaluate("""async () => {
            const r = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } });
            return r.violations.map(v => ({ id: v.id, impact: v.impact, n: v.nodes.length, help: v.help,
                                            where: v.nodes.slice(0, 3).map(n => n.target.join(' ')) }));
        }""")
        print(f"\n{path}: {len(res)} rule(s) violated")
        for v in res:
            totals[v["id"]] += v["n"]
            print(f"  [{v['impact']}] {v['id']} x{v['n']}: {v['help']}  e.g. {v['where']}")
    b.close()
print("\nTOTAL", dict(totals))
