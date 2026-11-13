"""Build the redesigned NIT Rourkela website from the crawl cache.

Usage: python build.py <cache_dir> <design_dir> <out_dir>

  cache_dir   output of crawl.py / fetch_extra.py (index.json, pages/)
  design_dir  the redesign's static root (nitrkl/ in nitrdesign_km): index.html, assets/, docs/,
              screen-reader-access.html (the inner-page template)
  out_dir     where the finished static site is written (design_dir is copied in first)

Every official page is re-rendered inside the redesign's header, main navigation and footer, with its
content cleaned into the content-page components (assets/site/inner.css). Pages with query strings
(syllabi, seminars, galleries, publications) are kept at their official URLs: the page at the path is
a viewer that loads the record's content from /_q/ (assets/site/inner.js).
"""
import copy
import hashlib
import html as htmlmod
import json
import os
import re
import shutil
import sys
from collections import OrderedDict, defaultdict
from datetime import date
from urllib.parse import urljoin, urlsplit, urlunsplit, parse_qsl, quote, unquote

from bs4 import BeautifulSoup, NavigableString, Comment, Tag

CACHE, DESIGN, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
HOST = "www.nitrkl.ac.in"
OFFICIAL = "https://" + HOST
TODAY = date.today()
TODAY_H = TODAY.strftime("%d %b %Y").lstrip("0")

index = json.load(open(os.path.join(CACHE, "index.json")))
docsize_path = os.path.join(CACHE, "docsizes.json")
docsizes = json.load(open(docsize_path)) if os.path.exists(docsize_path) else {}

DOC_EXT = {
    "pdf": "PDF", "doc": "Word", "docx": "Word", "xls": "Excel", "xlsx": "Excel", "ppt": "PowerPoint",
    "pptx": "PowerPoint", "zip": "ZIP", "rar": "RAR", "dwg": "DWG", "odt": "ODT", "csv": "CSV", "mp4": "MP4",
    "txt": "Text", "jpg": "JPEG", "jpeg": "JPEG", "png": "PNG",
}
IMG_EXT = {"jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"}


# ----------------------------------------------------------------------------------------------
# URL model
# ----------------------------------------------------------------------------------------------
def unesc(s):
    return htmlmod.unescape(htmlmod.unescape(s or ""))


def norm_query(q):
    pairs = [(k.replace("amp;", "").lower(), v) for k, v in parse_qsl(q, keep_blank_values=True)]
    pairs.sort()
    return "&".join(f"{k}={v}" for k, v in pairs)


def is_official_host(netloc):
    return netloc.lower() in (HOST, "nitrkl.ac.in")


def plain_key(path):
    p = re.sub(r"/{2,}", "/", unquote(path)).rstrip("/").lower()
    return p or "/"


def is_syllabus_path(pk):
    return pk.endswith("/syllabus")


SKIP_Q = re.compile(r"searchalpha", re.I)

# Collect pages
plain = {}  # plain_key -> {"url": canonical url (case from crawl), "file": ...}
qrecs = defaultdict(dict)  # base plain_key -> {normq: {"url":..., "file":...}}
syllabus = {}  # sid -> file
for u, r in index.items():
    if r.get("status") != 200 or not r.get("file"):
        continue
    if "html" not in r.get("ctype", "html"):
        continue
    fin = r.get("final") or u
    fp = urlsplit(fin)
    if not is_official_host(fp.netloc):
        continue
    up = urlsplit(unesc(u))
    pk = plain_key(up.path)
    if up.query:
        if SKIP_Q.search(up.query) or "print" in pk:
            continue
        q = norm_query(up.query)
        if is_syllabus_path(pk):
            sid = dict(parse_qsl(q)).get("sid")
            if sid and "sid=" in u and "amp;" not in u:
                syllabus[sid] = r["file"]
            continue
        qrecs[pk][q] = {"url": unesc(u), "file": r["file"]}
    else:
        if pk in plain:
            continue
        # skip junk paths produced by broken relative links on the official site (e.g. /CH/~x/www.youtube.com/...)
        if re.search(r"/(www\.|https?:)", up.path, re.I) or re.search(r"\.(com|org|in|net)(/|$)", up.path.split("/", 3)[-1] if up.path.count("/") > 2 else "", re.I):
            continue
        plain[pk] = {"url": unesc(u), "file": r["file"], "final": fin}

# Paths that become viewers for parameterised records
viewer_bases = set(qrecs)
# every */Syllabus path that appears in any link gets a viewer; collected while rendering
syllabus_bases = set()


def out_path_for(url):
    """Local URL path (with trailing slash) for an official plain URL."""
    p = re.sub(r"/{2,}", "/", unquote(urlsplit(url).path))
    p = p.strip("/")
    return "/" + (p + "/" if p else "")


local_of = {}  # plain_key -> local path
for pk, rec in plain.items():
    local_of[pk] = out_path_for(rec["url"])
for pk in qrecs:
    if pk not in local_of:
        # take the original casing from one of its records
        any_url = next(iter(qrecs[pk].values()))["url"]
        local_of[pk] = out_path_for(any_url)


def doc_meta(abs_url):
    path = urlsplit(abs_url).path
    ext = path.rsplit(".", 1)[-1].lower() if "." in path.rsplit("/", 1)[-1] else ""
    if ext not in DOC_EXT or ext in IMG_EXT and ext not in ("jpg", "jpeg", "png"):
        return None
    size = docsizes.get(abs_url)
    label = DOC_EXT.get(ext, ext.upper())
    if size:
        if size >= 1024 * 1024:
            s = f"{size / 1024 / 1024:.1f} MB"
        else:
            s = f"{max(1, round(size / 1024))} KB"
        return ext, f"{label}, {s}"
    return ext, label


doc_links = set()
img_links = set()
MEDIA = os.path.join(CACHE, "media")


def media_src(abs_url):
    """Local WebP copy of an official image if images.py has fetched it, else the official URL."""
    p = urlsplit(abs_url)
    if not is_official_host(p.netloc):
        return abs_url
    path = unquote(p.path)
    ext = path.rsplit(".", 1)[-1].lower() if "." in path.rsplit("/", 1)[-1] else ""
    if ext not in IMG_EXT or ext == "svg":
        return abs_url
    off = urlunsplit(("https", HOST, quote(path, safe="/~-_.()!*'@:+,;=&$"), "", ""))
    img_links.add(off)
    local = os.path.join(MEDIA, *path.lstrip("/").split("/")) + ".webp"
    if os.path.exists(local):
        return "/media/" + quote(path.lstrip("/"), safe="/~-_.()!*'@:+,;=&$") + ".webp"
    return off


def rewrite_href(href, base):
    """Returns (new_href, kind) where kind in {local, official, doc, external, anchor, mail, none}."""
    if href is None:
        return None, "none"
    href = unesc(href.strip())
    if not href or href.lower().startswith("javascript:") or href == "#":
        return None, "none"
    if href.startswith("#"):
        return href, "anchor"
    if href.lower().startswith(("mailto:", "tel:")):
        return href.replace(" ", ""), "mail"
    # fix common official typos: "www.x.com" written without scheme
    if re.match(r"^www\.", href, re.I):
        href = "https://" + href
    try:
        absu = urljoin(base, href)
    except ValueError:
        return None, "none"
    p = urlsplit(absu)
    if p.scheme not in ("http", "https"):
        return absu, "external"
    if not is_official_host(p.netloc):
        return absu, "external"
    path = re.sub(r"/{2,}", "/", p.path)
    official = urlunsplit(("https", HOST, quote(unquote(path), safe="/~-_.()!*'@:+,;=&$"), p.query, ""))
    ext = path.rsplit(".", 1)[-1].lower() if "." in path.rsplit("/", 1)[-1] else ""
    if ext and ext not in ("html", "htm", "aspx", "php"):
        if ext in DOC_EXT:
            doc_links.add(official)
            return official, "doc"
        return official, "official"
    pk = plain_key(path)
    frag = ("#" + p.fragment) if p.fragment else ""
    if p.query:
        if is_syllabus_path(pk):
            syllabus_bases.add(pk)
            lp = local_of.get(pk) or out_path_for(official)
            local_of.setdefault(pk, lp)
            return lp + "?" + p.query + frag, "local"
        if pk in qrecs and norm_query(p.query) in qrecs[pk]:
            return local_of[pk] + "?" + p.query + frag, "local"
        if pk in plain and SKIP_Q.search(p.query):
            return local_of[pk] + frag, "local"
        return official, "official"
    if pk in plain or pk in qrecs:
        return local_of[pk] + frag, "local"
    if pk == "/":
        return "/" + frag, "local"
    return official, "official"


