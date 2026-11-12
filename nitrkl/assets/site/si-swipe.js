/* NIT Rourkela homepage: Social Initiatives on phones and tablets (see social-initiatives.css).
   Below 900px the four initiatives are a row the reader swipes through; this adds a "Swipe" hint
   and one dot per initiative under the row. The dot of the card in view is marked, and tapping a
   dot slides to that card. On wider screens the row is a grid and the bar is hidden.
   The row also moves on by itself, one card every few seconds, back to the first after the last.
   It holds while the reader touches, hovers or focuses the row, while the row is off screen and
   while the tab is hidden; a pause button beside the dots stops it (WCAG 2.2.2). It never starts
   for readers who prefer reduced motion. */
(function () {
  'use strict';

  var feed = document.querySelector('#social-initiatives .si-diagonal-feed');
  if (!feed) return;
  var cards = Array.prototype.slice.call(feed.querySelectorAll('.si-item'));
  if (cards.length < 2) return;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var bar = document.createElement('div');
  bar.className = 'si-swipe';
  bar.innerHTML = '<span class="si-swipe-hint" aria-hidden="true">Swipe <i class="bi bi-arrow-right"></i></span>';
  var dots = document.createElement('div');
  dots.className = 'si-swipe-dots';
  dots.setAttribute('role', 'group');
  dots.setAttribute('aria-label', 'Social initiatives');
  var buttons = cards.map(function (card, i) {
    var title = card.querySelector('.si-item-title');
    var b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', 'Show initiative ' + (i + 1) + ' of ' + cards.length + (title ? ': ' + title.textContent.trim() : ''));
    b.addEventListener('click', function () {
      slideTo(card);
      setTimeout(mark, reduced ? 0 : 500);   // in case the slide ends without a last scroll event
      restart();
    });
    dots.appendChild(b);
    return b;
  });
  var end = document.createElement('div');
  end.className = 'si-swipe-end';
  end.appendChild(dots);
  bar.appendChild(end);
  feed.after(bar);

  function slideTo(card) {
    // where the card sits now relative to the row's start, from their positions on screen
    var left = feed.scrollLeft + card.getBoundingClientRect().left - feed.getBoundingClientRect().left
      - parseFloat(getComputedStyle(feed).paddingLeft);
    feed.scrollTo({ left: left, behavior: reduced ? 'auto' : 'smooth' });
  }

  // The card most in view is the current one
  var current = 0;
  function mark() {
    var box = feed.getBoundingClientRect(), best = 0, bestSeen = -1;
    cards.forEach(function (c, i) {
      var r = c.getBoundingClientRect();
      var seen = Math.min(r.right, box.right) - Math.max(r.left, box.left);
      if (seen > bestSeen) { bestSeen = seen; best = i; }
    });
    current = best;
    buttons.forEach(function (b, i) {
      b.classList.toggle('is-active', i === best);
      if (i === best) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
    });
  }
  var timer = null;
  feed.addEventListener('scroll', function () {
    clearTimeout(timer);
    timer = setTimeout(mark, 60);
  }, { passive: true });
  window.addEventListener('resize', mark);
  mark();

  /* ---------- Auto-advance (phones and tablets only) ---------- */
  var DELAY = 5000;
  var narrow = window.matchMedia('(max-width: 899px)');
  var timer = null, userPaused = reduced, held = false, inView = false;
  var resumeTimer = null;

  if (!reduced) {
    var pause = document.createElement('button');
    pause.type = 'button';
    pause.className = 'gg-pause';
    var setPause = function (p) {
      pause.setAttribute('aria-pressed', String(p));
      pause.setAttribute('aria-label', (p ? 'Play' : 'Pause') + ' social initiatives slideshow');
      pause.title = (p ? 'Play' : 'Pause') + ' slideshow';
      pause.innerHTML = '<i class="bi ' + (p ? 'bi-play-fill' : 'bi-pause-fill') + '" aria-hidden="true"></i>';
    };
    setPause(false);
    pause.addEventListener('click', function () {
      userPaused = !userPaused;
      setPause(userPaused);
      sync();
    });
    end.appendChild(pause);
  }

  function step() {
    slideTo(cards[(current + 1) % cards.length]);
  }
  function sync() {
    var run = narrow.matches && !userPaused && !held && inView && !document.hidden;
    if (run && !timer) timer = setInterval(step, DELAY);
    if (!run && timer) { clearInterval(timer); timer = null; }
  }
  // After the reader acts, wait a full interval before moving on again
  function restart() {
    if (timer) { clearInterval(timer); timer = null; }
    sync();
  }
  function hold() { held = true; clearTimeout(resumeTimer); sync(); }
  function release(after) {
    clearTimeout(resumeTimer);
    resumeTimer = setTimeout(function () { held = false; sync(); }, after || 0);
  }

  if (!reduced) {
    feed.addEventListener('touchstart', hold, { passive: true });
    feed.addEventListener('touchend', function () { release(DELAY); }, { passive: true });
    feed.addEventListener('touchcancel', function () { release(DELAY); }, { passive: true });
    // Hover only with a real pointer: a tap on a phone fires mouseenter with no mouseleave after it
    if (window.matchMedia('(hover: hover)').matches) {
      feed.addEventListener('mouseenter', hold);
      feed.addEventListener('mouseleave', function () { release(); });
    }
    feed.addEventListener('focusin', hold);
    feed.addEventListener('focusout', function (e) { if (!feed.contains(e.relatedTarget)) release(); });
    document.addEventListener('visibilitychange', sync);
    if (narrow.addEventListener) narrow.addEventListener('change', sync); else narrow.addListener(sync);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        inView = entries[0].isIntersecting;
        sync();
      }, { threshold: 0.5 }).observe(feed);
    } else {
      inView = true;
      sync();
    }
  }
})();
