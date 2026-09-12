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
   Sweeping 225deg clockwise from top-left ends at the bottom and
   leaves the left side of the circle open.
   The radius is measured from the container, so the discs stay in
   a circle at any width instead of collapsing into a row. */

var ARC_START = -135;
var ARC_SWEEP = 225;
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

  var disc = w < 620 ? 64 : 82;
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

/* "collapse all" closes every open track's details */
var collapseAllBtn = document.getElementById('collapse-all');
if (collapseAllBtn) {
  collapseAllBtn.addEventListener('click', function () {
    document.querySelectorAll('#page-tracklist ol.tracks details[open]').forEach(function (d) {
      d.open = false;
    });
  });
}
