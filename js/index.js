(() => {
  const nav = document.getElementById('sceneSelect');
  if (!nav) return;
  const scenes = Array.from(nav.querySelectorAll('.scene'));
  if (!scenes.length) return;

  function setActive(el) {
    scenes.forEach((s) => s.classList.toggle('is-active', s === el));
  }

  scenes.forEach((s) => {
    s.addEventListener('mouseenter', () => setActive(s));
    s.addEventListener('focus', () => setActive(s));
  });

  nav.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    let idx = scenes.indexOf(document.activeElement);
    if (idx === -1) idx = 0;
    else idx = e.key === 'ArrowDown'
      ? (idx + 1) % scenes.length
      : (idx - 1 + scenes.length) % scenes.length;
    scenes[idx].focus();
  });

  setActive(scenes[0]);
})();