# ----------------------------------------------------------------------------------------------
# Template from the redesign's inner page
# ----------------------------------------------------------------------------------------------
tpl_src = open(os.path.join(DESIGN, "screen-reader-access.html"), encoding="utf-8").read()
head_end = tpl_src.index("</head>")
main_start = tpl_src.index('<main id="main"')
main_end = tpl_src.index("</main>") + len("</main>")
TPL_HEAD = tpl_src[:head_end]
TPL_TOP = tpl_src[head_end:main_start]
TPL_BOTTOM = tpl_src[main_end:]


def absolutize_assets(s):
    s = re.sub(r'(href|src)="(assets|docs)/', r'\1="/\2/', s)
    s = s.replace('href="screen-reader-access.html"', 'href="/screen-reader-access.html"')
    return s


TPL_HEAD = absolutize_assets(TPL_HEAD)
TPL_TOP = absolutize_assets(TPL_TOP)
TPL_BOTTOM = absolutize_assets(TPL_BOTTOM)
# Screen-reader link is only "current" on its own page
TPL_TOP = TPL_TOP.replace('action="/Search"', 'action="/Search/"')
TPL_TOP = TPL_TOP.replace(' aria-current="page" title="Screen Reader Access"', ' title="Screen Reader Access"')
# Mega-menu column headings link nowhere (href=""): make them plain headings
TPL_TOP = re.sub(r'<h2 class="mega-h"><a href="">(.*?)</a></h2>', r'<h2 class="mega-h">\1</h2>', TPL_TOP)
TPL_TOP = TPL_TOP.replace('<li><a href="javascript:void(0);">Central Workshop</a></li>', '<li><a href="https://www.nitrkl.ac.in/CentralWorkshop/">Central Workshop</a></li>')
TPL_HEAD = TPL_HEAD.replace(
    '<link href="/assets/site/guidelines.css" rel="stylesheet"/>',
    '<link href="/assets/site/guidelines.css" rel="stylesheet"/>\n<link href="/assets/site/inner.css" rel="stylesheet"/>',
)
TPL_BOTTOM = TPL_BOTTOM.replace(
    '<script src="/assets/js/nitrkl-accessibility.js"></script>',
    '<script src="/assets/js/nitrkl-accessibility.js"></script>\n<script src="/assets/site/inner.js" defer></script>',
)
TPL_BOTTOM = TPL_BOTTOM.replace(
    '<time id="lastUpdated" datetime="2026-10-26">26 Oct 2026</time>',
    f'<time id="lastUpdated" datetime="{TODAY.isoformat()}">{TODAY_H}</time>',
)

# Menu groups from the main navigation, used as "In this section" when a page has none of its own
menu_soup = BeautifulSoup(TPL_TOP.replace("</head>", "", 1), "html.parser")
menu_groups = []  # (top label, group label, [(text, href)])
for top in menu_soup.select("#navmenu > li"):
    tl = top.select_one(".nav-top")
    tlabel = tl.get_text(strip=True) if tl else ""
    for col in top.select(".mega-col"):
        cur = None
        for el in col.children:
            if not isinstance(el, Tag):
                continue
            if el.name == "h2":
                cur = [tlabel, el.get_text(strip=True), []]
                menu_groups.append(cur)
            elif el.name == "ul" and cur is not None:
                cur[2] += [(a.get_text(" ", strip=True), a.get("href")) for a in el.select("a")]
    dd = top.select_one(".gz-nav-dropdown")
    if dd:
        menu_groups.append([tlabel, tlabel, [(a.get_text(" ", strip=True), a.get("href")) for a in dd.select("a")]])
menu_index = defaultdict(list)
for g in menu_groups:
    for t, h in g[2]:
        if h and h.startswith("/"):
            menu_index[plain_key(h)].append(g)

# Rewrite the template's own links to local pages where they exist (official ones stay absolute)
def rewrite_tpl_links(s):
    def rep(m):
        href = m.group(2)
        if href.startswith("/") and not href.startswith(("/assets/", "/docs/")) and href != "/screen-reader-access.html":
            new, kind = rewrite_href(href, OFFICIAL + "/")
            if new and kind in ("local", "official", "doc"):
                return f'{m.group(1)}="{htmlmod.escape(new, quote=True)}"'
        return m.group(0)
    return re.sub(r'(href)="([^"]*)"', rep, s)


# ----------------------------------------------------------------------------------------------
# Content cleaning
# ----------------------------------------------------------------------------------------------
DROP_TAGS = {"script", "style", "noscript", "input", "button", "form", "select", "textarea", "link", "meta", "svg", "canvas", "object", "embed", "template"}
UNWRAP_TAGS = {"div", "section", "article", "span", "font", "center", "main", "aside", "label", "header", "nav", "footer", "o:p", "fieldset", "legend", "body", "html"}
INLINE_TAGS = {"a", "strong", "b", "em", "i", "u", "br", "sup", "sub", "small", "mark", "abbr", "code", "span", "font", "img", "time", "cite", "q", "s", "del", "ins"}
BLOCK_TAGS = {"p", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "table", "figure", "blockquote", "dl", "details", "hr", "pre", "iframe", "div", "section", "article"}
ATTRS = {
    "a": {"href", "title", "target", "rel", "class", "data-meta", "aria-label"},
    "img": {"src", "alt", "width", "height", "loading", "decoding", "class"},
    "td": {"colspan", "rowspan"}, "th": {"colspan", "rowspan", "scope"},
    "iframe": {"src", "title", "width", "height", "allowfullscreen", "loading"},
    "ol": {"start", "type"}, "details": {"class", "open"}, "summary": {"class"},
}
KEEP_CLASS = re.compile(r"^(cp-|ip-)")


def txt(el):
    return re.sub(r"\s+", " ", el.get_text(" ", strip=True)) if el else ""


def new(soup, name, cls=None, text=None, **attrs):
    t = soup.new_tag(name, attrs=attrs)
    if cls:
        t["class"] = cls
    if text is not None:
        t.string = text
    return t


