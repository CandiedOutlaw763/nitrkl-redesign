/* ==========================================================================
   NIT Rourkela - Latest News "Newsroom"
   Ticker loop, quick-view modal, card tilt and scroll animations.
   ========================================================================== */
(function () {
    var root = document.getElementById('newsroom');
    var modal = document.getElementById('nr-modal');
    if (!root || !modal) return;

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    var cards = Array.prototype.slice.call(root.querySelectorAll('.nr-card'));

    // Keep the modal out of any transformed ancestor so position: fixed works.
    document.body.appendChild(modal);

    /* Ticker: duplicate the headlines so the loop is seamless */
    var tickerList = root.querySelector('.nr-ticker-list');
    if (tickerList) {
        Array.prototype.forEach.call(tickerList.children, function (li) {
            var copy = li.cloneNode(true);
            copy.setAttribute('aria-hidden', 'true');
            copy.querySelector('button').setAttribute('tabindex', '-1');
            tickerList.appendChild(copy);
        });
    }

    /* Quick-view modal */
    var stories = cards.map(function (card) {
        var img = card.querySelector('.nr-media img');
        var badge = card.querySelector('.nr-badge:not(.nr-badge-hot)');
        return {
            title: card.querySelector('h3').textContent.trim(),
            tag: card.getAttribute('data-nr-tag'),
            img: card.getAttribute('data-nr-img'),
            alt: img ? img.alt : '',
            label: card.querySelector('.nr-media').getAttribute('aria-label'),
            badge: badge ? badge.textContent.trim() : '',
            link: card.getAttribute('data-nr-link'),
            summary: card.getAttribute('data-nr-summary')
        };
    });

    var els = {
        img: document.getElementById('nr-modal-img'),
        tag: document.getElementById('nr-modal-tag'),
        count: document.getElementById('nr-modal-count'),
        title: document.getElementById('nr-modal-title'),
        summary: document.getElementById('nr-modal-summary'),
        link: document.getElementById('nr-modal-link'),
        panel: modal.querySelector('.nr-modal-panel')
    };
    var current = 0;
    var lastFocus = null;

    function fill(i) {
        var s = stories[i];
        els.img.src = s.img;
        els.img.alt = s.title;
        els.tag.textContent = s.tag;
        els.count.textContent = (i + 1) + ' / ' + stories.length;
        els.title.textContent = s.title;
        els.summary.textContent = s.summary;
        els.link.href = s.link;
    }

    function show(i) {
        current = (i + stories.length) % stories.length;
        if (modal.hidden || reduceMotion) {
            fill(current);
            return;
        }
        modal.classList.add('is-switching');
        setTimeout(function () {
            fill(current);
            modal.classList.remove('is-switching');
        }, 220);
    }

    function open(i) {
        lastFocus = document.activeElement;
        rotation.hold();
        fill((current = i));
        modal.hidden = false;
        document.body.classList.add('nr-lock');
        requestAnimationFrame(function () {
            modal.classList.add('is-open');
            els.panel.focus();
        });
    }

    function close() {
        modal.classList.remove('is-open');
        document.body.classList.remove('nr-lock');
        setTimeout(function () { modal.hidden = true; rotation.hold(); }, reduceMotion ? 0 : 350);
        if (lastFocus) lastFocus.focus();
    }

    /* Rotation: every few seconds the next story moves into the featured card and the four cards
       beside it show the stories after it, so no story appears twice. A pause button, previous and
       next (GIGW 3.0 Accessibility 25, WCAG 2.2.2); it holds while hovered, while anything inside has
       keyboard focus, while the quick view is open and while off screen, and starts paused under
       prefers-reduced-motion (and ?static). */
    var rotation = (function () {
        var grid = root.querySelector('.nr-grid');
        var featured = root.querySelector('.nr-featured');
        var noop = { hold: function () {} };
        if (!grid || !featured || stories.length < 2) return noop;

        var INTERVAL = 6000;
        var staticMode = /[?&]static\b/.test(location.search);
        var offset = 0, timer = null, switching = false;
        var paused = reduceMotion || staticMode, hovering = false, focused = false, onScreen = true;
        var featuredBody = featured.querySelector('.nr-body');

        // Controls under the featured story
        var bar = document.createElement('div');
        bar.className = 'nr-rotate';
        bar.setAttribute('role', 'group');
        bar.setAttribute('aria-label', 'Story rotation');
        bar.innerHTML =
            '<span class="nr-rotate-prog" aria-hidden="true"><span></span></span>' +
            '<button type="button" class="gg-pause" data-nr-rot="prev" aria-label="Previous story" title="Previous story"><i class="bi bi-chevron-left" aria-hidden="true"></i></button>' +
            '<button type="button" class="gg-pause" data-nr-rot="pause"></button>' +
            '<button type="button" class="gg-pause" data-nr-rot="next" aria-label="Next story" title="Next story"><i class="bi bi-chevron-right" aria-hidden="true"></i></button>' +
            '<span class="nr-rotate-count"></span>';
        featured.appendChild(bar);
        var pauseBtn = bar.querySelector('[data-nr-rot="pause"]');
        var prog = bar.querySelector('.nr-rotate-prog span');
        var count = bar.querySelector('.nr-rotate-count');

        function setPauseUI() {
            var label = (paused ? 'Play' : 'Pause') + ' story rotation';
            pauseBtn.setAttribute('aria-pressed', String(paused));
            pauseBtn.setAttribute('aria-label', label);
            pauseBtn.title = label;
            pauseBtn.innerHTML = '<i class="bi ' + (paused ? 'bi-play-fill' : 'bi-pause-fill') + '" aria-hidden="true"></i>';
        }

        function fillCard(card, i, isFeatured) {
            var s = stories[i];
            var media = card.querySelector('.nr-media');
            var img = media.querySelector('img');
            card.setAttribute('data-nr-index', i);
            Array.prototype.forEach.call(card.querySelectorAll('[data-nr-open]'), function (b) { b.setAttribute('data-nr-open', i); });
            media.setAttribute('aria-label', isFeatured ? 'Quick view: ' + s.title : s.label);
            img.src = s.img;
            img.alt = s.alt;
            card.querySelector('.nr-tag').textContent = s.tag;
            // the headline is itself the link to the story
            var title = card.querySelector('h3 .nr-title-link') || card.querySelector('h3');
            title.textContent = s.title;
            if (title.tagName === 'A') title.href = s.link;
            var p = card.querySelector('.nr-body > p');
            if (p) p.textContent = s.summary;
            Array.prototype.forEach.call(card.querySelectorAll('.nr-link'), function (a) { a.href = s.link; });
            if (!isFeatured) {
                // A story's own badge (e.g. a ranking) travels with it; the featured card keeps "Featured"
                var badge = media.querySelector('.nr-badge');
                if (s.badge && !badge) {
                    badge = document.createElement('span');
                    badge.className = 'nr-badge';
                    media.insertBefore(badge, media.querySelector('.nr-zoom'));
                }
                if (badge) { if (s.badge) badge.textContent = s.badge; else badge.remove(); }
            }
        }

        function render() {
            cards.forEach(function (card, k) { fillCard(card, (offset + k) % stories.length, k === 0); });
            count.textContent = (offset + 1) + ' / ' + stories.length;
        }

        function go(next, manual) {
            if (switching) return;
            offset = (next + stories.length) % stories.length;
            // Announce a story the user asked for; stay quiet while it changes by itself
            featuredBody.setAttribute('aria-live', manual ? 'polite' : 'off');
            if (reduceMotion) { render(); schedule(); return; }
            switching = true;
            grid.classList.add('is-switching');
            setTimeout(function () {
                render();
                grid.classList.remove('is-switching');
                switching = false;
                schedule();
            }, 260);
        }

        function running() { return !paused && !hovering && !focused && onScreen && modal.hidden; }

        function schedule() {
            clearTimeout(timer);
            timer = null;
            prog.style.transition = 'none';
            prog.style.transform = 'scaleX(0)';
            if (!running()) return;
            void prog.offsetWidth;
            if (!reduceMotion) {
                prog.style.transition = 'transform ' + INTERVAL + 'ms linear';
                prog.style.transform = 'scaleX(1)';
            }
            timer = setTimeout(function () { go(offset + 1, false); }, INTERVAL);
        }

        // Restart the count only when the state actually changes
        var wasRunning = null;
        function hold() {
            var now = running();
            if (now === wasRunning) return;
            wasRunning = now;
            schedule();
        }

        bar.addEventListener('click', function (e) {
            var b = e.target.closest('[data-nr-rot]');
            if (!b) return;
            var act = b.getAttribute('data-nr-rot');
            if (act === 'pause') { paused = !paused; setPauseUI(); wasRunning = null; hold(); }
            else go(offset + (act === 'next' ? 1 : -1), true);
        });
        grid.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') { hovering = true; hold(); } });
        grid.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') { hovering = false; hold(); } });
        // Keyboard focus only: a mouse click on Play focuses the button too, and must not hold it
        grid.addEventListener('focusin', function (e) {
            var kb = true;
            try { kb = e.target.matches(':focus-visible'); } catch (err) {}
            focused = kb; hold();
        });
        grid.addEventListener('focusout', function (e) { if (!grid.contains(e.relatedTarget)) { focused = false; hold(); } });
        if ('IntersectionObserver' in window) {
            new IntersectionObserver(function (en) { onScreen = en[0].isIntersecting; hold(); }).observe(grid);
        }

        featuredBody.setAttribute('aria-live', 'off');
        setPauseUI();
        render();
        hold();
        return { hold: hold };
    })();

    root.addEventListener('click', function (e) {
        var trigger = e.target.closest('[data-nr-open]');
        if (!trigger) return;
        e.preventDefault();
        open(parseInt(trigger.getAttribute('data-nr-open'), 10));
    });

    modal.addEventListener('click', function (e) {
        if (e.target.closest('[data-nr-close]')) close();
        var step = e.target.closest('[data-nr-step]');
        if (step) show(current + parseInt(step.getAttribute('data-nr-step'), 10));
    });

    document.addEventListener('keydown', function (e) {
        if (modal.hidden) return;
        if (e.key === 'Escape') close();
        else if (e.key === 'ArrowRight') show(current + 1);
        else if (e.key === 'ArrowLeft') show(current - 1);
        else if (e.key === 'Tab') {
            // Keep focus inside the dialog
            var f = modal.querySelectorAll('button, a[href]');
            var first = f[0], last = f[f.length - 1];
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
    });

    /* 3D tilt + glare on hover */
    if (finePointer && !reduceMotion) {
        cards.forEach(function (card) {
            var max = card.classList.contains('nr-featured') ? 4 : 8;
            card.addEventListener('pointermove', function (e) {
                var r = card.getBoundingClientRect();
                var x = (e.clientX - r.left) / r.width;
                var y = (e.clientY - r.top) / r.height;
                card.style.transform = 'translateY(-6px) rotateX(' + ((0.5 - y) * max) + 'deg) rotateY(' + ((x - 0.5) * max) + 'deg)';
                card.style.setProperty('--nr-gx', (x * 100) + '%');
                card.style.setProperty('--nr-gy', (y * 100) + '%');
            });
            card.addEventListener('pointerleave', function () {
                card.style.transition = 'transform 0.6s cubic-bezier(.2,.8,.2,1), box-shadow 0.4s ease, border-color 0.4s ease';
                card.style.transform = '';
                setTimeout(function () { card.style.transition = ''; }, 600);
            });
        });
    }

    /* Scroll animations */
    if (reduceMotion || !window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);

    var head = gsap.timeline({ scrollTrigger: { trigger: root, start: 'top 80%', once: true } });
    head.from(root.querySelector('.nr-eyebrow'), { y: 20, opacity: 0, duration: 0.5, ease: 'power2.out' })
        .from(root.querySelector('.nr-title'), { y: 40, opacity: 0, duration: 0.7, ease: 'power3.out' }, '-=0.25')
        .fromTo(root.querySelector('.nr-title'), { '--nr-underline': 0 }, { '--nr-underline': 1, duration: 0.8, ease: 'power2.inOut' }, '-=0.3')
        .fromTo(root.querySelector('.nr-ticker'), { clipPath: 'inset(0 100% 0 0 round 0px)' }, { clipPath: 'inset(0 0% 0 0 round 0px)', duration: 0.9, ease: 'power3.inOut' }, '-=0.4');

    // Featured story: image wipes in, text follows
    var featured = root.querySelector('.nr-featured');
    if (featured) {
        gsap.timeline({ scrollTrigger: { trigger: featured, start: 'top 82%', once: true } })
            .from(featured, { y: 60, opacity: 0, duration: 0.8, ease: 'power3.out', clearProps: 'transform,opacity' })
            .fromTo(featured.querySelector('.nr-media'), { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 1, ease: 'power3.inOut' }, '-=0.6')
            .from(featured.querySelectorAll('.nr-body > *'), { y: 24, opacity: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out', clearProps: 'transform,opacity' }, '-=0.6');
    }

    // Remaining cards rise in with a staggered 3D flip
    gsap.set(root.querySelectorAll('.nr-card:not(.nr-featured)'), { opacity: 0 });
    ScrollTrigger.batch(root.querySelectorAll('.nr-card:not(.nr-featured)'), {
        start: 'top 88%',
        once: true,
        onEnter: function (batch) {
            gsap.fromTo(batch,
                { y: 70, opacity: 0, rotateX: 14, transformOrigin: '50% 100%' },
                { y: 0, opacity: 1, rotateX: 0, duration: 0.9, stagger: 0.14, ease: 'power3.out', clearProps: 'transform,opacity' });
        }
    });
    // Gentle parallax drift on the featured image while scrolling
    if (featured) {
        gsap.fromTo(featured.querySelector('.nr-media'), { '--nr-drift': '-18px' }, {
            '--nr-drift': '18px',
            ease: 'none',
            scrollTrigger: { trigger: featured, start: 'top bottom', end: 'bottom top', scrub: true }
        });
    }
})();
