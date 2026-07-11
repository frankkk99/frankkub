(() => {
  const root = document.documentElement;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(pointer: coarse)').matches;
  let px = 0, py = 0, tx = 0, ty = 0, scrollY = window.scrollY;

  root.style.setProperty('--px', 0);
  root.style.setProperty('--py', 0);

  const scene = document.createElement('div');
  scene.id = 'depth-scene';
  scene.innerHTML = `
    <div class="depth-orb one"></div>
    <div class="depth-orb two"></div>
    <div class="depth-ring"></div>
    <div class="depth-grid"></div>
    <div class="depth-noise"></div>`;
  const hero = document.querySelector('.hero');
  if (hero) hero.prepend(scene);

  window.addEventListener('pointermove', (e) => {
    root.style.setProperty('--mx', `${e.clientX}px`);
    root.style.setProperty('--my', `${e.clientY}px`);
    tx = (e.clientX / innerWidth - 0.5) * 2;
    ty = (e.clientY / innerHeight - 0.5) * 2;
  }, { passive: true });

  window.addEventListener('scroll', () => {
    scrollY = window.scrollY;
    root.style.setProperty('--scrollY', scrollY.toFixed(1));
  }, { passive: true });

  function animateScene() {
    px += (tx - px) * 0.055;
    py += (ty - py) * 0.055;
    root.style.setProperty('--px', px.toFixed(3));
    root.style.setProperty('--py', py.toFixed(3));

    if (!reduceMotion && hero) {
      const grid = hero.querySelector('.hero-grid');
      if (grid) {
        const heroProgress = Math.max(0, Math.min(1, scrollY / Math.max(hero.offsetHeight, 1)));
        grid.style.transform = `rotateX(${py * -1.7}deg) rotateY(${px * 2.3}deg) translate3d(0,${heroProgress * 42}px,0)`;
      }
    }
    requestAnimationFrame(animateScene);
  }
  requestAnimationFrame(animateScene);

  const cards = [...document.querySelectorAll('.work-card')];
  if (!coarse && !reduceMotion) {
    cards.forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(1100px) rotateX(${-y * 10}deg) rotateY(${x * 13}deg) translate3d(0,-8px,38px)`;
        card.style.setProperty('--shine-x', `${(x + .5) * 100}%`);
        card.style.setProperty('--shine-y', `${(y + .5) * 100}%`);
      });
      card.addEventListener('pointerleave', () => {
        card.style.transform = 'perspective(1100px) rotateX(0) rotateY(0) translate3d(0,0,0)';
      });
    });
  }

  const photo = document.querySelector('.hero-photo-frame');
  if (photo && !coarse && !reduceMotion) {
    window.addEventListener('pointermove', () => {
      photo.style.transform = `perspective(1300px) rotateX(${py * -5}deg) rotateY(${px * 8}deg) translate3d(${px * 12}px,${py * 9}px,95px)`;
      const img = photo.querySelector('img');
      if (img) img.style.transform = `translate3d(${px * -7}px,${py * -5}px,35px) scale(1.035)`;
    }, { passive: true });
  }

  const depthEls = [...document.querySelectorAll('section:not(.hero), .stats-row')];
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting || reduceMotion) return;
      const el = entry.target;
      const rect = el.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const delta = (center - innerHeight / 2) / innerHeight;
      el.style.transform = `translateZ(${Math.max(-45, 30 - Math.abs(delta) * 70)}px)`;
    });
  }, { threshold: [0, .2, .5, .8, 1] });
  depthEls.forEach((el) => io.observe(el));

  const dockItems = document.querySelectorAll('.dock-item');
  const sections = [...document.querySelectorAll('section[id]')];
  if (dockItems.length && sections.length) {
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        dockItems.forEach((item) => item.classList.toggle('active', item.dataset.target === entry.target.id));
      });
    }, { rootMargin: '-40% 0px -50% 0px', threshold: 0 });
    sections.forEach((section) => sectionObserver.observe(section));
  }

  document.body.classList.add('immersive-ready');
})();
