/* ---- Act I: repeated panels, then land ----
   PANELS is one pass through the message; REPEATS is how many times
   it plays before redirecting (reduced-motion gets a single pass).
   The panels are literally duplicated into the page rather than
   looped by resetting scrollTop, so it's just normal scrolling —
   nothing fights the browser's momentum scroll on mobile. */

var stage   = document.getElementById('stage');
var skip    = document.getElementById('skip');
var social  = document.getElementById('social-cold');
var landing = document.getElementById('landing');
var fill    = document.getElementById('fill');
var status  = document.getElementById('status');
var site    = document.getElementById('site');

var calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* `small` can be a single string (same every repeat) or an array
   with one entry per repeat — if there are more repeats than
   entries, the last one keeps being reused. */
var PANELS = [
  { opening: true, text: 'Sisyphus', small: ['Scroll', 'Keep scrolling ;)'] },
  { text: 'Built on one principle. Consistency.', small: ['Scroll', 'Keep scrolling ;)'] },
  { text: 'Every iteration, indistinguishable from the last.', small: ['Scroll', 'Your compliance will be rewarded'] },
  { text: 'Progress you can depend on.', small: ['Scroll', 'Your compliance will be rewarded'] }
];
var REPEATS = calm ? 1 : 2;

function smallFor(panel, repeat) {
  if (!panel.small) return '';
  var text = Array.isArray(panel.small)
    ? panel.small[Math.min(repeat, panel.small.length - 1)]
    : panel.small;
  return '<small>' + text + '<span class="chev" aria-hidden="true">&#9662;</span></small>';
}

(function buildStage() {
  var html = '';
  for (var r = 0; r < REPEATS; r++) {
    for (var p = 0; p < PANELS.length; p++) {
      var panel = PANELS[p];
      html += '<section class="panel' + (panel.opening ? ' opening' : '') + '">' +
              panel.text + smallFor(panel, r) +
              '</section>';
    }
  }
  stage.innerHTML = html;
})();

var done = false;
var revealed = false;
var punchlineShown = false;
var revealTimer = null;
var tapHint = document.getElementById('tap-hint');

/* Watching for the last panel to come into view (rather than doing
   scrollTop/scrollHeight pixel math) sidesteps mobile quirks — svh
   rounding, the address bar resizing the viewport mid-scroll, and
   scroll-snap settling a few pixels short of the "true" end. */
var lastPanel = stage.lastElementChild;
new IntersectionObserver(function (entries) {
  entries.forEach(function (entry) {
    if (entry.isIntersecting) land();
  });
}, { root: stage, threshold: 0.85 }).observe(lastPanel);

skip.addEventListener('click', skipToSite);

function skipToSite() {
  if (done) return;
  done = true;
  stage.style.display = 'none';
  skip.style.display  = 'none';
  social.style.display = 'none';
  reveal();
}

function land() {
  if (done) return;
  done = true;
  stage.style.display = 'none';
  skip.style.display  = 'none';
  social.style.display = 'none';
  landing.classList.add('on');
  requestAnimationFrame(function () { fill.classList.add('go'); });

  setTimeout(function () {
    status.textContent = 'One must imagine Sisyphus happy.';
    status.className = 'punchline';
    punchlineShown = true;
    tapHint.classList.add('show');
    landing.style.cursor = 'pointer';
  }, calm ? 500 : 1800);

  revealTimer = setTimeout(reveal, calm ? 1500 : 3400);
}

function reveal() {
  if (revealed) return;
  revealed = true;
  clearTimeout(revealTimer);
  landing.classList.remove('on');
  site.classList.add('on');
  document.body.style.overflow = 'auto';
  orbit();
}

landing.addEventListener('click', function () {
  if (punchlineShown) reveal();
});

/* ---- the arc ----
   0deg points right, -90 is top, +90 is bottom, -135 is top-left.
   Sweeping 260deg clockwise from top-left ends past the bottom and
   leaves a gap on the left side of the circle open.
   The radius is measured from the container, so the discs stay in
   a circle at any width instead of collapsing into a row. */