def transform_patterns(soup, root, base):
    """Turn the official site's components into the redesign's components before generic cleaning."""
    hero_imgs = []
    for prof in root.select(".faculty-profile-row"):
        faculty_profile(soup, root, prof)
    # Links that wrap whole blocks (icon + heading tiles, picture cards) -> one tidy link per item
    for a in root.find_all("a"):
        if not a.find(["div", "h1", "h2", "h3", "h4", "h5", "h6", "p", "ul", "table"]):
            continue
        if a.find_parent(class_=re.compile("carousel|owl-carousel")):
            continue
        img = a.find("img")
        head = a.find(re.compile(r"^h[1-6]$"))
        title = txt(head) or txt(a)
        extra = txt(a)
        if head and extra.startswith(title):
            extra = extra[len(title):].strip(" -|:")
        elif extra == title:
            extra = ""
        li = new(soup, "li", ["cp-tile"])
        a2 = new(soup, "a", href=a.get("href") or "")
        if a.get("target"):
            a2["target"] = a["target"]
        if img is not None and img.get("src"):
            a2.append(new(soup, "img", src=img["src"], alt=""))
        a2.append(new(soup, "span", ["cp-tile-t"], text=title or "Open"))
        if extra and len(extra) < 200:
            a2.append(new(soup, "span", ["cp-tile-m"], text=extra))
        li.append(a2)
        a.replace_with(li)
    # Carousels: collect images; the first becomes the page's hero picture, the rest a gallery
    for car in root.select(".carousel, .owl-carousel, .slider, .swiper"):
        imgs = [i for i in car.select("img") if i.get("src")]
        caps = [txt(c) for c in car.select(".carousel-caption h2, .carousel-caption h1")]
        if imgs:
            hero_imgs.append((media_src(urljoin(base, unesc(imgs[0]["src"]))), caps[0] if caps else ""))
        if len(imgs) > 1 and not car.find_parent(class_="faculty-profile-row"):
            ul = new(soup, "ul", ["cp-gallery"])
            for i in imgs[1:13]:
                li = new(soup, "li")
                im = new(soup, "img", src=i["src"], alt=i.get("alt") or "")
                li.append(im)
                ul.append(li)
            car.replace_with(ul)
        else:
            car.decompose()

    # Tabs: each tab becomes a titled section, read in order
    for tabs in root.select("ul.nav-tabs, ul.nav-pills, div.nav-tabs, nav .nav-tabs, div.nav.nav-tabs"):
        labels = []
        for a in tabs.select("a, button"):
            tgt = a.get("data-bs-target") or a.get("data-target") or a.get("href") or ""
            if tgt.startswith("#") and len(tgt) > 1:
                labels.append((tgt[1:], txt(a)))
        for pid, label in labels:
            pane = root.find(id=pid)
            if pane is not None and label:
                h = new(soup, "h2", text=label)
                pane.insert(0, h)
        tabs.decompose()
    for pane in root.select(".tab-pane"):
        pane["class"] = []

    # Accordions -> <details>
    for item in root.select(".accordion-item, .accordion .card, .panel.panel-default"):
        head = item.select_one(".accordion-header, .accordion-button, .card-header, .panel-heading")
        body = item.select_one(".accordion-collapse, .accordion-body, .collapse, .panel-collapse")
        if not head or not body:
            continue
        d = new(soup, "details", ["cp-acc"])
        s = new(soup, "summary", text=txt(head))
        d.append(s)
        inner = new(soup, "div", ["cp-acc-body"])
        for ch in list(body.children):
            inner.append(ch.extract())
        d.append(inner)
        item.replace_with(d)

    # People: directors, board members, administration, faculty and staff directories
    for x in root.select(".alpha-serch, .alpha-search"):
        x.decompose()
    for w in root.select(".testi-wrap, .testi-item, .fac-item, .staff-item, .team-item, .single-team, .member-item"):
        img = w.select_one("img")
        name_el = None
        for sel in (".name", ".card-body h5", ".desc", "h3", "h4", "h5"):
            name_el = w.select_one(sel)
            if name_el is not None and txt(name_el):
                break
        if name_el is None:
            continue
        small = name_el.find("small")
        role_in_name = txt(small) if small else ""
        if small:
            small.extract()
        name = txt(name_el)
        if not name:
            continue
        lines = []
        if role_in_name:
            lines.append(("t", role_in_name))
        for x in w.select(".designation, .info p, .position, .card-body p, .card-body small, .desc, .user-info p"):
            if x is name_el or name_el in x.parents or x in name_el.parents:
                continue
            t = txt(x)
            if not t or t == name:
                continue
            icon = " ".join(x.find("i").get("class", [])) if x.find("i") else ""
            kind = "mail" if ("envelope" in icon or re.fullmatch(r"\S+@\S+", t)) else "tel" if ("phone" in icon or "mobile" in icon) else "t"
            lines.append((kind, t))
        art = new(soup, "article", ["cp-person"])
        if img is not None and img.get("src") and "blank" not in img["src"].lower():
            fig = new(soup, "div", ["cp-person-img"])
            fig.append(new(soup, "img", src=img["src"], alt=""))
            art.append(fig)
        else:
            art["class"] = ["cp-person", "cp-person--noimg"]
        bodyd = new(soup, "div", ["cp-person-body"])
        a = name_el.find("a")
        h = new(soup, "h3")
        if a is not None and a.get("href"):
            h.append(new(soup, "a", href=a["href"], text=name))
        else:
            h.string = name
        bodyd.append(h)
        seen = set()
        for kind, l in lines:
            if l in seen:
                continue
            seen.add(l)
            pp = new(soup, "p")
            if kind == "mail":
                for i, m in enumerate(re.findall(r"[\w.+-]+(?:@|\[at\])[\w-]+(?:\.[\w-]+)+", l) or [l]):
                    if i:
                        pp.append(", ")
                    addr = m.replace("[at]", "@")
                    pp.append(new(soup, "a", href="mailto:" + addr, text=addr) if "@" in addr else m)
            elif kind == "tel":
                pp.append(new(soup, "a", href="tel:" + re.sub(r"[^\d+]", "", l)[:15], text=l))
            else:
                pp.string = l
            bodyd.append(pp)
        for a2 in w.select("a[href^=mailto]"):
            if a2["href"][7:] not in seen:
                pp = new(soup, "p")
                pp.append(new(soup, "a", href=a2["href"], text=a2["href"][7:]))
                bodyd.append(pp)
        art.append(bodyd)
        w.replace_with(art)
    # group consecutive person cards into a grid
    for art in root.select("article.cp-person"):
        if art.parent and "cp-people" in (art.parent.get("class") or []):
            continue
        grid = new(soup, "div", ["cp-people"])
        art.insert_before(grid)
        sib = grid.next_sibling
        while sib is not None:
            nxt = sib.next_sibling
            if isinstance(sib, Tag) and sib.name == "article" and "cp-person" in sib.get("class", []):
                grid.append(sib.extract())
            elif isinstance(sib, NavigableString) and not sib.strip():
                sib.extract()
            else:
                break
            sib = nxt

    # Counters -> a statistics list
    for box in root.select("#counter, .dept-publish-info, .publish-info, .counter-area, .funfact"):
        items = []
        for it in box.select(".item, .counter-item, .single-counter") or [box]:
            num = it.select_one(".counter, h4, h3")
            if not num:
                continue
            n = txt(num)
            num.extract()
            label = txt(it)
            if n and label:
                items.append((n, label))
        if items:
            dl = new(soup, "dl", ["cp-stats"])
            for n, l in items:
                dv = new(soup, "div", ["cp-stat"])
                dv.append(new(soup, "dt", text=l))
                dv.append(new(soup, "dd", text=n))
                dl.append(dv)
            box.replace_with(dl)

    # Bootstrap cards -> simple panels
    for card in root.select(".card"):
        head = card.select_one(".card-header, .card-title")
        if head:
            h = new(soup, "h3", text=txt(head))
            head.replace_with(h)
        card["class"] = ["cp-card"]
    return hero_imgs


def _cap(t):
    return t.title() if t.isupper() and len(t) > 3 else t


