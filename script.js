/* Curved, endlessly streaming photo strip – accessible version
   - Pause / Play button (WCAG 2.2.2) + pauses on hover and keyboard focus
   - Previous / Next buttons as a non-animated alternative
   - Respects prefers-reduced-motion (starts paused; static grid when CSS says so)
   - Tiles are real <button>s; full-size viewer is a native <dialog>
*/
(function () {
  const stage = document.getElementById('stage');
  const track = document.getElementById('track');
  const tiles = Array.from(track.querySelectorAll('li'));
  const controls = document.getElementById('controls');
  const toggle = document.getElementById('toggle');
  const prev = document.getElementById('prev');
  const next = document.getElementById('next');
  const status = document.getElementById('status');

  const reduceMq = window.matchMedia('(prefers-reduced-motion: reduce)');
  const N = tiles.length;

  document.documentElement.classList.add('js');
  controls.hidden = false;

  /* ---------- state ---------- */
  let offset = 0;                 // px the strip has travelled
  let speed = 36;                 // px / second
  let userPaused = reduceMq.matches;
  let hoverPaused = false, focusPaused = false, offscreen = false;
  let tween = null;               // { from, to, start, dur }
  let last = performance.now();
  let tileW = 280, gap = 24, step = 304, total = N * step, half = 600;

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const mod = (n, m) => ((n % m) + m) % m;

  function measure() {
    const cs = getComputedStyle(document.documentElement);
    tileW = parseFloat(cs.getPropertyValue('--tile-w')) || 280;
    gap = parseFloat(cs.getPropertyValue('--gap')) || 24;
    step = tileW + gap;
    total = N * step;
    half = stage.clientWidth / 2;
  }

  /* ---------- curved layout ---------- */
  function render() {
    for (let i = 0; i < N; i++) {
      const x = mod(i * step + offset + total / 2, total) - total / 2;   // -total/2 … +total/2
      const u = x / half;                                                 // -1 … 1 across the stage
      const a = Math.abs(u);
      const rotY = clamp(-u * 38, -60, 60);                               // faces the centre
      const z = Math.min(a, 1.4) ** 2 * 170;                              // edges bend toward the viewer
      const s = 1 + Math.min(a, 1.4) ** 2 * 0.06;
      const op = clamp(1 - (a - 0.68) / 0.3, 0, 1);                       // fade out at the edges
      const el = tiles[i];
      el.style.transform = `translate3d(${x}px,0,${z}px) rotateY(${rotY}deg) scale(${s})`;
      el.style.opacity = op;
      el.style.visibility = op <= 0.02 ? 'hidden' : 'visible';           // hidden tiles are skipped by Tab
      el.style.zIndex = Math.round(1000 - a * 100);
    }
  }

  /* ---------- animation loop ---------- */
  const isRunning = () => !userPaused && !hoverPaused && !focusPaused && !offscreen && !document.hidden;

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (tween) {
      const t = clamp((now - tween.start) / tween.dur, 0, 1);
      const e = 1 - Math.pow(1 - t, 3);                                   // ease-out
      offset = tween.from + (tween.to - tween.from) * e;
      if (t >= 1) tween = null;
      render();
    } else if (isRunning()) {
      offset -= speed * dt;
      render();
    }
    requestAnimationFrame(frame);
  }

  function stepBy(dir) {                // dir: +1 next, -1 previous
    const to = offset - dir * step;
    if (reduceMq.matches) { offset = to; render(); return; }
    tween = { from: offset, to, start: performance.now(), dur: 450 };
  }

  /* ---------- controls ---------- */
  function setPaused(p, announce) {
    userPaused = p;
    toggle.textContent = p ? 'Play' : 'Pause';
    toggle.setAttribute('aria-pressed', String(p));
    if (announce) status.textContent = p ? 'Gallery animation paused.' : 'Gallery animation playing.';
  }
  toggle.addEventListener('click', () => setPaused(!userPaused, true));
  prev.addEventListener('click', () => stepBy(-1));
  next.addEventListener('click', () => stepBy(1));

  stage.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') hoverPaused = true; });
  stage.addEventListener('pointerleave', () => { hoverPaused = false; });
  stage.addEventListener('focusin', (e) => {
    focusPaused = true;
    // bring the focused tile to the centre so it is never hidden
    const i = tiles.indexOf(e.target.closest('li'));
    if (i > -1) {
      const x = mod(i * step + offset + total / 2, total) - total / 2;
      if (Math.abs(x) > half * 0.55) { offset -= x; render(); }
    }
  });
  stage.addEventListener('focusout', () => { focusPaused = false; });

  reduceMq.addEventListener('change', () => { if (reduceMq.matches) setPaused(true, true); });
  new IntersectionObserver(([en]) => { offscreen = !en.isIntersecting; }).observe(stage);
  window.addEventListener('resize', () => { measure(); render(); });

  /* ---------- full-size viewer ---------- */
  const viewer = document.getElementById('viewer');
  const vImg = document.getElementById('viewer-img');
  const vCap = document.getElementById('viewer-caption');
  const vDown = document.getElementById('v-download');
  let current = 0;

  function show(i) {
    current = mod(i, N);
    const btn = tiles[current].querySelector('.tile');
    const img = btn.querySelector('img');
    vImg.src = btn.dataset.full || img.src;
    vImg.alt = img.alt;
    vCap.textContent = btn.dataset.caption || img.alt;
    vDown.href = vImg.src;
  }
  tiles.forEach((li, i) => li.querySelector('.tile').addEventListener('click', () => { show(i); viewer.showModal(); }));
  document.getElementById('v-close').addEventListener('click', () => viewer.close());
  document.getElementById('v-prev').addEventListener('click', () => show(current - 1));
  document.getElementById('v-next').addEventListener('click', () => show(current + 1));
  viewer.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') show(current - 1);
    if (e.key === 'ArrowRight') show(current + 1);
  });
  viewer.addEventListener('click', (e) => { if (e.target === viewer) viewer.close(); });   // click on backdrop

  /* ---------- start ---------- */
  setPaused(userPaused, false);
  measure();
  render();
  requestAnimationFrame((t) => { last = t; frame(t); });
})();
