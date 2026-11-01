/* NIT Rourkela homepage: Gen-Z footer (see footer.css). The footer blocks of the Gen-Z site.js.
   Loaded after GSAP and ScrollTrigger; the motion does nothing without them. */
(function () {
  'use strict';

  var doc = document;
  var $ = function (sel, ctx) { return (ctx || doc).querySelector(sel); };

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var staticMode = /[?&]static\b/.test(location.search);
  var animate = !reduced && !staticMode && typeof window.gsap !== 'undefined' && !!window.ScrollTrigger;
  if (animate) gsap.registerPlugin(ScrollTrigger);

  /* ---------------------------------------------------------------
     Last updated (DBIM footer). The server should write the real date.
     --------------------------------------------------------------- */
  (function lastUpdated() {
    var el = $('#lastUpdated');
    var d = new Date(doc.lastModified);
    if (!el || isNaN(d)) return;
    el.dateTime = d.toISOString().slice(0, 10);
    el.textContent = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  })();

  if (animate) {
    // The giant name at the foot of the page slides in as the footer arrives
    var fname = $('.site-footer .f-name');
    if (fname) gsap.fromTo(fname, { xPercent: -6 }, { xPercent: 0, ease: 'none', scrollTrigger: { trigger: fname, start: 'top bottom', end: 'bottom bottom', scrub: true } });

    // Layout settles after web fonts and images; re-measure every trigger then.
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  }
})();
