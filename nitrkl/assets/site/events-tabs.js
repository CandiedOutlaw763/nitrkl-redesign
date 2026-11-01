/* NIT Rourkela homepage: Events / Seminars tabs in the Upcoming Events card (see events-tabs.css).
   Switching tabs swaps the visible ticker and points "View ALL" at that list's own page. */
(function () {
  'use strict';

  var tabs = Array.prototype.slice.call(document.querySelectorAll('.item-event .event-tabs [role="tab"]'));
  var allLink = document.getElementById('eventsAllLink');
  if (!tabs.length) return;

  function select(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      var panel = document.getElementById(t.getAttribute('aria-controls'));
      if (panel) panel.setAttribute('aria-hidden', String(!on));
    });
    if (allLink) {
      var seminars = tab.id === 'tabSeminars';
      allLink.href = allLink.getAttribute(seminars ? 'data-seminars-href' : 'data-events-href');
      allLink.setAttribute('aria-label', seminars ? 'View all seminars' : 'View all events');
    }
    if (focus) tab.focus();
  }

  // Notice Board: its "View all" follows the open tab too (the tabs there are Bootstrap's)
  var noticesAll = document.getElementById('noticesAllLink');
  if (noticesAll) {
    document.querySelectorAll('#nav-tab [data-bs-toggle="tab"]').forEach(function (b) {
      b.addEventListener('shown.bs.tab', function () {
        var recruitment = b.id === 'nav-profile-tab';
        noticesAll.href = noticesAll.getAttribute(recruitment ? 'data-recruitment-href' : 'data-announcement-href');
        noticesAll.setAttribute('aria-label', recruitment ? 'View all recruitment' : 'View all announcements');
      });
    });
  }

  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { select(tab); });
    tab.addEventListener('keydown', function (e) {
      var next = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : null;
      if (next === null) return;
      e.preventDefault();
      select(tabs[(next + tabs.length) % tabs.length], true);
    });
  });
})();