def faculty_profile(soup, root, prof):
    """Official faculty profile -> profile header (photo, name, role, contacts, IDs), figures, sections."""
    info = prof.select_one(".basic-ifo .item, .basic-ifo")
    h3 = info.find("h3") if info else None
    spans = h3.find_all("span") if h3 else []
    name = txt(spans[0]) if spans else (txt(h3) if h3 else "")
    alt = txt(spans[1]) if len(spans) > 1 else ""
    role = txt(h3.find("small")) if h3 and h3.find("small") else ""
    name = name.title() if name.isupper() else name
    wrap = new(soup, "div", ["cp-prof"])
    img = prof.select_one(".img-box img")
    if img and img.get("src"):
        f = new(soup, "div", ["cp-prof-img"])
        f.append(new(soup, "img", src=img["src"], alt=f"Photograph of {name}" if name else ""))
        wrap.append(f)
    mainb = new(soup, "div", ["cp-prof-main"])
    if alt:
        mainb.append(new(soup, "p", ["cp-prof-alt"], text=alt))
    if role:
        mainb.append(new(soup, "p", ["cp-prof-role"], text=role))
    ul = new(soup, "ul", ["cp-prof-contact"])
    for pc in (info.select("p.contactinfo") if info else []):
        icon = " ".join(pc.find("i").get("class", [])) if pc.find("i") else ""
        t = txt(pc)
        li = new(soup, "li")
        if "envelope" in icon:
            li["class"] = ["cp-pc-mail"]
            for i, m in enumerate(re.findall(r"[\w.+-]+@[\w-]+(?:\.[\w-]+)+", t)):
                if i:
                    li.append(" / ")
                li.append(new(soup, "a", href="mailto:" + m, text=m))
        elif "phone" in icon or "mobile" in icon:
            li["class"] = ["cp-pc-phone"]
            li.append(new(soup, "a", href="tel:" + re.sub(r"[^\d+]", "", t), text=t))
        else:
            li.string = t
        ul.append(li)
    room = prof.select_one(".personal-info .personal-row")
    if room:
        for pp in room.find_all("p"):
            if "Room" in txt(pp):
                ul.append(new(soup, "li", ["cp-pc-room"], text=txt(pp)))
    if ul.contents:
        mainb.append(ul)
    chips = new(soup, "ul", ["cp-chips"])
    bs = info.select_one(".biosketch a") if info else None
    if bs and bs.get("href"):
        li = new(soup, "li")
        li.append(new(soup, "a", href=bs["href"], text="Biosketch (CV)"))
        chips.append(li)
    for a in prof.select(".academic-identity a"):
        li = new(soup, "li")
        li.append(new(soup, "a", href=a.get("href", ""), text=txt(a) or "Profile"))
        chips.append(li)
    labels = {"globe": "Website", "facebook": "Facebook", "twitter": "X", "linkedin": "LinkedIn", "youtube": "YouTube", "instagram": "Instagram", "github": "GitHub"}
    for a in prof.select(".social-link a"):
        icon = " ".join(a.find("i").get("class", [])) if a.find("i") else ""
        lab = next((v for k, v in labels.items() if k in icon), "Link")
        li = new(soup, "li")
        li.append(new(soup, "a", href=a.get("href", ""), text=lab))
        chips.append(li)
    if chips.contents:
        mainb.append(chips)
    wrap.append(mainb)
    out = [wrap]
    stats = prof.select_one(".publish-info")
    if stats:
        out.append(stats.extract())
    for blk in prof.select(".item-info1 .personal-info > div"):
        h = blk.find("h4")
        if h:
            h.name = "h2"
            h.string = _cap(txt(h))
        for h5 in blk.find_all("h5"):
            h5.name = "h3"
        out.append(blk.extract())
    acc = prof.select_one(".accordion")
    if acc:
        for b in acc.select(".accordion-header, .accordion-button"):
            for i in b.find_all("i"):
                i.decompose()
        for b in acc.select(".accordion-button"):
            b.string = _cap(txt(b))
        for pb in acc.select(".publi-button a"):
            pb.name = "span"
        out.append(acc.extract())
    root["data-title"] = name
    prof.clear()
    for o in out:
        prof.append(o)
    prof.unwrap()


def heading_remap(root):
    """Page headings start at h2 under the page's h1 and keep their order; card titles stay h3."""
    def in_card(h):
        return h.find_parent(class_=re.compile(r"^cp-(person|tiles|prof|card)")) is not None
    heads = [h for h in root.find_all(re.compile(r"^h[1-6]$")) if not in_card(h)]
    levels = sorted({int(h.name[1]) for h in heads})
    mp = {lv: min(6, 2 + i) for i, lv in enumerate(levels)}
    for h in heads:
        h.name = f"h{mp[int(h.name[1])]}"


