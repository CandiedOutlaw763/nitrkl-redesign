/* NIT Rourkela homepage: Placement Statistics. The Annual Placement Report (placement-report.html)
   is shown directly in the section, with its frame sized to the whole report so the statistics
   need no scrolling inside it. Also hides the loading overlay once the report arrives and wires
   up the Reload and Fullscreen buttons. */
(function () {
  'use strict';

  var wrap = document.getElementById('placementEmbedFrameWrap');
  var iframe = document.getElementById('placementIframe');
  var loader = document.getElementById('placementIframeLoader');
  var reloadBtn = document.getElementById('embedReloadBtn');
  var fullscreenBtn = document.getElementById('embedFullscreenBtn');
  if (!wrap || !iframe) return;

  /* Fit the frame to the report. The report's wrapper is min-height: 100vh, which inside a frame
     means "at least as tall as the frame", so measure with the frame collapsed and set the height
     in the same task (no visible jump). Same-origin only; otherwise the frame keeps its CSS height. */
  var fitted = 0;
  function fit() {
    if (document.fullscreenElement === wrap) return;
    var d;
    try { d = iframe.contentDocument; } catch (e) { return; }
    if (!d || !d.body || d.URL === 'about:blank') return;
    var y = window.scrollY;
    iframe.style.height = '1px';
    var h = Math.ceil(Math.max(d.documentElement.scrollHeight, d.body.scrollHeight));
    iframe.style.height = h + 'px';
    if (window.scrollY !== y) window.scrollTo(window.scrollX, y);
    fitted = h;
    wrap.classList.add('is-fitted');
    iframe.setAttribute('scrolling', 'no');
  }
  var fitTimer = null;
  function fitSoon() { clearTimeout(fitTimer); fitTimer = setTimeout(fit, 120); }

  var watcher = null;
  function watchReport() {
    if (watcher) watcher.disconnect();
    var d;
    try { d = iframe.contentDocument; } catch (e) { return; }
    if (!d || !d.body || !('ResizeObserver' in window)) return;
    // Charts and fonts settle after load; refit when the report's content changes size
    watcher = new ResizeObserver(function () {
      var h = Math.max(d.documentElement.scrollHeight, d.body.scrollHeight);
      if (Math.abs(h - fitted) > 1) fitSoon();
    });
    var main = d.querySelector('main') || d.body;
    watcher.observe(main);
  }

  function loaded() {
    if (loader) loader.classList.add('hidden');
    fit();
    watchReport();
  }
  iframe.addEventListener('load', loaded);
  window.addEventListener('resize', fitSoon);
  // The report may already have loaded before this script ran
  try { if (iframe.contentDocument && iframe.contentDocument.readyState === 'complete' && iframe.contentDocument.URL !== 'about:blank') loaded(); } catch (e) {}

  if (reloadBtn) {
    reloadBtn.addEventListener('click', function () {
      if (loader) loader.classList.remove('hidden');
      iframe.src = iframe.getAttribute('src');
    });
  }

  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', function () {
      if (!document.fullscreenElement) {
        if (wrap.requestFullscreen) wrap.requestFullscreen().catch(function () {});
      } else if (document.exitFullscreen) {
        document.exitFullscreen().catch(function () {});
      }
    });
    document.addEventListener('fullscreenchange', function () {
      var on = document.fullscreenElement === wrap;
      var icon = fullscreenBtn.querySelector('i');
      var label = fullscreenBtn.querySelector('.action-label');
      if (icon) icon.className = on ? 'fa-solid fa-compress' : 'fa-solid fa-expand';
      if (label) label.textContent = on ? 'Exit Fullscreen' : 'Fullscreen';
      // Fullscreen scrolls inside the frame; back on the page, fit it again
      iframe.setAttribute('scrolling', on ? 'auto' : 'no');
      if (!on) fitSoon();
    });
  }
})();
