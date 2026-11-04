/* NIT Rourkela homepage: hero carousel (see hero.css).
   Ported from the component library (nitrkl-components/components/03-hero/hero.js). The helpers it
   took from core/core.js (window.NITR) are defined here and the pause button swaps the site's icon
   classes. Loaded after GSAP and ScrollTrigger;
   without them it still works, just without the motion. */
(function () {
  'use strict';

  var doc = document;
  var $ = function (sel, ctx) { return (ctx || doc).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); };

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var staticMode = /[?&]static\b/.test(location.search);
  var animate = !reduced && !staticMode && typeof window.gsap !== 'undefined';
  if (animate && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  /* ---------------------------------------------------------------
     Hero: the campus film and the banners. Each banner sits in one
     .hero-media layer, and only that layer moves. Pauses on hover and focus;
     no autoplay with reduced motion.
     --------------------------------------------------------------- */
  (function hero() {
    var stage = $('#heroStage');
    if (!stage) return;
    var root = stage.closest('.hero');
    var slides = $$('.hero-slide', stage);
    var thumbs = $$('#heroThumbs button');
    var pauseBtn = $('[data-hero="pause"]', root);
    var cap = { count: $('.hero-count', root), title: $('.hero-title', root), kind: $('.hero-kind', root) };
    var current = 0, timer = null, busy = false, progTween = null;
    var paused = reduced || staticMode, held = false, started = false;

    /* The stage's height cap leaves room for the caption rail, whose height changes across
       breakpoints: hand the CSS its real height. */
    var rail = $('.hero-rail', root);
    function measureRail() {
      if (rail) root.style.setProperty('--hero-rail', Math.round(rail.offsetHeight) + 'px');
    }
    measureRail();
    window.addEventListener('resize', measureRail);
    window.addEventListener('load', measureRail);
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(measureRail);

    function setPauseUI() {
      if (!pauseBtn) return;
      pauseBtn.setAttribute('aria-pressed', String(paused));
      pauseBtn.setAttribute('aria-label', paused ? 'Play slideshow' : 'Pause slideshow');
      var icon = $('i', pauseBtn);
      if (icon) icon.className = paused ? 'bi bi-play-fill' : 'bi bi-pause-fill';
    }
    function caption(i) {
      var s = slides[i];
      if (cap.count) cap.count.textContent = (i + 1) + ' / ' + slides.length;
      if (cap.title) cap.title.textContent = s.dataset.title || '';
      if (cap.kind) cap.kind.textContent = s.dataset.kind || '';
      if (animate) gsap.fromTo([cap.title, cap.kind], { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: .6, stagger: .06, ease: 'expo.out', clearProps: 'transform,opacity' });
    }
    function progress(i, ms) {
      thumbs.forEach(function (t, k) {
        var p = $('.hero-prog', t);
        if (window.gsap) gsap.killTweensOf(p);
        p.style.transform = 'scaleX(' + (k < i ? 1 : 0) + ')';
      });
      if (paused || held || !ms || !window.gsap || reduced) return;
      progTween = gsap.fromTo($('.hero-prog', thumbs[i]), { scaleX: 0 }, { scaleX: 1, duration: ms / 1000, ease: 'none' });
    }
    function schedule() {
      clearTimeout(timer);
      var ms = parseInt(slides[current].getAttribute('data-interval'), 10) || 6000;
      progress(current, ms);
      if (!paused && !held) timer = setTimeout(function () { go(current + 1, 1); }, ms);
    }
    function setVideo(slide, play) {
      var v = $('video', slide);
      if (!v) return;
      if (play && !paused) { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); }
      else v.pause();
    }
    function go(next, dir) {
      if (busy) return;
      next = (next + slides.length) % slides.length;
      if (next === current) return;
      var from = slides[current], to = slides[next];
      var fromMedia = $('.hero-media', from), toMedia = $('.hero-media', to);
      thumbs[current].classList.remove('is-active');
      thumbs[next].classList.add('is-active');
      slides.forEach(function (s, k) { s.setAttribute('aria-hidden', String(k !== next)); });
      $$('img, video', to).forEach(function (m) { if (m.loading === 'lazy') m.loading = 'eager'; });
      var v = $('video', to); if (v) v.currentTime = 0;
      setVideo(to, true);
      caption(next);
      if (animate) {
        busy = true;
        to.classList.add('is-entering');
        from.classList.add('is-leaving');
        gsap.timeline({
          defaults: { ease: 'expo.inOut' },
          onComplete: function () {
            from.classList.remove('is-active', 'is-leaving'); to.classList.add('is-active'); to.classList.remove('is-entering');
            gsap.set(to, { clearProps: 'clipPath' }); gsap.set([fromMedia, toMedia], { clearProps: 'transform' });
            setVideo(from, false); busy = false;
          }
        })
          // The incoming slide is wiped in while its media layer settles;
          // the outgoing layer drifts the other way. One duration and one curve for both.
          .fromTo(to, { clipPath: dir > 0 ? 'inset(0% 0% 0% 100%)' : 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1 }, 0)
          .fromTo(toMedia, { xPercent: dir * 12, scale: 1.06 }, { xPercent: 0, scale: 1, duration: 1.1 }, 0)
          .to(fromMedia, { xPercent: dir * -12, duration: 1.1 }, 0);
      } else {
        from.classList.remove('is-active'); to.classList.add('is-active'); setVideo(from, false);
      }
      current = next;
      held = shouldHold();
      schedule();
    }
    // The pointer holds a banner so it can be read; the film plays on regardless. Keyboard focus in the
    // carousel holds the timer on any slide. Nothing here stops the film: only the pause button does.
    var hovering = false, focused = false;
    function shouldHold() { return focused || (hovering && !$('video', slides[current])); }
    function hold() {
      var on = shouldHold();
      if (held === on) return;
      held = on;
      if (on) { clearTimeout(timer); if (progTween) progTween.pause(); }
      else if (!paused) schedule();
    }

    thumbs.forEach(function (t, i) { t.addEventListener('click', function () { go(i, i > current ? 1 : -1); }); });
    $$('[data-hero="prev"]', root).forEach(function (b) { b.addEventListener('click', function () { go(current - 1, -1); }); });
    $$('[data-hero="next"]', root).forEach(function (b) { b.addEventListener('click', function () { go(current + 1, 1); }); });
    if (pauseBtn) pauseBtn.addEventListener('click', function () {
      paused = !paused;
      setPauseUI();
      setVideo(slides[current], !paused);
      if (paused) { clearTimeout(timer); progress(current, 0); } else schedule();
    });
    root.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') { hovering = true; hold(); } });
    root.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') { hovering = false; hold(); } });
    root.addEventListener('focusin', function () { focused = true; hold(); });
    root.addEventListener('focusout', function (e) { if (!root.contains(e.relatedTarget)) { focused = false; hold(); } });

    var sx = null;
    stage.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') sx = e.clientX; });
    stage.addEventListener('pointerup', function (e) {
      if (sx === null) return;
      var dx = e.clientX - sx; sx = null;
      if (Math.abs(dx) > 40) go(current + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
    });
    function start() {
      if (started) return;
      started = true;
      if (!paused) { setVideo(slides[0], true); schedule(); }
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        if (paused) return;
        if (!en[0].isIntersecting) { clearTimeout(timer); if (progTween) progTween.pause(); setVideo(slides[current], false); }
        else if (!started) start();
        else { setVideo(slides[current], true); if (!held) schedule(); }
      }).observe(stage);
    }
    slides.forEach(function (s, k) { s.setAttribute('aria-hidden', String(k !== 0)); });
    setPauseUI();
    // While the opening sequence plays, wait for it so the film starts as the view arrives.
    if (doc.documentElement.classList.contains('intro-on')) doc.addEventListener('nitrkl:intro-done', start, { once: true });
    else start();

    if (animate) {
      gsap.to('#heroStage .hero-media', {
        yPercent: 7, ease: 'none', scrollTrigger: { trigger: stage, start: 'top top', end: 'bottom top', scrub: true }
      });
    }
  })();
})();
