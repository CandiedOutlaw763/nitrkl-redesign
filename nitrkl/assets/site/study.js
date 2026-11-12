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
    var section = items[0].closest('.study-at-nitr-section');
    var list = items[0].parentNode, wrapper = panes[0].parentNode;

    /* Phones and tablets (below 1101px, where the list and the stage stack): an accordion. Each
       programme's pane moves into the list right under its name, opens when the name is tapped and
       closes on a second tap; one is open at a time and the stage panel is hidden (study.css). The
       list stops being a tab list then: each name is a button that expands its pane. */
    var mq = window.matchMedia('(max-width: 1100px)');
    var acc = false, slots = [], listAttrs = {};
    function setAcc(on) {
      if (on === acc) return;
      acc = on;
      section.classList.toggle('san--acc', on);
      if (on) {
        // a plain container of buttons and their panes: no list or tab-list semantics left over
        listAttrs = { label: list.getAttribute('aria-label'), orient: list.getAttribute('aria-orientation') };
        list.setAttribute('role', 'none');
        list.removeAttribute('aria-label');
        list.removeAttribute('aria-orientation');
        items.forEach(function (it, k) {
          var slot = doc.createElement('li');
          slot.className = 'san-acc-slot';
          slot.setAttribute('role', 'none');
          it.after(slot);
          slot.appendChild(panes[k]);
          slots[k] = slot;
          it.setAttribute('role', 'button');
          it.removeAttribute('aria-selected');
          it.tabIndex = 0;
          panes[k].removeAttribute('role');
          panes[k].setAttribute('role', 'region');
          panes[k].setAttribute('aria-label', it.textContent.replace('→', '').trim());
        });
        toggle(-1);
      } else {
        list.setAttribute('role', 'tablist');
        if (listAttrs.label) list.setAttribute('aria-label', listAttrs.label);
        if (listAttrs.orient) list.setAttribute('aria-orientation', listAttrs.orient);
        items.forEach(function (it, k) {
          wrapper.appendChild(panes[k]);
          if (slots[k]) slots[k].remove();
          it.setAttribute('role', 'tab');
          it.removeAttribute('aria-expanded');
          panes[k].setAttribute('role', 'tabpanel');
          panes[k].hidden = false;
        });
        slots = [];
        select(current >= 0 ? current : 0);
      }
    }
    // Accordion: open item i (closing any other), or close it if it is already open; -1 closes all.
    // The pane's height slides open or shut (none under prefers-reduced-motion).
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var EASE = 'cubic-bezier(.16, 1, .3, 1)';
    function slide(pane, on, animate) {
      if (pane._slide) { pane._slide.cancel(); pane._slide = null; }
      if (!animate || reduced || !pane.animate) {
        pane.hidden = !on;
        pane.classList.toggle('active', on);
        return;
      }
      if (on) {
        pane.hidden = false;
        pane.classList.add('active');
        var h = pane.scrollHeight;
        pane._slide = pane.animate(
          [{ height: '0px', opacity: 0 }, { height: h + 'px', opacity: 1 }],
          { duration: 420, easing: EASE }
        );
        pane._slide.onfinish = function () { pane._slide = null; };
      } else {
        if (pane.hidden) return;
        pane._slide = pane.animate(
          [{ height: pane.offsetHeight + 'px', opacity: 1 }, { height: '0px', opacity: 0 }],
          { duration: 300, easing: EASE }
        );
        pane._slide.onfinish = function () {
          pane._slide = null;
          pane.hidden = true;
          pane.classList.remove('active');
        };
      }
    }
    function toggle(i, animate) {
      var open = i >= 0 && !items[i].classList.contains('active') ? i : -1;
      current = open;
      items.forEach(function (it, k) {
        var on = k === open;
        it.classList.toggle('active', on);
        it.setAttribute('aria-expanded', String(on));
        panes[k].inert = false;
        panes[k].removeAttribute('aria-hidden');
        slide(panes[k], on, animate);
      });
    }

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
        if (acc || !window.matchMedia('(hover: hover)').matches) return;
        clearTimeout(hoverTimer);
        hoverTimer = setTimeout(function () { select(i); }, 60);
      });
      it.addEventListener('mouseleave', function () { clearTimeout(hoverTimer); });
      it.addEventListener('click', function () {
        clearTimeout(hoverTimer);
        if (acc) toggle(i, true); else select(i);
      });
      it.addEventListener('keydown', function (e) {
        var k = e.key, n = null;
        if (k === 'Enter' || k === ' ') { e.preventDefault(); if (acc) toggle(i, true); else select(i); return; }
        if (acc) return;   // accordion: Tab moves between the names, as between any buttons
        if (k === 'ArrowDown' || k === 'ArrowRight') n = (current + 1) % items.length;
        if (k === 'ArrowUp' || k === 'ArrowLeft') n = (current - 1 + items.length) % items.length;
        if (k === 'Home') n = 0;
        if (k === 'End') n = items.length - 1;
        if (n !== null) { e.preventDefault(); select(n, true); }
      });
    });
    select(0);
    setAcc(mq.matches);
    if (mq.addEventListener) mq.addEventListener('change', function () { setAcc(mq.matches); });
    else if (mq.addListener) mq.addListener(function () { setAcc(mq.matches); });

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
