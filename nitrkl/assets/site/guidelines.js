/* NIT Rourkela homepage: GIGW 3.0 and DBIM 3.0 behaviours (see guidelines.css).
   1. Moving content can be paused (GIGW 3.0 Accessibility 25, WCAG 2.2.2): the Notice Board and
      Events & Seminars lists, the NIRF carousel and the Latest News ticker each get a pause/play
      button, pause on hover and keyboard focus, and start paused under prefers-reduced-motion.
   2. Cookie consent (DBIM 7.6): a banner at the foot of the page to accept, reject or customise
      non-essential cookies; the choice is kept in an essential cookie with an expiry date.
   3. Names for the NIRF carousel's dot buttons; consent recorded when Hindi or Odia is chosen in
      the header. The Latest News story rotation has its own controls (newsroom.js). */
(function () {
  'use strict';

  var doc = document;
  var $ = function (sel, ctx) { return (ctx || doc).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------
     Pause / play button
     --------------------------------------------------------------- */
  function pauseButton(label, onToggle, startPaused) {
    var b = doc.createElement('button');
    b.type = 'button';
    b.className = 'gg-pause';
    function set(paused) {
      b.setAttribute('aria-pressed', String(paused));
      b.setAttribute('aria-label', (paused ? 'Play ' : 'Pause ') + label);
      b.title = (paused ? 'Play ' : 'Pause ') + label;
      b.innerHTML = '<i class="bi ' + (paused ? 'bi-play-fill' : 'bi-pause-fill') + '" aria-hidden="true"></i>';
    }
    set(startPaused);
    b.addEventListener('click', function () {
      var paused = b.getAttribute('aria-pressed') !== 'true';
      set(paused);
      onToggle(paused);
    });
    return b;
  }

  /* ---------------------------------------------------------------
     List ticker: every few seconds the first item slides away and rejoins at the end.
     Stops while the user has paused it, while hovered and while anything inside has focus.
     --------------------------------------------------------------- */
  function ticker(list, itemSel, ms) {
    var timer = null, userPaused = reduced, hover = false, focus = false;
    function step() {
      var first = $(itemSel, list);
      if (!first || list.children.length < 2) return;
      var h = first.getBoundingClientRect().height;
      first.style.transition = 'margin-top .45s ease';
      first.style.marginTop = -h + 'px';
      setTimeout(function () {
        first.style.transition = 'none';
        first.style.marginTop = '';
        list.appendChild(first);
      }, 470);
    }
    function sync() {
      var run = !userPaused && !hover && !focus;
      if (run && !timer) timer = setInterval(step, ms);
      if (!run && timer) { clearInterval(timer); timer = null; }
    }
    list.addEventListener('mouseenter', function () { hover = true; sync(); });
    list.addEventListener('mouseleave', function () { hover = false; sync(); });
    list.addEventListener('focusin', function () { focus = true; sync(); });
    list.addEventListener('focusout', function (e) { if (!list.contains(e.relatedTarget)) { focus = false; sync(); } });
    sync();
    return { pause: function (p) { userPaused = p; sync(); } };
  }

  var notices = $('.item-notice .scrollgroup');
  if (notices) {
    var tn = ticker(notices, '.scrollitem', 3000);
    var nHead = $('.item-notice .nb-head');
    if (nHead) nHead.insertBefore(pauseButton('scrolling announcements', tn.pause, reduced), $('.nb-all', nHead));
  }

  var evLists = $$('.item-event .event-scroll');
  if (evLists.length) {
    var te = evLists.map(function (ul) { return ticker(ul, 'li', 3000); });
    var eHead = $('.item-event .nb-head');
    if (eHead) eHead.insertBefore(pauseButton('scrolling events and seminars', function (p) { te.forEach(function (t) { t.pause(p); }); }, reduced), $('.nb-all', eHead));
  }

  /* NIRF carousel (Owl Carousel, autoplay set in custome-script.js) */
  var nirf = $('#nirfSection .admissions-slider');
  var nirfHead = $('#nirfSection .placement-title-wrap');
  if (nirf && nirfHead && window.jQuery) {
    var owlPause = function (p) { window.jQuery(nirf).trigger(p ? 'stop.owl.autoplay' : 'play.owl.autoplay', [4000]); };
    nirfHead.appendChild(pauseButton('NIRF ranking carousel', owlPause, reduced));
    if (reduced) window.addEventListener('load', function () { owlPause(true); });
  }

  /* Latest News headline ticker (a CSS animation) */
  var nrTicker = $('.nr-ticker');
  if (nrTicker) {
    var setNr = function (p) { nrTicker.classList.toggle('is-paused', p); };
    nrTicker.appendChild(pauseButton('news headlines', setNr, reduced));
    setNr(reduced);
  }

  /* ---------------------------------------------------------------
     Cookie consent (DBIM 7.6, Digital Personal Data Protection Act, 2023)
     --------------------------------------------------------------- */
  var NAME = 'nitrkl_consent';
  function readConsent() {
    var m = doc.cookie.match(new RegExp('(?:^|; )' + NAME + '=([^;]*)'));
    if (!m) return null;
    try { return JSON.parse(decodeURIComponent(m[1])); } catch (e) { return null; }
  }
  function saveConsent(c) {
    c.date = new Date().toISOString().slice(0, 10);
    // An essential, persistent cookie: it remembers the choice for 180 days
    doc.cookie = NAME + '=' + encodeURIComponent(JSON.stringify(c)) + '; max-age=' + (180 * 24 * 3600) + '; path=/; SameSite=Lax';
    window.nitrklConsent = c;
    doc.dispatchEvent(new CustomEvent('nitrkl:consent', { detail: c }));
  }
  window.nitrklConsent = readConsent();

  function banner() {
    var current = readConsent() || { functional: false, analytics: false };
    var el = doc.createElement('section');
    el.className = 'gg-consent';
    el.setAttribute('role', 'region');
    el.setAttribute('aria-labelledby', 'ggConsentTitle');
    el.innerHTML =
      '<div class="gg-consent-inner">' +
        '<div class="gg-consent-text">' +
          '<h2 id="ggConsentTitle">Cookies on this website</h2>' +
          '<p>We use essential cookies to make this website work, for example to remember your language and accessibility settings. ' +
          'With your consent we would also use cookies to remember your choices and to understand how the website is used. ' +
          '<a href="/Home/PrivacyPolicy/">Read the Privacy Policy</a>.</p>' +
        '</div>' +
        '<form class="gg-consent-prefs" id="ggConsentPrefs" hidden>' +
          '<fieldset><legend>Choose which cookies to allow</legend>' +
            '<label><input type="checkbox" checked disabled> Essential (always on): language, accessibility and this cookie choice</label>' +
            '<label><input type="checkbox" name="functional"' + (current.functional ? ' checked' : '') + '> Functional: remember previous searches and choices</label>' +
            '<label><input type="checkbox" name="analytics"' + (current.analytics ? ' checked' : '') + '> Analytics: anonymous statistics on how the website is used</label>' +
          '</fieldset>' +
        '</form>' +
        '<div class="gg-consent-actions">' +
          '<button type="button" class="gg-btn gg-btn--solid" data-consent="accept">Accept all</button>' +
          '<button type="button" class="gg-btn" data-consent="reject">Reject non-essential</button>' +
          '<button type="button" class="gg-btn gg-btn--link" data-consent="customise" aria-expanded="false" aria-controls="ggConsentPrefs">Customise</button>' +
        '</div>' +
      '</div>';
    doc.body.appendChild(el);
    var prefs = $('#ggConsentPrefs', el);
    var custom = $('[data-consent="customise"]', el);
    function close() { el.remove(); }
    $('[data-consent="accept"]', el).addEventListener('click', function () { saveConsent({ functional: true, analytics: true }); close(); });
    $('[data-consent="reject"]', el).addEventListener('click', function () { saveConsent({ functional: false, analytics: false }); close(); });
    custom.addEventListener('click', function () {
      if (prefs.hidden) {
        prefs.hidden = false;
        custom.setAttribute('aria-expanded', 'true');
        custom.textContent = 'Save choices';
        $('input[name="functional"]', prefs).focus();
      } else {
        saveConsent({ functional: $('input[name="functional"]', prefs).checked, analytics: $('input[name="analytics"]', prefs).checked });
        close();
      }
    });
    return el;
  }

  if (!window.nitrklConsent) banner();

  // "Cookie settings" in the footer reopens the banner
  var policies = $('.site-footer .f-bottom ul');
  if (policies) {
    var li = doc.createElement('li');
    var a = doc.createElement('button');
    a.type = 'button';
    a.className = 'gg-cookie-settings';
    a.textContent = 'Cookie Settings';
    a.addEventListener('click', function () {
      var open = $('.gg-consent');
      var el = open || banner();
      var btn = $('[data-consent="customise"]', el);
      if (btn && btn.getAttribute('aria-expanded') !== 'true') btn.click();
    });
    li.appendChild(a);
    policies.appendChild(li);
  }

  /* ---------------------------------------------------------------
     Choosing Hindi or Odia in the header's language menu is consent to the Google Translate
     (functional) cookie, as the note in that menu says; any analytics choice is kept (header.js)
     --------------------------------------------------------------- */
  window.nitrklAllowFunctional = function () {
    var c = readConsent() || { functional: false, analytics: false };
    if (c.functional) return;
    saveConsent({ functional: true, analytics: !!c.analytics });
    var open = $('.gg-consent');
    if (open) open.remove();
  };

  /* ---------------------------------------------------------------
     Preferred language before entering the site (GIGW 3.0 guideline 5.4.10): a one-time dialog
     offering English, Hindi and Odia. Hindi/Odia switch the page through Google Translate, as the
     header's language menu does; English just closes it. The choice is remembered for a year.
     --------------------------------------------------------------- */
  function languageChooser() {
    var LANGS = [
      { code: 'en', label: 'English', lang: 'en' },
      { code: 'hi', label: 'हिन्दी', lang: 'hi' },
      { code: 'or', label: 'ଓଡ଼ିଆ', lang: 'or' }
    ];
    var opener = doc.activeElement;
    var backdrop = doc.createElement('div');
    backdrop.className = 'gg-lang-backdrop';
    var dlg = doc.createElement('div');
    dlg.className = 'gg-lang';
    dlg.setAttribute('role', 'dialog');
    dlg.setAttribute('aria-modal', 'true');
    dlg.setAttribute('aria-labelledby', 'ggLangTitle');
    dlg.setAttribute('aria-describedby', 'ggLangHelp');
    dlg.innerHTML =
      '<h2 id="ggLangTitle">Choose your language <span lang="hi">भाषा चुनें</span> <span lang="or">ଭାଷା ବାଛନ୍ତୁ</span></h2>' +
      '<p id="ggLangHelp">You can change it later from the अ | A menu at the top of every page.</p>' +
      '<div class="gg-lang-options">' +
      LANGS.map(function (l) { return '<button type="button" class="gg-btn' + (l.code === 'en' ? ' gg-btn--solid' : '') + '" data-lang-choice="' + l.code + '" lang="' + l.lang + '">' + l.label + '</button>'; }).join('') +
      '</div>';
    doc.body.appendChild(backdrop);
    doc.body.appendChild(dlg);
    var buttons = $$('button', dlg);

    function remember(code) {
      doc.cookie = 'nitrkl-lang=' + code + ';path=/;max-age=' + (365 * 24 * 3600) + ';SameSite=Lax';
    }
    function close() {
      doc.removeEventListener('keydown', onKey, true);
      dlg.remove();
      backdrop.remove();
      if (opener && opener.focus && opener !== doc.body) opener.focus(); else { var m = $('#main'); if (m) { m.setAttribute('tabindex', '-1'); m.focus({ preventScroll: true }); } }
    }
    function choose(code) {
      remember(code);
      if (code === 'en') { close(); return; }
      doc.cookie = 'googtrans=/en/' + code + ';path=/';
      location.reload();
    }
    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); choose('en'); return; }
      if (e.key !== 'Tab') return;
      var first = buttons[0], last = buttons[buttons.length - 1];
      if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
      else if (!dlg.contains(doc.activeElement)) { e.preventDefault(); first.focus(); }
    }
    buttons.forEach(function (b) { b.addEventListener('click', function () { choose(b.getAttribute('data-lang-choice')); }); });
    doc.addEventListener('keydown', onKey, true);
    buttons[0].focus();
  }
  var chosen = /(?:^|;\s*)nitrkl-lang=/.test(doc.cookie) || /googtrans=\/en\/\w+/.test(doc.cookie);
  if (!chosen) {
    if (doc.documentElement.classList.contains('intro-on')) doc.addEventListener('nitrkl:intro-done', languageChooser, { once: true });
    else languageChooser();
  }

  /* ---------------------------------------------------------------
     Links that leave for a non-government website (GIGW 3.0 Lifecycle 4): layout.js already asks
     for confirmation on click; screen reader users also hear it on focus, before activating
     --------------------------------------------------------------- */
  var extLinks = $$('a.outside-link');
  if (extLinks.length) {
    var notes = { tab: 'External website, opens in a new tab', same: 'External website' };
    Object.keys(notes).forEach(function (k) {
      var s = doc.createElement('span');
      s.id = 'ggExt-' + k;
      s.className = 'visually-hidden';
      s.textContent = notes[k];
      doc.body.appendChild(s);
    });
    extLinks.forEach(function (a) {
      var id = a.target === '_blank' ? 'ggExt-tab' : 'ggExt-same';
      var cur = a.getAttribute('aria-describedby');
      a.setAttribute('aria-describedby', cur ? cur + ' ' + id : id);
    });
  }

  /* ---------------------------------------------------------------
     NIRF carousel dots: Owl Carousel renders them as unnamed buttons (WCAG 4.1.2)
     --------------------------------------------------------------- */
  function nameDots() {
    $$('#nirfSection .owl-dot').forEach(function (d, i, all) {
      d.setAttribute('aria-label', 'Show ranking group ' + (i + 1) + ' of ' + all.length);
      d.setAttribute('aria-current', d.classList.contains('active') ? 'true' : 'false');
    });
  }
  if (nirf && window.jQuery) {
    window.jQuery(nirf).on('initialized.owl.carousel refreshed.owl.carousel changed.owl.carousel', function () { setTimeout(nameDots, 0); });
    window.addEventListener('load', nameDots);
    nameDots();
  }
})();
