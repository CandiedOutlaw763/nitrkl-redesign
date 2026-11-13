/* NIT Rourkela: inner pages. Section menu, "On this page" tracking, print, the record viewer that keeps
   the official site's query-string addresses working (syllabi, seminars, galleries, publications),
   the site search and the not-found page's case-insensitive recovery. No dependencies. */
(function () {
  'use strict';
  var doc = document;
  var main = doc.querySelector('main.ip');
  if (!main) return;

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---------- Section menu: open beside the text on wide screens, folded above it on narrow ones ---------- */
  var sec = main.querySelector('.ip-sec');
  var wide = window.matchMedia('(min-width: 992px)');
  function syncSec() {
    if (!sec) return;
    if (wide.matches) sec.open = true;
    else if (!sec.dataset.touched) sec.open = false;
  }
  if (sec) {
    sec.querySelector('summary').addEventListener('click', function (e) {
      if (wide.matches) e.preventDefault(); // always open beside the text
      else sec.dataset.touched = '1';
    });
    syncSec();
    if (wide.addEventListener) wide.addEventListener('change', syncSec);
  }
  // keep the current page visible in a long section menu
  var cur = main.querySelector('.ip-sec a[aria-current="page"]');
  var side = main.querySelector('.ip-side');
  if (cur && side && wide.matches) {
    var top = cur.offsetTop - side.clientHeight / 3;
    if (top > 0) side.scrollTop = top;
  }

  /* ---------- On this page: highlight the section being read ---------- */
  function trackToc() {
    var links = [].slice.call(main.querySelectorAll('.ip-toc a'));
    if (!links.length || !('IntersectionObserver' in window)) return;
    var map = {};
    links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var visible = {};
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { visible[en.target.id] = en.isIntersecting; });
      var heads = [].slice.call(main.querySelectorAll('.ip-body h2[id]'));
      var active = null;
      for (var i = 0; i < heads.length; i++) {
        if (heads[i].getBoundingClientRect().top < window.innerHeight * 0.35) active = heads[i].id;
      }
      links.forEach(function (a) { a.classList.remove('is-active'); a.removeAttribute('aria-current'); });
      if (active && map[active]) { map[active].classList.add('is-active'); map[active].setAttribute('aria-current', 'location'); }
    }, { rootMargin: '0px 0px -60% 0px' });
    [].forEach.call(main.querySelectorAll('.ip-body h2[id]'), function (h) { io.observe(h); });
  }
  trackToc();

  /* ---------- Long directories of people get a filter box ---------- */
  function addFilters(scope) {
    [].forEach.call(scope.querySelectorAll('.cp-people'), function (grid, i) {
      var cards = grid.querySelectorAll('.cp-person');
      if (cards.length < 12 || grid.previousElementSibling && grid.previousElementSibling.classList.contains('ip-filter')) return;
      var id = 'ipFilter' + i;
      var box = doc.createElement('div');
      box.className = 'ip-filter';
      box.innerHTML = '<label for="' + id + '">Find a person</label><input id="' + id + '" type="search" autocomplete="off" placeholder="Name, designation or area"/><output for="' + id + '" aria-live="polite"></output>';
      grid.parentNode.insertBefore(box, grid);
      var input = box.querySelector('input'), out = box.querySelector('output');
      input.addEventListener('input', function () {
        var q = input.value.trim().toLowerCase(), shown = 0;
        [].forEach.call(cards, function (c) {
          var hit = !q || c.textContent.toLowerCase().indexOf(q) > -1;
          c.hidden = !hit;
          if (hit) shown++;
        });
        out.textContent = q ? shown + ' of ' + cards.length + ' shown' : '';
      });
    });
  }
  addFilters(main);

  /* ---------- Print ---------- */
  [].forEach.call(doc.querySelectorAll('[data-print]'), function (b) {
    b.addEventListener('click', function () { window.print(); });
  });

  /* ---------- Record viewer: /Path/?query keeps the official address ---------- */
  function normQuery(search) {
    var pairs = [];
    new URLSearchParams(search).forEach(function (v, k) { pairs.push([k.replace(/amp;/g, '').toLowerCase(), v]); });
    pairs.sort(function (a, b) { return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : (a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0); });
    return pairs.map(function (p) { return p[0] + '=' + p[1]; }).join('&');
  }
  function showRecord(rec, officialUrl) {
    var body = doc.getElementById('ipBody');
    var h1 = doc.getElementById('ipTitle');
    body.innerHTML = rec.b || '<p>This record has no content.</p>';
    h1.textContent = rec.t;
    doc.title = rec.t + ' | NIT Rourkela';
    var last = main.querySelector('.ip-crumbs li:last-child');
    if (last) last.textContent = rec.t;
    var src = doc.getElementById('ipSource');
    if (src && officialUrl) src.href = officialUrl;
    var toc = main.querySelector('.ip-toc');
    if (toc) toc.remove();
    addFilters(body);
  }
  function recordMissing(officialUrl) {
    doc.getElementById('ipBody').innerHTML =
      '<div class="ip-empty"><p>This record is not part of the redesigned website yet.</p>' +
      '<p><a class="ip-btn" href="' + esc(officialUrl) + '">Open it on www.nitrkl.ac.in</a></p></div>';
  }
  var viewer = main.getAttribute('data-viewer');
  if (viewer && location.search.length > 1) {
    var official = 'https://www.nitrkl.ac.in' + location.pathname + location.search;
    var body = doc.getElementById('ipBody');
    body.setAttribute('aria-busy', 'true');
    body.innerHTML = '<p class="ip-loading">Loading…</p>';
    var done = function () { body.removeAttribute('aria-busy'); };
    if (viewer === 'syllabus') {
      var sid = new URLSearchParams(location.search.replace(/amp;/g, '')).get('sid');
      var bucket = /^\d+$/.test(sid || '') ? parseInt(sid, 10) % 256 : -1;
      fetch('/_q/syllabus/b' + bucket + '.json')
        .then(function (r) { if (!r.ok) throw 0; return r.json(); })
        .then(function (all) { var rec = all[sid]; if (!rec) throw 0; showRecord(rec, official); })
        .catch(function () { recordMissing(official); })
        .then(done);
    } else {
      fetch('/_q/' + viewer + '.json')
        .then(function (r) { return r.json(); })
        .then(function (manifest) {
          var f = manifest[normQuery(location.search)];
          if (!f) throw 0;
          return fetch('/_q/' + viewer + '/' + f).then(function (r) { return r.json(); });
        })
        .then(function (rec) { showRecord(rec, official); })
        .catch(function () { recordMissing(official); })
        .then(done);
    }
  }

  /* ---------- Site search ---------- */
  var form = doc.querySelector('form.ip-search');
  if (form) {
    var input = form.querySelector('input');
    var list = doc.getElementById('ipResults');
    var status = doc.getElementById('ipSearchStatus');
    var q = new URLSearchParams(location.search).get('q') || '';
    input.value = q;
    var data = null;
    var load = function () {
      return data ? Promise.resolve(data) : fetch('/_q/search.json').then(function (r) { return r.json(); }).then(function (d) {
        data = d.map(function (p) { p.lt = p.t.toLowerCase(); p.lx = (p.x || '').toLowerCase(); p.ls = (p.s || '').toLowerCase(); return p; });
        return data;
      });
    };
    var highlight = function (text, terms) {
      var out = esc(text);
      terms.forEach(function (t) {
        if (t.length < 2) return;
        out = out.replace(new RegExp('(' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'), '<mark>$1</mark>');
      });
      return out;
    };
    var run = function (query) {
      query = query.trim();
      if (!query) { status.textContent = 'Type a word or two, for example "hostel", "curriculum" or a person\'s name.'; list.innerHTML = ''; return; }
      status.textContent = 'Searching…';
      load().then(function (pages) {
        var terms = query.toLowerCase().split(/\s+/).filter(Boolean);
        var scored = [];
        pages.forEach(function (p) {
          var s = 0;
          for (var i = 0; i < terms.length; i++) {
            var t = terms[i], hit = 0;
            if (p.lt.indexOf(t) > -1) hit += p.lt === t ? 40 : (p.lt.indexOf(t) === 0 ? 20 : 12);
            if (p.ls.indexOf(t) > -1) hit += 4;
            if (p.lx.indexOf(t) > -1) hit += 3;
            if (!hit) { s = 0; break; }
            s += hit;
          }
          if (s) scored.push([s, p]);
        });
        scored.sort(function (a, b) { return b[0] - a[0] || a[1].t.length - b[1].t.length; });
        var top = scored.slice(0, 60);
        status.textContent = scored.length ? (scored.length + (scored.length === 1 ? ' result' : ' results') + ' for "' + query + '"' + (scored.length > 60 ? ', showing the best 60' : '')) : 'No pages match "' + query + '". Check the spelling, or try fewer words.';
        list.innerHTML = top.map(function (r) {
          var p = r[1];
          var x = p.x || '';
          var at = x.toLowerCase().indexOf(terms[0]);
          var snip = at > 60 ? '…' + x.slice(at - 50, at + 170) + '…' : x.slice(0, 220) + (x.length > 220 ? '…' : '');
          return '<li><a href="' + esc(p.u) + '">' + highlight(p.t, terms) + '</a>' + (p.s ? '<span class="ip-r-sec">' + esc(p.s) + '</span>' : '') + (snip ? '<p>' + highlight(snip, terms) + '</p>' : '') + '</li>';
        }).join('');
      }).catch(function () { status.textContent = 'Search is unavailable right now. Try the sitemap instead.'; });
    };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = input.value;
      history.replaceState(null, '', '/Search/?q=' + encodeURIComponent(v));
      run(v);
    });
    run(q);
  }

  /* ---------- Not found: the official site ignores letter case, so try the page in its stored case ---------- */
  if (main.hasAttribute('data-notfound')) {
    var path = decodeURIComponent(location.pathname);
    if (!/\/$/.test(path)) path += '/';
    fetch('/_q/paths.json').then(function (r) { return r.json(); }).then(function (m) {
      var hit = m[path.toLowerCase()];
      if (hit && hit !== location.pathname) location.replace(hit + location.search + location.hash);
      else {
        var p = doc.getElementById('ip404');
        if (p) p.insertAdjacentHTML('afterend', '<p>The page may still be on the current website: <a class="cp-off" href="https://www.nitrkl.ac.in' + esc(location.pathname + location.search) + '">www.nitrkl.ac.in' + esc(location.pathname) + '</a></p>');
      }
    });
  }
})();