def clean(soup, root, base):
    # comments
    for c in root.find_all(string=lambda s: isinstance(s, Comment)):
        c.extract()
    for t in root.find_all(DROP_TAGS):
        t.decompose()
    # hidden / decorative bits
    for t in root.select("[style*='display:none'], [style*='display: none'], .modal-backdrop, .visually-hidden, .sr-only, .d-none:not(.d-md-block):not(.d-lg-block):not(.d-sm-block)"):
        t.decompose()
    for t in root.find_all("i"):
        cls = " ".join(t.get("class", []))
        if re.search(r"\b(bi|fa|fas|far|fab|flaticon|icon|las|lab)\b", cls) and not txt(t):
            t.decompose()
    # Iframes: keep only embeds with a source we can name
    for t in root.find_all("iframe"):
        src = t.get("src", "")
        if not src:
            t.decompose()
            continue
        if not t.get("title"):
            t["title"] = "Embedded map" if "map" in src else "Embedded video" if ("youtube" in src or "video" in src) else "Embedded content"
        t["loading"] = "lazy"
        wrap = new(soup, "div", ["cp-embed"])
        t.wrap(wrap)

    # div -> p where a div only holds inline content; wrap stray inline runs among blocks
    for div in reversed(root.find_all(["div", "section", "article", "span", "td", "li", "dd", "blockquote", "details", "summary"])):
        if div.name in ("div", "section", "article") and not (div.get("class") and any(KEEP_CLASS.match(c) for c in div.get("class", []))):
            kids = [k for k in div.children if not (isinstance(k, NavigableString) and not k.strip())]
            has_block = any(isinstance(k, Tag) and k.name in BLOCK_TAGS for k in kids)
            if kids and not has_block:
                if txt(div) or div.find("img"):
                    div.name = "p"
                    div.attrs = {}
                continue
            if has_block:
                run = []
                def flush():
                    if run and any((isinstance(x, NavigableString) and x.strip()) or (isinstance(x, Tag) and (txt(x) or x.name == "img")) for x in run):
                        p = soup.new_tag("p")
                        run[0].insert_before(p)
                        for x in run:
                            p.append(x.extract())
                    run.clear()
                for k in list(div.children):
                    if isinstance(k, Tag) and k.name in BLOCK_TAGS:
                        flush()
                    else:
                        run.append(k)
                flush()

    # unwrap containers
    for t in reversed(root.find_all(True)):
        if t is root:
            continue
        cls = t.get("class", []) or []
        keep_cls = [c for c in cls if KEEP_CLASS.match(c)]
        if t.name in UNWRAP_TAGS and not keep_cls:
            t.unwrap()
            continue
        if t.name == "h1":
            t.name = "h2"
        # attributes
        allowed = ATTRS.get(t.name, {"class"} if keep_cls else set())
        for a in list(t.attrs):
            if a not in allowed:
                del t[a]
        if keep_cls:
            t["class"] = keep_cls
        elif "class" in t.attrs and t.name not in ("a",):
            del t["class"]
        elif t.name == "a" and "class" in t.attrs:
            del t["class"]

    # group loose link tiles into lists
    for li in root.select("li.cp-tile"):
        if li.parent is not None and li.parent.name in ("ul", "ol"):
            continue
        ul = new(soup, "ul", ["cp-tiles"])
        li.insert_before(ul)
        sib = ul.next_sibling
        while sib is not None:
            nxt = sib.next_sibling
            if isinstance(sib, Tag) and sib.name == "li" and "cp-tile" in sib.get("class", []):
                ul.append(sib.extract())
            elif isinstance(sib, NavigableString) and not sib.strip():
                sib.extract()
            else:
                break
            sib = nxt
    # links
    for a in root.find_all("a"):
        newh, kind = rewrite_href(a.get("href"), base)
        if newh is None:
            if txt(a) or a.find("img"):
                a.unwrap()
            else:
                a.decompose()
            continue
        a["href"] = newh
        for k in ("target", "rel"):
            if k in a.attrs:
                del a[k]
        if kind == "external":
            a["class"] = ["outside-link"]
            a["target"] = "_blank"
            a["rel"] = "noopener"
        elif kind == "doc" and newh.rsplit(".", 1)[-1].lower() in IMG_EXT:
            a["href"] = media_src(newh)
            a["target"] = "_blank"
            a["rel"] = "noopener"
            if not a.find("img"):
                a["data-meta"] = "image"
                a["class"] = ["cp-doc"]
        elif kind == "doc":
            m = doc_meta(newh)
            a["target"] = "_blank"
            a["rel"] = "noopener"
            if m:
                a["data-meta"] = m[1]
                a["class"] = ["cp-doc", "cp-doc-" + m[0]]
        elif kind == "official":
            a["class"] = ["cp-off"]
        if not txt(a) and not a.find("img"):
            label = a.get("title") or newh.rsplit("/", 1)[-1] or newh
            a.string = unquote(label)
    # images
    for img in root.find_all("img"):
        src = unesc(img.get("src", ""))
        if not src or src.startswith("data:"):
            img.decompose()
            continue
        absu = urljoin(base, src)
        p = urlsplit(absu)
        if is_official_host(p.netloc):
            absu = urlunsplit(("https", HOST, quote(unquote(p.path), safe="/~-_.()!*'@:+,;=&$"), p.query, ""))
        img["src"] = media_src(absu)
        if "alt" not in img.attrs:
            img["alt"] = ""
        img["loading"] = "lazy"
        img["decoding"] = "async"
        for k in ("width", "height"):
            if k in img.attrs and not re.fullmatch(r"\d+", str(img[k])):
                del img[k]
    # tables
    for tb in root.find_all("table"):
        if not tb.find("th"):
            first = tb.find("tr")
            if first and len(tb.find_all("tr")) > 1:
                for td in first.find_all("td", recursive=False):
                    td.name = "th"
                    td["scope"] = "col"
        for th in tb.find_all("th"):
            if "scope" not in th.attrs:
                th["scope"] = "col" if th.parent and th.parent.parent and th.parent.parent.name == "thead" or (th.parent and th.parent.find("td") is None) else "row"
        if not tb.find("thead"):
            first = tb.find("tr")
            if first and first.find("th") and not first.find("td"):
                thead = soup.new_tag("thead")
                first.insert_before(thead)
                thead.append(first.extract())
        if not (tb.parent and "cp-table" in (tb.parent.get("class") or [])):
            wrap = new(soup, "div", ["cp-table"])
            wrap["role"] = "region"
            wrap["tabindex"] = "0"
            prev = tb.find_previous(re.compile(r"^h[2-6]$"))
            wrap["aria-label"] = (txt(tb.find("caption")) or (txt(prev) if prev else "") or "Table")[:120]
            tb.wrap(wrap)
    # empty elements
    for t in reversed(root.find_all(["p", "li", "h2", "h3", "h4", "h5", "h6", "strong", "b", "em", "span", "ul", "ol", "summary", "dd", "dt", "blockquote"])):
        if not txt(t) and not t.find(["img", "iframe", "table", "a"]):
            t.decompose()
    for t in root.find_all(["details"]):
        if not txt(t):
            t.decompose()
    # runs of pictures (photo albums, event pages) -> gallery grid
    def lone_img(t):
        if not isinstance(t, Tag) or t.name != "p":
            return None
        kids = [k for k in t.children if not (isinstance(k, NavigableString) and not k.strip())]
        if len(kids) == 1 and isinstance(kids[0], Tag):
            k = kids[0]
            if k.name == "img":
                return k
            if k.name == "a" and len(k.find_all("img")) == 1 and not txt(k):
                return k
        return None
    for p in list(root.find_all("p")):
        if p.parent is None or not lone_img(p):
            continue
        prev = p.find_previous_sibling()
        if prev is not None and lone_img(prev):
            continue  # not the start of a run
        run = [p]
        sib = p.find_next_sibling()
        while sib is not None and lone_img(sib):
            run.append(sib)
            sib = sib.find_next_sibling()
        if len(run) >= 3:
            ul = new(soup, "ul", ["cp-gallery"])
            run[0].insert_before(ul)
            for q in run:
                li = new(soup, "li")
                li.append(lone_img(q).extract())
                q.decompose()
                ul.append(li)
    # collapse runs of <br>
    for br in root.find_all("br"):
        n = br.next_sibling
        while isinstance(n, NavigableString) and not n.strip():
            n = n.next_sibling
        if isinstance(n, Tag) and n.name == "br":
            br.decompose()
    for p in root.find_all("p"):
        while p.contents and isinstance(p.contents[0], Tag) and p.contents[0].name == "br":
            p.contents[0].decompose()
        while p.contents and isinstance(p.contents[-1], Tag) and p.contents[-1].name == "br":
            p.contents[-1].decompose()


def to_html(root):
    s = "".join(str(c) for c in root.contents)
    s = re.sub(r"\n\s*\n+", "\n", s)
    s = s.replace("\xa0", " ")
    return s.strip()


# ----------------------------------------------------------------------------------------------
# Sub-sites (departments, centres) have their own menu in the official header
# ----------------------------------------------------------------------------------------------
subsite_names = {}
for g in menu_groups:
    for t, h in g[2]:
        if h and h.startswith("/"):
            seg = h.strip("/").split("/")[0]
            if seg and seg.lower() not in ("academic", "institute", "student", "facultystaff", "research", "resources", "career", "aiir"):
                subsite_names.setdefault(seg.lower(), t)


_sub_name_cache = {}


def sub_name_for(code):
    """Department / centre name: the main menu's label, else the caption on its home page, else its code."""
    lc = code.lower()
    if lc in subsite_names:
        return subsite_names[lc]
    if lc in _sub_name_cache:
        return _sub_name_cache[lc]
    name = None
    home = plain.get("/" + lc)
    if home:
        sp = BeautifulSoup(open(os.path.join(CACHE, "pages", home["file"]), encoding="utf-8", errors="ignore").read(), "lxml")
        cap = sp.select_one(".carousel-caption h2, .carousel-caption h1, .inside-title h1")
        if cap and txt(cap):
            name = txt(cap)
        if not name:
            t = txt(sp.title)
            t = re.sub(r"^NIT Rourkela\s*[-|:]?\s*", "", t).strip()
            if t and t.upper() != code.upper():
                name = t
    name = DEPT_NAMES.get(lc) or name or code.upper()
    _sub_name_cache[lc] = name
    return name


DEPT_NAMES = {
    "bm": "Biotechnology and Medical Engineering", "ce": "Civil Engineering", "ch": "Chemical Engineering",
    "cr": "Ceramic Engineering", "cs": "Computer Science and Engineering", "cy": "Chemistry",
    "ec": "Electronics and Communication Engineering", "ee": "Electrical Engineering", "er": "Earth and Atmospheric Sciences",
    "fp": "Food Process Engineering", "hs": "Humanities and Social Sciences", "id": "Industrial Design",
    "ls": "Life Science", "ma": "Mathematics", "me": "Mechanical Engineering", "mm": "Metallurgical and Materials Engineering",
    "mn": "Mining Engineering", "pa": "Planning and Architecture", "ph": "Physics", "sm": "School of Management",
    "em": "Electronics and Instrumentation Engineering", "dr": "Dean (Research)", "es": "Energy Science",
}


