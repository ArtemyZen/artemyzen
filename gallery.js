(() => {
  const disciplines = [
    ['games', 'Games', '#b8d68b'],
    ['personal-music', 'Music', '#af98e8'],
    ['tools', 'Audio tools', '#e9a26b'],
    ['audio', 'Sound design', '#8dbfd4'],
    ['installations', 'Installations', '#e5a3bf']
  ];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = reduced.matches;
  const worlds = document.querySelector('.worlds');
  const items = disciplines.map(([id, title, color], i) => {
    const world = document.createElement('div');
    world.className = 'world';
    world.style.setProperty('--world-color', color);
    world.innerHTML = `<div class="object-space" aria-hidden="true"><div class="solid">${'<div class="face"></div>'.repeat(6)}</div></div><a class="world-label" href="#${id}"><span>0${i + 1} / EXPLORE</span><strong>${title}</strong></a>`;
    worlds.append(world);
    const item = { el: world.querySelector('.solid'), x: -22 + i * 3, y: 30 + i * 15, drag: null };
    const space = world.querySelector('.object-space');
    space.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      item.drag = { x: e.clientX, y: e.clientY, moved: false };
      space.setPointerCapture(e.pointerId);
    });
    space.addEventListener('pointermove', e => {
      if (!item.drag) return;
      const dx = e.clientX - item.drag.x;
      const dy = e.clientY - item.drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 3) item.drag.moved = true;
      item.y += dx * .6; item.x -= dy * .4;
      item.drag.x = e.clientX; item.drag.y = e.clientY;
      paint(item);
    });
    space.addEventListener('pointerup', () => {
      const open = item.drag && !item.drag.moved;
      item.drag = null;
      if (open) location.hash = id;
    });
    space.addEventListener('pointercancel', () => item.drag = null);
    space.addEventListener('lostpointercapture', () => item.drag = null);
    return item;
  });
  function paint(item) { item.el.style.transform = `rotateX(${item.x}deg) rotateY(${item.y}deg)`; }
  const motionButton = document.querySelector('#motion-toggle');
  function updateMotion() {
    motionButton.textContent = paused ? 'Resume motion ▷' : 'Pause motion Ⅱ';
    motionButton.setAttribute('aria-pressed', String(paused));
  }
  motionButton.addEventListener('click', () => { paused = !paused; updateMotion(); });
  reduced.addEventListener('change', () => { paused = reduced.matches; updateMotion(); });
  updateMotion();
  let visible = true;
  new IntersectionObserver(entries => visible = entries[0].isIntersecting).observe(worlds);
  let last = 0;
  function frame(time) {
    const delta = Math.min((time - last) / 1000, .05); last = time;
    if (!paused && visible && !document.hidden) items.forEach((item, i) => {
      if (!item.drag) { item.y += delta * (7 + i); paint(item); }
    });
    requestAnimationFrame(frame);
  }
  items.forEach(paint); requestAnimationFrame(frame);
  const sectionIds = disciplines.map(d => d[0]);
  const sections = sectionIds.map(id => document.getElementById(id));
  // Preserve the existing archive and its deep links; filtering only changes visibility.
  const root = document.querySelector('.crt-frame');
  const contact = document.querySelector('.about-contact');
  sections.forEach(section => root.insertBefore(section, contact));
  document.querySelector('#audio h2').textContent = 'Sound design';
  document.querySelector('#personal-music h2').textContent = 'Music';
  document.querySelector('#tools h2').textContent = 'Audio tools';
  const legacyHero = document.querySelector('.hero');
  legacyHero.id = 'legacy-intro';
  document.querySelector('.universe').id = 'top';
  function showFromHash() {
    const id = location.hash.slice(1);
    const selected = sectionIds.includes(id);
    sections.forEach(section => {
      section.hidden = selected && section.id !== id;
      if (section.hidden) section.querySelectorAll('video').forEach(video => video.pause());
      section.querySelectorAll('iframe').forEach(frame => {
        if (section.hidden && frame.hasAttribute('src')) {
          frame.dataset.savedSrc = frame.getAttribute('src');
          frame.removeAttribute('src');
        } else if (!section.hidden && frame.dataset.savedSrc) {
          frame.src = frame.dataset.savedSrc;
          delete frame.dataset.savedSrc;
        }
      });
    });
    document.querySelectorAll('.discipline-nav a').forEach(link => {
      if (link.hash === location.hash) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
    document.querySelector('#signal-game').hidden = selected && id !== 'games';
    if (id === 'games') window.dispatchEvent(new Event('resize'));
    if (selected) requestAnimationFrame(() => document.getElementById(id).scrollIntoView({ behavior: reduced.matches ? 'instant' : 'smooth', block: 'start' }));
  }
  document.querySelector('#view-all').addEventListener('click', () => { location.hash = 'collection'; });
  window.addEventListener('hashchange', showFromHash);
  showFromHash();
})();
