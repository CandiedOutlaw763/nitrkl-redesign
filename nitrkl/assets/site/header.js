/* NIT Rourkela homepage: header (see header.css). Navigation, sticky colour, scroll progress,
   language menu and the header's accessibility button.
   Ported from the component library (nitrkl-components/components/02-header/header.js). The helpers it
   took from core/core.js (window.NITR) are defined here and the menu's classes are renamed gz-*.
   Google Translate itself is set up by layout.js (googleTranslateElementInit), which renders into
   #google_translate_element. */
(function () {
  'use strict';

  var doc = document;
  var $ = function (sel, ctx) { return (ctx || doc).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); };

  /* ---------------------------------------------------------------
     Navigation
     --------------------------------------------------------------- */
  var nav = $('#navigation1');
  var masthead = $('.masthead');
  if (nav && masthead && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      nav.classList.toggle('is-stuck', !entries[0].isIntersecting);
      paintNav();
    }).observe(masthead);
  }

  var navItems = $$('.gz-nav-menu > li.has-mega, .gz-nav-menu > li.has-drop');
  function closeAll(except) {
    navItems.forEach(function (li) {
      if (li === except) return;
      li.classList.remove('is-open');
      var b = $('.nav-top', li);
      if (b) b.setAttribute('aria-expanded', 'false');
    });
  }
  navItems.forEach(function (li) {
    var btn = $('.nav-top', li);
    btn.addEventListener('click', function () {
      var open = !li.classList.contains('is-open');
      closeAll(li);
      li.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
    });
    li.addEventListener('mouseleave', function () {
      if (window.innerWidth > 1100) { li.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); }
    });
  });
  doc.addEventListener('click', function (e) {
    if (!e.target.closest('.gz-nav-menu')) closeAll();
    if (!e.target.closest('.lang')) toggleLang(false);
  });
  doc.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var open = $('.gz-nav-menu > li.is-open');
    closeAll();
    if (open) $('.nav-top', open).focus();
    if (doc.body.classList.contains('nav-open')) toggleMobileNav(false);
    if (langBtn && langBtn.getAttribute('aria-expanded') === 'true') { toggleLang(false); langBtn.focus(); }
  });

  var navToggle = $('.gz-nav-toggle');
  function toggleMobileNav(force) {
    var open = typeof force === 'boolean' ? force : !doc.body.classList.contains('nav-open');
    if (open) nav.style.setProperty('--nav-top', nav.getBoundingClientRect().bottom + 'px');
    doc.body.classList.toggle('nav-open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    $('.nav-toggle-text', navToggle).textContent = open ? 'Close' : 'Menu';
  }
  if (navToggle) navToggle.addEventListener('click', function () { toggleMobileNav(); });

  /* The sticky bar takes the colour of the section passing beneath it (DBIM palette). */
  var CHAPTER = {
    dark: ['#150202', '#fff'], terra: ['#a72626', '#fff'], white: ['#fff', '#150202'], paper: ['#ebeaea', '#150202'],
    gold: ['#fcdada', '#150202'], teal: ['#150202', '#fff'], plum: ['#150202', '#fff'], cinnamon: ['#771d1d', '#fff']
  };
  // The menu is kept light over every section for easier reading (header.css, "Light main menu"):
  // no chapters to follow, so paintNav leaves it in its own colours
  var chapters = [];
  var lastChapter = null;
  function paintNav() {
    if (!nav) return;
    var probe = nav.getBoundingClientRect().bottom + 1;
    var current = null;
    if (nav.classList.contains('is-stuck')) {
      for (var i = 0; i < chapters.length; i++) {
        var r = chapters[i].getBoundingClientRect();
        if (r.top <= probe && r.bottom > probe) { current = chapters[i].getAttribute('data-chapter'); break; }
      }
    }
    if (current === lastChapter) return;
    lastChapter = current;
    if (current && CHAPTER[current]) {
      var light = CHAPTER[current][1] !== '#fff';
      nav.style.setProperty('--nav-bg', CHAPTER[current][0]);
      nav.style.setProperty('--nav-fg', CHAPTER[current][1]);
      nav.style.setProperty('--accent', light ? '#a72626' : '#faaaaa');
      nav.style.setProperty('--focus', light ? '#a72626' : '#fff');
    } else {
      ['--nav-bg', '--nav-fg', '--accent', '--focus'].forEach(function (p) { nav.style.removeProperty(p); });
    }
  }

  var bar = $('.scroll-progress span');
  var ticking = false;
  function onScroll() {
    var h = doc.documentElement.scrollHeight - window.innerHeight;
    if (bar) bar.style.transform = 'scaleX(' + (h > 0 ? window.scrollY / h : 0) + ')';
    paintNav();
    ticking = false;
  }
  window.addEventListener('scroll', function () { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ---------------------------------------------------------------
     Language selection (अ | A), backed by Google Translate
     --------------------------------------------------------------- */
  var langBtn = $('.lang-btn'), langMenu = $('#langMenu');
  function toggleLang(force) {
    if (!langBtn) return;
    var open = typeof force === 'boolean' ? force : langBtn.getAttribute('aria-expanded') !== 'true';
    langBtn.setAttribute('aria-expanded', String(open));
    langMenu.hidden = !open;
    if (open) { var first = $('button', langMenu); if (first) first.focus(); }
  }
  if (langBtn) {
    langBtn.addEventListener('click', function (e) { e.stopPropagation(); toggleLang(); });
    var current = (doc.cookie.match(/googtrans=\/en\/(\w+)/) || [])[1] || 'en';
    $$('[data-lang]', langMenu).forEach(function (b) {
      if (b.dataset.lang === current) b.setAttribute('aria-current', 'true');
      b.addEventListener('click', function () {
        var code = b.dataset.lang;
        // Choosing Hindi or Odia, under the note in this menu, is consent to the Google Translate
        // (functional) cookie; the cookie banner's other choices are kept (guidelines.js)
        if (code !== 'en' && window.nitrklAllowFunctional) window.nitrklAllowFunctional();
        var combo = $('.goog-te-combo');
        if (combo) {
          combo.value = code === 'en' ? '' : code;
          combo.dispatchEvent(new Event('change'));
          if (code === 'en') { doc.cookie = 'googtrans=/en/en;path=/'; location.reload(); }
        } else {
          doc.cookie = 'googtrans=/en/' + code + ';path=/';
          location.reload();
        }
        $$('[data-lang]', langMenu).forEach(function (x) { x.toggleAttribute('aria-current', x === b); });
        toggleLang(false);
      });
    });
  }

  /* Accessibility controls in the header (DBIM 5.4) open the same panel as the floating button.
     The panel (nitrkl-accessibility.js) is built after this script runs, so it is found on use. */
  var accBtn = $('.uc-acc');
  if (accBtn) {
    accBtn.addEventListener('click', function () {
      var t = $('.nitrkl-acc-trigger');
      if (t) t.click();
    });
    window.addEventListener('load', function () {
      var card = $('#nitrkl-accessibility-card');
      if (card && 'MutationObserver' in window) {
        new MutationObserver(function () { accBtn.setAttribute('aria-expanded', String(card.classList.contains('open'))); })
          .observe(card, { attributes: true, attributeFilter: ['class'] });
      }
    });
  }
})();
