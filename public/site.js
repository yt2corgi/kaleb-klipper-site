/* Kaleb Klipper site: starfield + live version stamp + theme preview.
   The starfield is the app's, verbatim physics: stars drift slowly,
   wrap at the edges, and fade fully out and back in. Tiny solid dots,
   zero glow. Static when the visitor prefers reduced motion. */

(() => {
  const canvas = document.getElementById('bg-stars');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ACCENT = '166, 255, 23';
  let stars = [];
  let w = 0;
  let h = 0;
  let last = performance.now();
  let raf = 0;

  const makeStar = () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    r: 0.6 + Math.random() * 1.5,
    vx: (Math.random() - 0.5) * 9,     // px per second, a slow drift
    vy: (Math.random() - 0.5) * 9,
    phase: Math.random() * Math.PI * 2,
    speed: 0.25 + Math.random() * 0.8, // twinkle rate
    tinted: Math.random() < 0.28       // most stars white, some lime
  });

  const resize = () => {
    const dpr = window.devicePixelRatio || 1;
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Existing stars keep their spots; only the population adjusts.
    const count = Math.max(50, Math.min(170, Math.round((w * h) / 11000)));
    while (stars.length < count) stars.push(makeStar());
    if (stars.length > count) stars.length = count;
    if (reduced) drawStatic();
  };

  const drawStatic = () => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(235, 235, 245, 0.25)';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const frame = (now) => {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    ctx.clearRect(0, 0, w, h);
    const t = now / 1000;
    for (const s of stars) {
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.x < -4) s.x = w + 4;
      else if (s.x > w + 4) s.x = -4;
      if (s.y < -4) s.y = h + 4;
      else if (s.y > h + 4) s.y = -4;
      // Fade fully out and back in.
      const a = Math.max(0, Math.sin(t * s.speed + s.phase)) * 0.55;
      if (a < 0.01) continue;
      ctx.fillStyle = `rgba(${s.tinted ? ACCENT : '235, 235, 245'}, ${a.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', () => {
    if (reduced) return;
    if (document.hidden) cancelAnimationFrame(raf);
    else { last = performance.now(); raf = requestAnimationFrame(frame); }
  });

  resize();
  if (!reduced) raf = requestAnimationFrame(frame);
})();

/* Stamp the real version + size and point download links at the newest
   installer. Production reads the GitHub release (that is where installers
   live; they are too big for the repo); local `npm start` falls back to the
   Express /api/latest. */
(() => {
  const apply = (version, sizeBytes, url) => {
    document.querySelectorAll('#dl-version, .js-version').forEach((el) => { el.textContent = version; });
    const sizeEl = document.getElementById('dl-size');
    if (sizeEl && sizeBytes) sizeEl.textContent = ' · ' + Math.round(sizeBytes / 1048576) + ' MB';
    if (url) document.querySelectorAll('a[href="/download"]').forEach((a) => { a.href = url; });
  };
  fetch('https://api.github.com/repos/yt2corgi/kaleb-klipper-site/releases/latest')
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error('no release'))))
    .then((rel) => {
      const exe = (rel.assets || []).find((a) => a.name.endsWith('.exe'));
      if (!exe) throw new Error('no exe asset');
      apply(rel.tag_name.replace(/^v/, ''), exe.size, exe.browser_download_url);
    })
    .catch(() => fetch('/api/latest')
      .then((r) => (r.ok ? r.json() : null))
      .then((info) => { if (info && info.version) apply(info.version, info.size, null); })
      .catch(() => {}));
})();

/* Theme preview: tap a dot, see a real screenshot of the app in that color. */
(() => {
  const shot = document.getElementById('theme-shot');
  const dots = document.querySelectorAll('.theme-dot[data-theme]');
  const nameEl = document.getElementById('theme-name');
  if (!shot || !dots.length) return;
  // Warm the cache so the first tap doesn't flash.
  for (const d of dots) { new Image().src = `/assets/shot-theme-${d.dataset.theme}.webp`; }
  for (const d of dots) {
    d.addEventListener('click', () => {
      shot.src = `/assets/shot-theme-${d.dataset.theme}.webp`;
      dots.forEach((x) => x.classList.toggle('active', x === d));
      if (nameEl) nameEl.textContent = d.title;
    });
  }
})();