def parse_subsite_menu(soup):
    h = soup.find("header")
    if not h or h.select_one("#tmenu-institute"):
        return None
    menu = h.select_one("ul.nav-menu")
    if not menu:
        return None
    groups = []
    for li in menu.find_all("li", recursive=False):
        a = li.find("a", recursive=False)
        sub = li.find("ul", recursive=False)
        if sub:
            links = [(txt(x), x.get("href")) for x in sub.select("a")]
            groups.append((txt(a) if a else "", links))
        elif a and txt(a):
            groups.append(("", [(txt(a), a.get("href"))]))
    return groups


# ----------------------------------------------------------------------------------------------
# Page extraction
# ----------------------------------------------------------------------------------------------
SECTION_HERO = {
    "institute": "gallery1-hd.webp", "academic": "gallery2-hd.webp", "student": "gallery3-hd.webp",
    "facultystaff": "gallery4-hd.webp", "research": "gallery5-hd.webp", "home": "gallery6-hd.webp",
    "cdc": "gallery7-hd.webp", "career": "gallery8-hd.webp", "purchasesection": "gallery9-hd.webp",
}
HERO_POOL = [f"gallery{i}-hd.webp" for i in range(1, 10)]


def hero_for(pk):
    seg = pk.strip("/").split("/")[0] if pk != "/" else "home"
    f = SECTION_HERO.get(seg) or HERO_POOL[int(hashlib.md5(seg.encode()).hexdigest(), 16) % len(HERO_POOL)]
    return "/assets/images/" + f


def extract(url, file):
    raw = open(os.path.join(CACHE, "pages", file), encoding="utf-8", errors="ignore").read()
    soup = BeautifulSoup(raw, "lxml")
    base = url
    title_tag = txt(soup.title)
    meta_desc = soup.find("meta", attrs={"name": "description"})
    meta_desc = (meta_desc.get("content") or "").strip() if meta_desc else ""

    banner = soup.select_one(".inside-banner-section")
    h1 = None
    crumbs = []
    h1_src = None
    if banner:
        h1 = txt(banner.select_one("h1"))
        h1_src = "banner" if h1 else None
        for li in banner.select(".breadcrumb li"):
            a = li.find("a")
            crumbs.append((txt(li), a.get("href") if a else None))
    subsite = parse_subsite_menu(soup)
    side_title, side_links = None, []
    right = soup.select_one(".item-right")
    if right:
        st = right.select_one("h5, h4, h3")
        side_title = txt(st).title() if st else None
        side_links = [(txt(a), a.get("href")) for a in right.select("a") if txt(a)]

    # main content
    content = soup.select_one(".item-left")
    if content is None:
        body = soup.body or soup
        for x in body.select("header, footer, .inside-banner-section, #navigation1, .top-header, .footer-area, .copyright, .scroll-top, #scrollUp, .preloader, #preloader, .nitrkl-accessibility, .gtranslate_wrapper, #google_translate_element, .modal"):
            x.decompose()
        for x in body.find_all("input", attrs={"type": "hidden"}):
            x.decompose()
        content = body
    else:
        if right:
            right.decompose()
    # drop the official site's widgets that the redesign renders itself
    for x in content.select(".right-menu, .item-right, .breadcrumb, .share-btn, .social-share, #scrollUp, .back-to-top"):
        x.decompose()
    for br in content.select("h1 br, h2 br, h3 br, h4 br, h5 br, h6 br"):
        br.replace_with(" ")
    hero_imgs = transform_patterns(soup, content, base)
    heading_remap(content)
    if not h1:
        # first heading inside content
        hh = content.find(["h1", "h2"])
        if hh and len(txt(hh)) < 120:
            h1 = txt(hh)
            h1_src = "content"
            if hh.name == "h1":
                hh.decompose()
    title_override = content.get("data-title") if isinstance(content, Tag) else None
    clean(soup, content, base)
    # drop a leading heading equal to the page title
    first = content.find(re.compile(r"^h[2-6]$"))
    if first and h1 and txt(first).lower() == h1.lower() and not first.find_previous(["p", "table", "ul"]):
        first.decompose()
    html = to_html(content)
    if title_override:
        h1 = title_override
        h1_src = "profile"
    if not h1:
        h1_src = "title"
        h1 = re.sub(r"^(NIT Rourkela\s*[-|:]?\s*)", "", title_tag).strip() or "NIT Rourkela"
    return {
        "title": h1.strip(),
        "h1_src": h1_src,
        "doc_title": title_tag,
        "desc": meta_desc,
        "crumbs": crumbs,
        "subsite": subsite,
        "side_title": side_title,
        "side": side_links,
        "html": html,
        "hero_imgs": hero_imgs,
        "text": re.sub(r"\s+", " ", BeautifulSoup(html, "lxml").get_text(" ", strip=True))[:6000],
    }


# ----------------------------------------------------------------------------------------------
# Rendering
# ----------------------------------------------------------------------------------------------
def esc(s):
    return htmlmod.escape(s or "", quote=True)


def slugify(s):
    s = re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")
    return s[:60] or "section"


def add_heading_ids(html):
    soup = BeautifulSoup(f"<div id='__r'>{html}</div>", "lxml")
    r = soup.find(id="__r")
    toc = []
    used = set()
    for h in r.find_all("h2"):
        sid = slugify(txt(h))
        base_sid, i = sid, 2
        while sid in used:
            sid = f"{base_sid}-{i}"
            i += 1
        used.add(sid)
        h["id"] = sid
        toc.append((txt(h), sid))
    return "".join(str(c) for c in r.contents), toc


def link_items(links, base, current_local):
    out = []
    seen = set()
    for t, h in links:
        if not t:
            continue
        newh, kind = rewrite_href(h, base)
        if not newh or (newh, t) in seen:
            continue
        seen.add((newh, t))
        cur = ' aria-current="page"' if newh.split("#")[0] == current_local else ""
        cls = ' class="outside-link" target="_blank" rel="noopener"' if kind == "external" else (' target="_blank" rel="noopener"' if kind == "doc" else "")
        meta = ""
        if kind == "doc":
            m = doc_meta(newh)
            if m:
                meta = f' <span class="ip-meta-file">({esc(m[1])})</span>'
        out.append(f'<li><a href="{esc(newh)}"{cur}{cls}>{esc(t)}</a>{meta}</li>')
    return out


def subsite_code(pk):
    return pk.strip("/").split("/")[0] if pk != "/" else ""


