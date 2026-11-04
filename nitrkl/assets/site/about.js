/* NIT Rourkela homepage: About the Institute (see about.css). Below 992px the Vision, the Mission
   and the Director's message share one slot and three tabs pick which shows, so the section fits one
   phone screen. WAI-ARIA tabs: arrow keys, Home and End move between tabs. On desktop, and without
   this script, all three show together and the tabs stay hidden. */
(function () {
  'use strict';

  var section = document.getElementById('about-nitr');
  if (!section) return;
  var tablist = section.querySelector('.ab-tabs');
  if (!tablist) return;
  var tabs = Array.prototype.slice.call(tablist.querySelectorAll('[data-ab-tab]'));
  var panels = tabs.map(function (t) { return document.getElementById(t.getAttribute('data-ab-tab')); });
  var mq = window.matchMedia('(max-width: 991px)');
  var current = 0;

  function select(i, focus) {
    current = i;
    tabs.forEach(function (t, k) {
      var on = k === i;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      panels[k].classList.toggle('is-active', on);
    });
    if (focus) tabs[i].focus();
  }

  function setMode() {
    var on = mq.matches;
    section.classList.toggle('ab--tabs', on);
    if (on) {
      tablist.setAttribute('role', 'tablist');
      tabs.forEach(function (t, k) {
        t.setAttribute('role', 'tab');
        t.setAttribute('aria-controls', panels[k].id);
        panels[k].setAttribute('role', 'tabpanel');
        panels[k].setAttribute('aria-labelledby', t.id);
        panels[k].tabIndex = 0;
      });
      select(current, false);
    } else {
      tablist.removeAttribute('role');
      tabs.forEach(function (t, k) {
        ['role', 'aria-controls', 'aria-selected', 'tabindex'].forEach(function (a) { t.removeAttribute(a); });
        ['role', 'aria-labelledby', 'tabindex'].forEach(function (a) { panels[k].removeAttribute(a); });
        panels[k].classList.remove('is-active');
      });
    }
  }

  tabs.forEach(function (t, k) {
    t.addEventListener('click', function () { select(k, false); });
    t.addEventListener('keydown', function (e) {
      var n = tabs.length, next = null;
      if (e.key === 'ArrowRight') next = (k + 1) % n;
      else if (e.key === 'ArrowLeft') next = (k - 1 + n) % n;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = n - 1;
      if (next === null) return;
      e.preventDefault();
      select(next, true);
    });
  });

  /* Fit one screen: with the tabs on, drop the optional pieces in order (about.css, .ab--fit-1 to
     -4) until the section fits the window below the sticky menu */
  var LEVELS = 4;
  var nav = document.getElementById('navigation1');
  function fit() {
    for (var k = 1; k <= LEVELS; k++) section.classList.remove('ab--fit-' + k);
    if (!mq.matches) return;
    var room = window.innerHeight - (nav ? nav.getBoundingClientRect().height : 0);
    for (var n = 1; n <= LEVELS && section.offsetHeight > room; n++) section.classList.add('ab--fit-' + n);
  }

  var timer = null;
  function refit() {
    clearTimeout(timer);
    timer = setTimeout(function () { setMode(); fit(); }, 120);
  }

  if (mq.addEventListener) mq.addEventListener('change', function () { setMode(); fit(); });
  else if (mq.addListener) mq.addListener(function () { setMode(); fit(); });
  setMode();
  fit();
  window.addEventListener('resize', refit);
  window.addEventListener('load', fit);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
})();
