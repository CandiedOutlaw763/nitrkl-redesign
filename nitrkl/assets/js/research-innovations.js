/**
 * NIT Rourkela - Research and Innovations
 * Opens one research story at a time in the strip (hover, click or keyboard)
 * and grows the publication bars once the output panel scrolls into view.
 */
(function () {
  'use strict';

  function initStories(list) {
    var stories = Array.prototype.slice.call(list.querySelectorAll('.ri-story'));
    var hoverTimer = null;

    function open(story) {
      stories.forEach(function (s) {
        var on = s === story;
        s.classList.toggle('is-open', on);
        var toggle = s.querySelector('.ri-story-toggle');
        var body = s.querySelector('.ri-story-body');
        toggle.setAttribute('aria-expanded', on ? 'true' : 'false');
        toggle.tabIndex = on ? -1 : 0;
        body.setAttribute('aria-hidden', on ? 'false' : 'true');
        body.querySelectorAll('a').forEach(function (a) { a.tabIndex = on ? 0 : -1; });
      });
    }

    stories.forEach(function (story) {
      var toggle = story.querySelector('.ri-story-toggle');
      toggle.addEventListener('click', function () {
        open(story);
        var link = story.querySelector('.ri-story-link');
        if (link) link.focus({ preventScroll: true });
      });
      // Open on hover with a short intent delay so sweeping the mouse across doesn't flicker
      story.addEventListener('mouseenter', function () {
        clearTimeout(hoverTimer);
        hoverTimer = setTimeout(function () { open(story); }, 140);
      });
      story.addEventListener('mouseleave', function () { clearTimeout(hoverTimer); });
    });

    var initial = list.querySelector('.ri-story.is-open') || stories[0];
    if (initial) open(initial);
  }

  function initOutput(panel) {
    var reveal = function () { panel.classList.add('is-revealed'); };
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      reveal();
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) {
        reveal();
        io.disconnect();
      }
    }, { threshold: 0.3 });
    io.observe(panel);
  }

  function initAll() {
    document.querySelectorAll('.ri-stories').forEach(initStories);
    document.querySelectorAll('.ri-output').forEach(initOutput);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