def render_page(pk, url, data, local, viewer=None):
    base = url
    code = subsite_code(pk)
    if data["subsite"] is not None and pk == "/" + code.lower():
        data = dict(data)
        data["title"] = sub_name_for(code)
    elif data["subsite"] and data.get("h1_src") in ("title", "content") and (data.get("h1_src") == "title" or len(data["title"]) > 60 or data["title"].upper() == code.upper()):
        for gl, links in data["subsite"]:
            hit = next((t for t, h in links if h and rewrite_href(h, url)[0] == local), None)
            if hit:
                data = dict(data)
                data["title"] = hit
                break
    # breadcrumbs
    crumbs = [("Home", "/")]
    sub_name = None
    if data["subsite"] is not None:
        sub_name = sub_name_for(code)
        home_local = local_of.get(plain_key("/" + code), "/" + code + "/")
        if local.rstrip("/").lower() != home_local.rstrip("/").lower():
            crumbs.append((sub_name, home_local))
    else:
        for t, h in data["crumbs"][1:-1]:
            if not t:
                continue
            nh, kind = rewrite_href(h, base) if h else (None, "none")
            crumbs.append((t, nh if kind == "local" else None))
    crumbs.append((data["title"], None))
    crumb_html = "".join(
        f'<li><a href="{esc(h)}">{esc(t)}</a></li>' if h else (f'<li aria-current="page">{esc(t)}</li>' if i == len(crumbs) - 1 else f"<li>{esc(t)}</li>")
        for i, (t, h) in enumerate(crumbs)
    )

    body, toc = add_heading_ids(data["html"])
    # side navigation
    side_blocks = []
    if data["subsite"]:
        for gl, links in data["subsite"]:
            items = link_items(links, base, local)
            if items:
                if gl:
                    side_blocks.append(f'<p class="ip-side-h">{esc(gl)}</p><ul>{"".join(items)}</ul>')
                else:
                    side_blocks.append(f'<ul>{"".join(items)}</ul>')
        side_heading = sub_name or "In this section"
    elif data["side"]:
        items = link_items(data["side"], base, local)
        side_blocks.append(f'<ul>{"".join(items)}</ul>')
        side_heading = data["side_title"] or "Related links"
        if side_heading.lower() == "related links":
            side_heading = "In this section"
    else:
        groups = menu_index.get(pk) or []
        side_heading = "In this section"
        if groups:
            g = groups[0]
            side_heading = g[1]
            items = link_items(g[2], OFFICIAL + "/", local)
            side_blocks.append(f'<ul>{"".join(items)}</ul>')
    toc_html = ""
    if len(toc) >= 3:
        toc_html = (
            '<nav class="ip-toc" aria-labelledby="ipTocH"><h2 class="ip-side-title" id="ipTocH">On this page</h2><ol>'
            + "".join(f'<li><a href="#{sid}">{esc(t)}</a></li>' for t, sid in toc[:24])
            + "</ol></nav>"
        )
    side_html = ""
    if side_blocks or toc_html:
        sec = ""
        if side_blocks:
            sec = (
                f'<details class="ip-sec" open><summary class="ip-side-title" id="ipSecH">{esc(side_heading)}</summary>'
                f'<nav aria-labelledby="ipSecH">{"".join(side_blocks)}</nav></details>'
            )
        side_html = f'<aside class="ip-side" aria-label="Section navigation">{sec}{toc_html}</aside>'

    hero = None
    if data["hero_imgs"]:
        hero = data["hero_imgs"][0][0]
    hero = hero or hero_for(pk)
    official_url = url if not viewer else url
    empty = len(re.sub(r"<[^>]+>", "", body).strip()) < 40 and "<img" not in body and "<table" not in body
    if empty and not viewer:
        body = (
            '<div class="ip-empty"><p>This page on the official website is built by a separate application, so its content '
            'is shown there rather than copied here.</p>'
            f'<p><a class="ip-btn" href="{esc(url)}">Open the page on www.nitrkl.ac.in</a></p></div>'
        )
    sub_band = ""
    if sub_name:
        sub_band = f'<p class="ip-subsite"><a href="{esc(local_of.get(plain_key("/" + code), "/" + code + "/"))}">{esc(sub_name)}</a></p>'
    desc = data.get("desc") or f"{data['title']}: National Institute of Technology Rourkela."
    viewer_attr = ""
    if viewer:
        viewer_attr = f' data-viewer="{esc(viewer)}"'
    main = f'''<main id="main" class="cp ip" tabindex="-1" data-chapter="white"{viewer_attr}>
  <div class="ip-hero" style="--ip-hero:url('{esc(hero)}')">
    <div class="ip-wrap">
      <nav class="ip-crumbs" aria-label="Breadcrumb"><ol>{crumb_html}</ol></nav>
      <h1 id="ipTitle">{esc(data["title"])}</h1>
    </div>
  </div>
  <div class="ip-wrap ip-grid{' ip-grid--solo' if not side_html else ''}">
    {side_html}
    <div class="ip-body" id="ipBody">
{body}
    </div>
  </div>
  <div class="ip-wrap ip-foot">
    <p class="ip-updated">Content from <a class="cp-off" href="{esc(official_url)}" id="ipSource">the official page</a> · Last reviewed <time datetime="{TODAY.isoformat()}">{TODAY_H}</time></p>
    <p class="ip-actions"><button type="button" class="ip-print" data-print><i class="bi bi-printer" aria-hidden="true"></i> Print this page</button></p>
  </div>
</main>'''
    doc_title = f"{data['title']} | NIT Rourkela"
    head = TPL_HEAD
    head = re.sub(r"<title>.*?</title>", f"<title>{esc(doc_title)}</title>", head, flags=re.S)
    head = re.sub(r'<meta content="[^"]*" name="description"/>', f'<meta content="{esc(desc[:300])}" name="description"/>', head)
    head += f'<link rel="canonical" href="{esc(url)}"/>\n'
    return head + TPL_TOP_R + main + TPL_BOTTOM_R


# ----------------------------------------------------------------------------------------------
# Build
# ----------------------------------------------------------------------------------------------
def write(path_local, content):
    p = os.path.join(OUT, *[x for x in path_local.strip("/").split("/") if x], "index.html")
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)


