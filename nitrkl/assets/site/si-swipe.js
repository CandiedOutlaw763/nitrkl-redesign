/* NIT Rourkela homepage: Social Initiatives on phones and tablets (see social-initiatives.css).
   Below 900px the four initiatives are a row the reader swipes through; this adds a "Swipe" hint
   and one dot per initiative under the row. The dot of the card in view is marked, and tapping a
   dot slides to that card. On wider screens the row is a grid and the bar is hidden. */
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
      // where the card sits now relative to the row's start, from their positions on screen
      var left = feed.scrollLeft + card.getBoundingClientRect().left - feed.getBoundingClientRect().left
        - parseFloat(getComputedStyle(feed).paddingLeft);
      feed.scrollTo({ left: left, behavior: reduced ? 'auto' : 'smooth' });
      setTimeout(mark, reduced ? 0 : 500);   // in case the slide ends without a last scroll event
    });
    dots.appendChild(b);
    return b;
  });
  bar.appendChild(dots);
  feed.after(bar);

  // The card most in view is the current one
  function mark() {
    var box = feed.getBoundingClientRect(), best = 0, bestSeen = -1;
    cards.forEach(function (c, i) {
      var r = c.getBoundingClientRect();
      var seen = Math.min(r.right, box.right) - Math.max(r.left, box.left);
      if (seen > bestSeen) { bestSeen = seen; best = i; }
    });
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
})();
