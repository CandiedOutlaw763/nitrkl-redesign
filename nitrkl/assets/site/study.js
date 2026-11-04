/* NIT Rourkela homepage: Study@NITR (see study.css). The programme list drives the reading stage;
   the Postgraduate pane shows one programme at a time.
   Ported from the component library (nitrkl-components/components/16-study/study.js). The helpers it
   took from core/core.js (window.NITR: $, $$ and the tab list) are defined here. Replaces
   assets/js/study-at-nitr.js. */
(function () {
  'use strict';

  var doc = document;
  var $ = function (sel, ctx) { return (ctx || doc).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); };

  // core.js tablist(): arrow keys, Home and End; each tab shows the panel it controls
  function tablist(list) {
    if (!list) return;
    var tabs = $$('[role="tab"]', list);
    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        var panel = doc.getElementById(t.getAttribute('aria-controls'));
        if (!panel) return;
        panel.hidden = !on;
        panel.classList.toggle('is-active', on);
      });
      if (focus) tab.focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { if (!t.classList.contains('is-active')) select(t); });
      t.addEventListener('keydown', function (e) {
        var k = e.key, n = null;
        if (k === 'ArrowRight' || k === 'ArrowDown') n = tabs[(i + 1) % tabs.length];
        if (k === 'ArrowLeft' || k === 'ArrowUp') n = tabs[(i - 1 + tabs.length) % tabs.length];
        if (k === 'Home') n = tabs[0];
        if (k === 'End') n = tabs[tabs.length - 1];
        if (n) { e.preventDefault(); select(n, true); }
      });
    });
  }

  /* ---------------------------------------------------------------
     Study @ NITR: the programme list drives the reading stage
     --------------------------------------------------------------- */
  (function study() {
    var items = $$('.san-nav-item'), panes = $$('.san-pane');
    if (!items.length) return;
    var hoverTimer = null, current = 0;
    function select(i, focus) {
      current = i;
      items.forEach(function (it, k) {
        var on = k === i;
        it.classList.toggle('active', on);
        it.setAttribute('aria-selected', String(on));
        it.tabIndex = on ? 0 : -1;
      });
      panes.forEach(function (p, k) {
        var on = k === i;
        p.classList.toggle('active', on);
        p.setAttribute('aria-hidden', String(!on));
        // out of the tab order at once, not only when its 0.5s fade ends (WCAG 2.4.3)
        p.inert = !on;
        if (on) { var card = $('.san-content-card', p); if (card) card.scrollTop = 0; }
      });
      if (focus) items[i].focus();
    }
    items.forEach(function (it, i) {
      it.addEventListener('mouseenter', function () {
        if (!window.matchMedia('(hover: hover)').matches) return;
        clearTimeout(hoverTimer);
        hoverTimer = setTimeout(function () { select(i); }, 60);
      });
      it.addEventListener('mouseleave', function () { clearTimeout(hoverTimer); });
      it.addEventListener('click', function () { clearTimeout(hoverTimer); select(i); });
      it.addEventListener('keydown', function (e) {
        var k = e.key, n = null;
        if (k === 'Enter' || k === ' ') { e.preventDefault(); select(i); return; }
        if (k === 'ArrowDown' || k === 'ArrowRight') n = (current + 1) % items.length;
        if (k === 'ArrowUp' || k === 'ArrowLeft') n = (current - 1 + items.length) % items.length;
        if (k === 'Home') n = 0;
        if (k === 'End') n = items.length - 1;
        if (n !== null) { e.preventDefault(); select(n, true); }
      });
    });
    select(0);

    // A pane that covers several programmes (Postgraduate) shows one programme at a time, chosen
    // from a row of buttons, so its text fits the reading panel without scrolling. Built from the
    // pane's own headings; without script the pane shows all of them as before.
    $$('.san-content-card').forEach(function (card, n) {
      var subs = $$('.san-content-subtitle', card);
      if (subs.length < 3) return;
      var title = $('.san-content-title', card);
      var bar = doc.createElement('div');
      bar.className = 'san-subtabs';
      bar.setAttribute('role', 'tablist');
      bar.setAttribute('aria-label', (title ? title.textContent : 'Programme') + ' programmes');
      subs.forEach(function (h, i) {
        var panel = doc.createElement('div');
        panel.className = 'san-subpanel' + (i ? '' : ' is-active');
        panel.id = 'san-sub-' + n + '-' + i;
        panel.setAttribute('role', 'tabpanel');
        panel.hidden = i > 0;
        h.parentNode.insertBefore(panel, h);
        for (var el = h; el && (el === h || !el.classList.contains('san-content-subtitle')) && !el.classList.contains('san-pane-footer');) {
          var next = el.nextElementSibling; panel.appendChild(el); el = next;
        }
        var b = doc.createElement('button');
        b.type = 'button'; b.setAttribute('role', 'tab');
        b.id = panel.id + '-tab'; b.setAttribute('aria-controls', panel.id);
        b.setAttribute('aria-selected', String(!i)); b.tabIndex = i ? -1 : 0;
        if (!i) b.classList.add('is-active');
        b.textContent = h.textContent.trim();
        panel.setAttribute('aria-labelledby', b.id);
        bar.appendChild(b);
      });
      if (title) title.after(bar); else card.prepend(bar);
      tablist(bar);
    });
  })();
})();