def main():
    global TPL_TOP_R, TPL_BOTTOM_R
    only = os.environ.get("ONLY")
    if not only:
        if os.path.exists(OUT):
            shutil.rmtree(OUT)
        shutil.copytree(DESIGN, OUT, ignore=shutil.ignore_patterns(".git", ".gitignore", "node_modules"))
    # extra assets of the inner pages
    here = os.path.dirname(os.path.abspath(__file__))
    shutil.copy(os.path.join(here, "vercel.json"), os.path.join(OUT, "vercel.json"))
    for f in os.listdir(os.path.join(here, "assets")):
        src = os.path.join(here, "assets", f)
        if f == "vercel.json":
            continue
        if os.path.isdir(src):
            shutil.copytree(src, os.path.join(OUT, "assets", "site", f), dirs_exist_ok=True)
        else:
            shutil.copy(src, os.path.join(OUT, "assets", "site", f))

    TPL_TOP_R = rewrite_tpl_links(TPL_TOP)
    TPL_BOTTOM_R = rewrite_tpl_links(TPL_BOTTOM)

    search = []
    pages_out = {}
    n = 0
    # plain pages
    for pk, rec in sorted(plain.items()):
        if pk == "/":
            continue
        if only and not re.search(only, pk, re.I):
            continue
        try:
            data = extract(rec["url"], rec["file"])
        except Exception as e:  # keep going; report
            print("FAIL", rec["url"], e)
            continue
        local = local_of[pk]
        viewer = None
        if pk in qrecs:
            viewer = slugify(pk)
        if is_syllabus_path(pk):
            viewer = "syllabus"
        write(local, render_page(pk, rec["url"], data, local, viewer))
        pages_out[local] = data["title"]
        search.append({"t": data["title"], "u": local, "s": crumb_section(data, pk), "x": data["text"][:400]})
        n += 1
        if n % 200 == 0:
            print(n, "pages", flush=True)

    if only:
        print("partial build done", n)
        return
    # parameterised records -> fragments + viewer pages
    qdir = os.path.join(OUT, "_q")
    os.makedirs(qdir, exist_ok=True)
    for pk, recs in qrecs.items():
        vslug = slugify(pk)
        manifest = {}
        os.makedirs(os.path.join(qdir, vslug), exist_ok=True)
        first_data = None
        for i, (q, rec) in enumerate(sorted(recs.items())):
            try:
                data = extract(rec["url"], rec["file"])
            except Exception as e:
                print("FAIL", rec["url"], e)
                continue
            first_data = first_data or data
            body, toc = add_heading_ids(data["html"])
            fn = f"{i}.json"
            json.dump({"t": data["title"], "b": body, "u": rec["url"]}, open(os.path.join(qdir, vslug, fn), "w", encoding="utf-8"), ensure_ascii=False)
            manifest[q] = fn
            search.append({"t": data["title"], "u": local_of[pk] + "?" + urlsplit(rec["url"]).query, "s": crumb_section(data, pk), "x": data["text"][:300]})
        json.dump(manifest, open(os.path.join(qdir, vslug + ".json"), "w", encoding="utf-8"), ensure_ascii=False)
        if pk not in plain and first_data:
            shell = dict(first_data)
            shell["html"] = '<p class="ip-loading">Loading…</p>'
            write(local_of[pk], render_page(pk, OFFICIAL + local_of[pk], shell, local_of[pk], vslug))
            pages_out[local_of[pk]] = shell["title"]
        print("viewer", pk, len(manifest), flush=True)

    # syllabi: one fragment per subject; every */Syllabus path is a viewer
    sdir = os.path.join(qdir, "syllabus")
    os.makedirs(sdir, exist_ok=True)
    stitle = None
    buckets = defaultdict(dict)
    for sid, file in syllabus.items():
        u = f"{OFFICIAL}/Academic/Syllabus/?sid={sid}"
        try:
            data = extract(u, file)
        except Exception as e:
            print("FAIL syllabus", sid, e)
            continue
        m = re.search(r"([A-Z]{2}\s?\d{3,4}[A-Z]?)\s*:\s*(.+?)\s*\{\s*([\d\-\s/.]+)\}", data["text"])
        if m:
            data["title"] = f"{m.group(1)}: {m.group(2).strip()}"
        data["html"] = re.sub(r'<a[^>]*>\s*Go Back\s*</a>', "", data["html"])
        stitle = stitle or data
        body, toc = add_heading_ids(data["html"])
        buckets[syl_bucket(sid)][sid] = {"t": data["title"], "b": body}
        search.append({"t": data["title"], "u": "/Academic/Syllabus/?sid=" + sid, "s": "Syllabus", "x": data["text"][:200]})
    for b, recs in buckets.items():
        json.dump(recs, open(os.path.join(sdir, f"b{b}.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    print("syllabi", len(syllabus), "in", len(buckets), "files", flush=True)
    for pk in sorted(syllabus_bases | {"/academic/syllabus"}):
        if pk in plain:
            continue
        local = local_of.get(pk)
        if not local:
            continue
        shell = {"title": "Syllabus", "desc": "Subject syllabus, NIT Rourkela.", "crumbs": [], "subsite": None, "side_title": None, "side": [],
                 "html": '<p class="ip-loading">Loading the syllabus…</p>', "hero_imgs": [], "text": ""}
        code = subsite_code(pk)
        if code.lower() != "academic":
            dept_home = plain.get(plain_key("/" + code))
            if dept_home:
                try:
                    dd = extract(dept_home["url"], dept_home["file"])
                    shell["subsite"] = dd["subsite"]
                except Exception:
                    pass
        write(local, render_page(pk, OFFICIAL + local, shell, local, "syllabus"))

    # search index, sitemap, 404, home page links
    json.dump(search, open(os.path.join(OUT, "_q", "search.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    build_special_pages(pages_out)
    patch_home()
    json.dump(sorted(doc_links), open(os.path.join(CACHE, "doclinks.json"), "w"))
    json.dump(sorted(img_links), open(os.path.join(CACHE, "imglinks.json"), "w"))
    if os.path.isdir(MEDIA):
        shutil.copytree(MEDIA, os.path.join(OUT, "media"), dirs_exist_ok=True)
    print("done", n, "pages;", len(doc_links), "document links")


def syl_bucket(sid):
    return int(sid) % 256 if str(sid).isdigit() else int(hashlib.md5(str(sid).encode()).hexdigest(), 16) % 256


def crumb_section(data, pk):
    if data.get("subsite") is not None:
        return sub_name_for(subsite_code(pk))
    cr = [t for t, h in data.get("crumbs", [])[1:-1] if t]
    return " / ".join(cr[:2])


def simple_page(local, title, body_html, desc, side=None):
    data = {"title": title, "desc": desc, "crumbs": [], "subsite": None, "side_title": None, "side": side or [],
            "html": body_html, "hero_imgs": [], "text": ""}
    write(local, render_page(plain_key(local), OFFICIAL + local, data, local))


def build_special_pages(pages_out):
    # Search
    simple_page(
        "/Search/", "Search",
        '<form class="ip-search" action="/Search/" method="get" role="search">'
        '<label for="ipq">Search pages, people and documents</label>'
        '<div class="ip-search-row"><input id="ipq" name="q" type="search" autocomplete="off" maxlength="200"/>'
        '<button type="submit">Search</button></div></form>'
        '<p class="ip-search-status" id="ipSearchStatus" role="status" aria-live="polite"></p>'
        '<ol class="ip-results" id="ipResults"></ol>',
        "Search the National Institute of Technology Rourkela website.",
    )
    # Sitemap (GIGW): every page grouped by its first path segment
    groups = defaultdict(list)
    for local, title in pages_out.items():
        seg = local.strip("/").split("/")[0]
        groups[seg].append((title, local))
    nice = {g[2][0][1].strip("/").split("/")[0].lower(): g[1] for g in menu_groups if g[2] and g[2][0][1] and g[2][0][1].startswith("/")}
    parts = []
    for seg in sorted(groups, key=lambda s: s.lower()):
        name = subsite_names.get(seg.lower()) or {"institute": "Institute", "academic": "Academics", "student": "Students", "facultystaff": "Faculty and Staff", "research": "Research", "home": "News and Highlights"}.get(seg.lower()) or seg
        items = sorted(groups[seg], key=lambda x: (x[1].count("/"), x[0].lower()))
        parts.append(f'<h2>{esc(name)}</h2><ul class="ip-cols">' + "".join(f'<li><a href="{esc(l)}">{esc(t)}</a></li>' for t, l in items) + "</ul>")
    simple_page("/Sitemap/", "Sitemap", f"<p>All {len(pages_out)} pages of the website, grouped by section.</p>" + "".join(parts),
                "Every page of the National Institute of Technology Rourkela website.")
    # 404 with case-insensitive lookup
    lower_map = {}
    for local in pages_out:
        lower_map[local.lower()] = local
    json.dump(lower_map, open(os.path.join(OUT, "_q", "paths.json"), "w", encoding="utf-8"), separators=(",", ":"))
    data = {"title": "Page not found", "desc": "", "crumbs": [], "subsite": None, "side_title": None, "side": [],
            "html": '<p class="cp-lede" id="ip404">We could not find that page. It may have moved.</p>'
                    '<p>Try the <a href="/Search/">search</a>, the <a href="/Sitemap/">sitemap</a> or the <a href="/">home page</a>.</p>',
            "hero_imgs": [], "text": ""}
    html = render_page("/404", OFFICIAL + "/", data, "/404/")
    html = html.replace('<main id="main" class="cp ip"', '<main id="main" class="cp ip" data-notfound')
    open(os.path.join(OUT, "404.html"), "w", encoding="utf-8").write(html)


def patch_home():
    p = os.path.join(OUT, "index.html")
    s = open(p, encoding="utf-8").read()

    def rep(m):
        href = m.group(1)
        hu = unesc(href)
        if hu.startswith("/") and not hu.startswith(("/assets/", "/docs/")) or re.match(r"https?://(www\.)?nitrkl\.ac\.in/", hu, re.I):
            new, kind = rewrite_href(hu, OFFICIAL + "/")
            if new and kind in ("local", "official"):
                return f'href="{esc(new)}"'
        return m.group(0)
    s = re.sub(r'href="([^"]*)"', rep, s)
    # the search box goes to the site search
    s = s.replace('action="/Search"', 'action="/Search/"')
    open(p, "w", encoding="utf-8").write(s)
    # screen reader page: also route its menu links
    p2 = os.path.join(OUT, "screen-reader-access.html")
    s2 = open(p2, encoding="utf-8").read()
    s2 = re.sub(r'href="([^"]*)"', rep, s2).replace('action="/Search"', 'action="/Search/"')
    open(p2, "w", encoding="utf-8").write(s2)


if __name__ == "__main__":
    main()
