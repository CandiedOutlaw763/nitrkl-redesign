/**
 * NIT Rourkela - Intellectual Property@NITR
 * Switches the drawing sheet between inventions from the sheet tabs, the
 * previous/next buttons or the arrow keys, plotting each new drawing in.
 */
(function () {
  'use strict';

  function initIpDrawings(section) {
    var tabs = Array.prototype.slice.call(section.querySelectorAll('.ipd-tab'));
    var drawing = section.querySelector('.ipd-drawing');
    var plotter = section.querySelector('.ipd-plotter');
    var titleEl = section.querySelector('.ipd-out-title');
    var fieldEl = section.querySelector('.ipd-out-field');
    var sheetEl = section.querySelector('.ipd-sheetno');
    var figEl = section.querySelector('.ipd-figlabel');
    var moreEl = section.querySelector('.ipd-more');
    if (!tabs.length || !drawing) return;

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var current = 0;

    // Preload drawings so the plot never reveals a half-loaded image
    tabs.forEach(function (tab) { var i = new Image(); i.src = tab.getAttribute('data-src'); });

    function show(index, moveFocus) {
      index = (index + tabs.length) % tabs.length;
      var tab = tabs[index];

      tabs.forEach(function (t, i) {
        var on = i === index;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
      });

      if (index !== current) {
        drawing.src = tab.getAttribute('data-src');
        drawing.alt = 'Technical drawing: ' + tab.getAttribute('data-title');
        if (!reduceMotion) {
          [drawing, plotter].forEach(function (el) {
            el.classList.remove(el === drawing ? 'is-plotting' : 'is-running');
            void el.offsetWidth; // restart the animation
            el.classList.add(el === drawing ? 'is-plotting' : 'is-running');
          });
        }
      }

      titleEl.textContent = tab.getAttribute('data-title');
      fieldEl.textContent = tab.getAttribute('data-field');
      sheetEl.textContent = (index + 1) + ' of ' + tabs.length;
      figEl.textContent = 'Fig. ' + (index + 1);
      moreEl.href = tab.getAttribute('data-href');
      current = index;

      if (moveFocus) tab.focus();

      // Keep the active tab visible on the scrolling mobile strip
      var list = tab.closest('.ipd-tabs');
      if (list && list.scrollWidth > list.clientWidth) {
        list.scrollTo({ left: tab.parentNode.offsetLeft - 16, behavior: reduceMotion ? 'auto' : 'smooth' });
      }
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { show(i); });
      tab.addEventListener('keydown', function (e) {
        var target = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') target = current + 1;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') target = current - 1;
        else if (e.key === 'Home') target = 0;
        else if (e.key === 'End') target = tabs.length - 1;
        if (target === null) return;
        e.preventDefault();
        show(target, true);
      });
    });

    section.querySelectorAll('.ipd-step').forEach(function (btn) {
      btn.addEventListener('click', function () {
        show(current + (btn.getAttribute('data-step') === 'prev' ? -1 : 1));
      });
    });

    show(0);
  }

  function initAll() {
    document.querySelectorAll('.ipd-section').forEach(initIpDrawings);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