var ARC_START = -135;
var ARC_SWEEP = 260;
var MIN_WIDTH = 430;      // below this the arc becomes a wrapped row

function orbit() {
  var hub = document.querySelector('.hub');
  var items = document.querySelectorAll('.orbit li');
  var core = document.querySelector('.core');
  var h1 = document.querySelector('.core h1');
  if (!hub) return;

  var w = hub.clientWidth;

  if (w < MIN_WIDTH) {                       // fall back to the row
    hub.classList.remove('arc');
    hub.style.minHeight = '';
    core.style.maxWidth = '';
    h1.style.fontSize = '';
    for (var j = 0; j < items.length; j++) items[j].style.transform = '';
    return;
  }

  hub.classList.add('arc');

  var disc = w < 620 ? 74 : 94;
  var r    = Math.min(300, (w - disc) / 2 - 8);

  hub.style.setProperty('--disc', disc + 'px');
  hub.style.setProperty('--r', r + 'px');
  hub.style.setProperty('--sun', (r * 1.85) + 'px');
  hub.style.minHeight = (2 * r + disc + 24) + 'px';

  /* keep the title inside the ring */
  var maxW = Math.min(330, 2 * (r - disc / 2 - 18));
  core.style.maxWidth = maxW + 'px';
  h1.style.fontSize = Math.min(52, maxW / 5.4) + 'px';

  var last = items.length - 1;
  for (var i = 0; i < items.length; i++) {
    var deg = last ? ARC_START + (i / last) * ARC_SWEEP : ARC_START;
    items[i].style.transform =
      'rotate(' + deg + 'deg) translate(' + r + 'px) rotate(' + (-deg) + 'deg)';
  }
}
addEventListener('resize', orbit);

/* ---- notebook tabs: intro / tracklist / journal / bibliography ---- */
var notebookTabs  = document.querySelectorAll('.notebook-tabs button');
var notebookPages = document.querySelectorAll('.notebook-pages .page');
var notebookTitle = document.getElementById('notebook-title');

function activateNotebookPage(name) {
  notebookTabs.forEach(function (b) { b.classList.toggle('active', b.dataset.page === name); });
  notebookPages.forEach(function (p) { p.classList.toggle('active', p.id === 'page-' + name); });
  if (notebookTitle) notebookTitle.textContent = name;
}

notebookTabs.forEach(function (b) {
  b.addEventListener('click', function () { activateNotebookPage(b.dataset.page); });
});

/* clicking a disc switches to the tracklist tab and opens that track's notes */
document.querySelectorAll('.orbit a').forEach(function (a) {
  a.addEventListener('click', function (e) {
    var li = document.querySelector(a.getAttribute('href'));
    if (!li) return;
    e.preventDefault();
    activateNotebookPage('tracklist');
    li.querySelector('details').open = true;
    li.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'center' });
  });
});

/* nav bar links jump down to the notebook and switch to the relevant tab */
var notebookSection = document.getElementById('tracklist');
function goToNotebookTab(name) {
  activateNotebookPage(name);
  notebookSection.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'start' });
}
var navTracklist = document.getElementById('nav-tracklist');
var navIntro = document.getElementById('nav-intro');
if (navTracklist) navTracklist.addEventListener('click', function (e) { e.preventDefault(); goToNotebookTab('tracklist'); });
if (navIntro) navIntro.addEventListener('click', function (e) { e.preventDefault(); goToNotebookTab('intro'); });

/* "collapse all" closes every open track's details */
var collapseAllBtn = document.getElementById('collapse-all');
if (collapseAllBtn) {
  collapseAllBtn.addEventListener('click', function () {
    document.querySelectorAll('#page-tracklist ol.tracks details[open]').forEach(function (d) {
      d.open = false;
    });
  });
}

/* ---- note history: a vertical slider beside each open note scrubs back
   through what it said in earlier commits (top = now, bottom = oldest).
   window.TRACK_HISTORY comes from track-history.js, generated at deploy
   by scripts/build-track-history.mjs; without it there's just no slider. */

/* must match songKey() in scripts/build-track-history.mjs */
function songKey(s) { return s.replace(/\s+/g, ' ').trim().toLowerCase(); }

function shortDate(iso) {   // 2026-09-24 -> 9/24/26, like the journal
  var p = iso.split('-');
  return (+p[1]) + '/' + (+p[2]) + '/' + p[0].slice(2);
}

if (window.TRACK_HISTORY) {
  document.querySelectorAll('#page-tracklist ol.tracks > li').forEach(function (li) {
    var summary  = li.querySelector('summary');
    var liveNote = li.querySelector('.note');
    if (!summary || !liveNote) return;

    var title = summary.cloneNode(true);
    title.querySelectorAll('.moved').forEach(function (m) { m.remove(); });
    var key = songKey(li.dataset.song || title.textContent);

    /* drop the newest committed version if it's what the page already shows */
    var past = (TRACK_HISTORY[key] || []).slice();
    var newest = past[past.length - 1];
    if (newest) {
      var probe = document.createElement('div');
      probe.innerHTML = newest.html;
      if (songKey(probe.textContent) === songKey(liveNote.textContent)) past.pop();
    }
    if (!past.length) return;

    var row = document.createElement('div');
    row.className = 'note-row';
    liveNote.parentNode.insertBefore(row, liveNote);
    row.appendChild(liveNote);

    var oldNote = document.createElement('div');
    oldNote.className = 'note past';
    oldNote.hidden = true;
    row.appendChild(oldNote);

    var last = past.length;   // slider index `last` = the live note
    var timeline = document.createElement('div');
    timeline.className = 'timeline';
    timeline.innerHTML =
      '<span class="tl-end">now</span>' +
      '<input type="range" min="0" max="' + last + '" step="1" value="' + last + '">' +
      '<span class="tl-end">' + shortDate(past[0].date) + '</span>';
    row.appendChild(timeline);

    var slider  = timeline.querySelector('input');
    var asOf    = document.createElement('p');
    asOf.className = 'as-of';
    slider.setAttribute('aria-label', 'note history for ' + title.textContent.trim());

    function show(i) {
      var isNow = i === last;
      liveNote.hidden = !isNow;
      oldNote.hidden = isNow;
      slider.setAttribute('aria-valuetext', isNow ? 'now' : shortDate(past[i].date));
      if (isNow) return;
      oldNote.innerHTML = past[i].html;
      if (window.Nutshell) Nutshell.convertLinksToExpandables(oldNote);
      asOf.textContent = 'as of ' + shortDate(past[i].date);
      oldNote.insertBefore(asOf, oldNote.firstChild);
    }
    slider.addEventListener('input', function () { show(+slider.value); });
    show(last);
  });
}

/* unreleased preview of untitled xiii in the retro player window —
   the LCD mirrors the widget's state, and the track rewinds when it
   ends instead of moving on to anything else on soundcloud */
var scFrame = document.getElementById('sc-preview');
if (scFrame && window.SC) {
  var scWidget = SC.Widget(scFrame);
  var player   = document.getElementById('preview-player');
  var lcdState = document.getElementById('lcd-state');
  var lcdTime  = document.getElementById('lcd-time');

  function setPlaying(on) {
    player.classList.toggle('playing', on);
    lcdState.innerHTML = on ? '&#9654; PLAYING' : '&#10074;&#10074; PAUSED';
  }
  function clock(ms) {
    var s = Math.floor(ms / 1000);
    return ('0' + Math.floor(s / 60)).slice(-2) + ':' + ('0' + (s % 60)).slice(-2);
  }

  scWidget.bind(SC.Widget.Events.PLAY,  function () { setPlaying(true); });
  scWidget.bind(SC.Widget.Events.PAUSE, function () { setPlaying(false); });
  scWidget.bind(SC.Widget.Events.PLAY_PROGRESS, function (e) {
    lcdTime.textContent = clock(e.currentPosition);
  });
  scWidget.bind(SC.Widget.Events.FINISH, function () {
    scWidget.pause();
    scWidget.seekTo(0);
    player.classList.remove('playing');
    lcdState.innerHTML = '&#9632; STOPPED';
    lcdTime.textContent = '00:00';
  });
}
