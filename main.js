// ─── PREFERENCIA DE MOVIMIENTO REDUCIDO ────────────────
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ─── LOADER / PANTALLA DE CARGA ────────────────────────
// No es un temporizador inventado: dura lo que tarda la página en estar
// realmente lista (con un mínimo para que no sea un parpadeo y un tope
// máximo por seguridad), así no le resta tiempo artificial al LCP real.
(function () {
  const loader     = document.getElementById('loader');
  const countEl    = document.getElementById('loaderCount');
  const fillEl     = document.getElementById('loaderFill');
  const nameWrap   = document.querySelector('.loader-name-wrap');
  if (!loader) return;

  document.body.style.overflow = 'hidden';

  const ANIM_DURATION = 700;  // ms: ritmo visual del conteo 0→100
  const MIN_VISIBLE   = 400;  // ms: mínimo para que se perciba el efecto
  const MAX_WAIT      = 1400; // ms: tope por si algo tarda mucho en cargar
  const start = performance.now();

  let pageReady = document.readyState === 'complete';
  if (!pageReady) {
    window.addEventListener('load', () => { pageReady = true; }, { once: true });
  }

  // La barra y las letras las anima el propio CSS (transition) a partir de
  // una sola clase/ancho fijado aquí; JS solo se encarga del número, que
  // sí necesita texto dinámico. Evita escribir el DOM en cada frame.
  requestAnimationFrame(() => {
    if (fillEl) fillEl.style.width = '100%';
    if (nameWrap) nameWrap.classList.add('show');
  });

  function tick(now) {
    const elapsed = now - start;
    const t     = Math.min(elapsed / ANIM_DURATION, 1);
    const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    const count = Math.floor(eased * 100);

    countEl.textContent = String(count).padStart(2, '0');

    if (t < 1) {
      setTimeout(() => requestAnimationFrame(tick), 50);
    } else {
      countEl.textContent = '100';
      waitForReadyThenExit();
    }
  }

  // Una vez terminado el conteo visual, solo falta que la página esté
  // realmente cargada (o llegar al tope máximo) para poder salir.
  function waitForReadyThenExit() {
    const elapsed = performance.now() - start;
    if ((pageReady && elapsed >= MIN_VISIBLE) || elapsed >= MAX_WAIT) {
      exitLoader();
    } else {
      setTimeout(waitForReadyThenExit, 50);
    }
  }

  function exitLoader() {
    loader.classList.add('exit');
    document.body.style.overflow = '';
    setTimeout(() => loader.remove(), 800);
  }

  requestAnimationFrame(tick);
})();


// ─── BARRA DE PROGRESO DE SCROLL ───────────────────────
const progressBar = document.getElementById('scrollProgress');
function updateProgress() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  if (progressBar && max > 0) {
    progressBar.style.width = ((window.scrollY / max) * 100) + '%';
  }
}

// ─── ESTADO DEL NAV AL HACER SCROLL ───────────────────
const nav = document.querySelector('.nav');
function updateNav() {
  nav.classList.toggle('scrolled', window.scrollY > 20);
}

// ─── MENÚ MOBILE (HAMBURGUESA) ─────────────────────────
(function () {
  const toggle = document.getElementById('navToggle');
  const menu   = document.getElementById('navLinks');
  if (!toggle || !menu) return;

  function closeMenu() {
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Abrir menú de navegación');
    menu.classList.remove('open');
    document.body.classList.remove('nav-open');
  }
  function openMenu() {
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Cerrar menú de navegación');
    menu.classList.add('open');
    document.body.classList.add('nav-open');
  }

  toggle.addEventListener('click', () => {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    isOpen ? closeMenu() : openMenu();
  });
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
})();

// ─── PARALLAX DEL HERO (activo tras las animaciones) ───
const heroContent = document.querySelector('.hero-content');
const heroVisual  = document.querySelector('.hero-visual');
let parallaxReady = false;
setTimeout(() => { parallaxReady = true; }, 1800);

function heroParallax() {
  if (!parallaxReady || prefersReducedMotion) return;
  const y = window.scrollY;
  // El texto se mueve más rápido que la foto → profundidad natural
  if (heroContent) heroContent.style.transform = `translateY(${y * 0.13}px)`;
  if (heroVisual)  heroVisual.style.transform  = `translateY(${y * 0.06}px)`;
}

// ─── UN SOLO LISTENER DE SCROLL ────────────────────────
window.addEventListener('scroll', () => {
  updateProgress();
  updateNav();
  heroParallax();
}, { passive: true });

// ─── APARICIÓN AL HACER SCROLL (IntersectionObserver) ──
const revealEls = document.querySelectorAll('[data-reveal]');
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const delay = parseInt(entry.target.dataset.delay || '0');
    setTimeout(() => {
      entry.target.classList.add('revealed');
      entry.target.querySelectorAll('[data-count]').forEach(countUp);
    }, delay);
    revealObs.unobserve(entry.target);
  });
}, { threshold: 0.12, rootMargin: '0px 0px -48px 0px' });

revealEls.forEach(el => revealObs.observe(el));

// ─── ANIMACIÓN DE CONTADOR PROGRESIVO ──────────────────
function countUp(el) {
  const target = parseInt(el.dataset.count);
  if (isNaN(target)) return;
  const duration = 1400;
  const start = performance.now();
  (function frame(now) {
    const t = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    el.textContent = Math.floor(ease * target);
    if (t < 1) requestAnimationFrame(frame);
    else el.textContent = target;
  })(start);
}

// ─── BOTÓN MAGNÉTICO ───────────────────────────────────
document.querySelectorAll('.magnetic').forEach(el => {
  if (prefersReducedMotion) return;
  el.addEventListener('mousemove', e => {
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left - r.width  / 2) * 0.18;
    const y = (e.clientY - r.top  - r.height / 2) * 0.18;
    el.style.transform = `translate(${x}px, ${y}px)`;
  });
  el.addEventListener('mouseleave', () => { el.style.transform = ''; });
});

// ─── SELECTOR INTERACTIVO DE PROYECTOS ─────────────────
(function () {
  const options = document.querySelectorAll('.proj-option');
  if (!options.length) return;

  function setActive(i) {
    options.forEach((el, j) => el.classList.toggle('active', j === i));
  }
  options.forEach((el, i) => el.addEventListener('click', () => setActive(i)));

  const selector = document.getElementById('projectsSelector');
  if (!selector) return;
  const io = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      options.forEach((el, i) => setTimeout(() => el.classList.add('visible'), 120 * i));
      io.disconnect();
    }
  }, { threshold: 0.2 });
  io.observe(selector);
})();

// ─── EFECTO HOVER EN EL TEXTO DEL FOOTER (solo con ratón) ──
(function () {
  const svg       = document.getElementById('footerTextSvg');
  const revealGrad = document.getElementById('hf-revealMask');
  const drawText   = document.getElementById('hf-draw');
  const outline    = document.getElementById('hf-outline');
  if (!svg || !revealGrad) return;

  // Animación de trazado al entrar el footer en el viewport (esta sí aplica en todos los dispositivos)
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        drawText && drawText.classList.add('hf-animate');
        io.disconnect();
      }
    }, { threshold: 0.3 });
    io.observe(svg);
  }

  // El seguimiento del cursor solo tiene sentido con ratón: en touch no hay hover
  // y mantenía un requestAnimationFrame corriendo para siempre en cada visita.
  if (!window.matchMedia('(pointer: fine)').matches || prefersReducedMotion) return;

  const VW = 1000, VH = 110; // coincide con el viewBox del SVG
  let targetCx = VW / 2, targetCy = VH / 2;
  let currentCx = VW / 2, currentCy = VH / 2;
  let looping = false;

  function loop() {
    currentCx += (targetCx - currentCx) * 0.1;
    currentCy += (targetCy - currentCy) * 0.1;
    revealGrad.setAttribute('cx', currentCx.toFixed(1));
    revealGrad.setAttribute('cy', currentCy.toFixed(1));
    // Se detiene solo al converger, en vez de correr para siempre
    if (Math.abs(targetCx - currentCx) > 0.05 || Math.abs(targetCy - currentCy) > 0.05) {
      requestAnimationFrame(loop);
    } else {
      looping = false;
    }
  }
  function ensureLoop() {
    if (!looping) { looping = true; requestAnimationFrame(loop); }
  }

  svg.addEventListener('mouseenter', () => {
    if (outline) outline.style.opacity = '0.7';
  });
  svg.addEventListener('mouseleave', () => {
    if (outline) outline.style.opacity = '0';
  });
  svg.addEventListener('mousemove', (e) => {
    const r = svg.getBoundingClientRect();
    targetCx = ((e.clientX - r.left)  / r.width)  * VW;
    targetCy = ((e.clientY - r.top)   / r.height) * VH;
    ensureLoop();
  });
})();

// ─── BRILLO DEL CURSOR (solo escritorio) ───────────────
if (window.matchMedia('(pointer: fine)').matches && !prefersReducedMotion) {
  const glow = Object.assign(document.createElement('div'), {
    style: `position:fixed;pointer-events:none;z-index:9998;
            width:340px;height:340px;border-radius:50%;
            background:radial-gradient(circle,rgba(255,92,38,0.06) 0%,transparent 70%);
            transform:translate(-50%,-50%);`
  });
  document.body.appendChild(glow);
  let mx = 0, my = 0, cx = 0, cy = 0;
  window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
  (function loop() {
    cx += (mx - cx) * 0.08;
    cy += (my - cy) * 0.08;
    glow.style.left = cx + 'px';
    glow.style.top  = cy + 'px';
    requestAnimationFrame(loop);
  })();
}

// ─── PROXIMIDAD DEL CURSOR AL TEXTO DEL HERO ───────────
(function () {
  const heroTitle = document.querySelector('.hero-title');
  if (!heroTitle || !window.matchMedia('(pointer: fine)').matches || prefersReducedMotion) return;

  // Envolver recursivamente cada carácter en un span .tcp-l, preservando el árbol del DOM
  function wrapChars(el) {
    Array.from(el.childNodes).slice().forEach(node => {
      if (node.nodeType === 3) { // text node
        const frag = document.createDocumentFragment();
        node.textContent.split(' ').forEach((word, i) => {
          if (i > 0) frag.appendChild(document.createTextNode(' '));
          if (!word) return;
          // Agrupar las letras de cada palabra para que el salto de línea
          // solo pueda ocurrir en los espacios, nunca dentro de una palabra.
          const wordWrap = document.createElement('span');
          wordWrap.className = 'tcp-w';
          [...word].forEach(ch => {
            const s = document.createElement('span');
            s.className = 'tcp-l';
            s.textContent = ch;
            wordWrap.appendChild(s);
          });
          frag.appendChild(wordWrap);
        });
        el.replaceChild(frag, node);
      } else if (node.nodeType === 1) {
        wrapChars(node);
      }
    });
  }

  document.querySelectorAll('.hero-title .line').forEach(wrapChars);

  const letters = Array.from(heroTitle.querySelectorAll('.tcp-l'));
  const RADIUS  = 150;
  const WHITE   = [255, 255, 255];
  const ORANGE  = [255, 92,  38 ];
  const PEACH   = [255, 209, 160];

  let mx = -9999, my = -9999;
  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

  // Caída gaussiana: efecto completo a distancia 0, se atenúa hasta 0 en ~RADIO
  function proximity(d) {
    return Math.exp(-Math.pow(d / (RADIUS * 0.5), 2) / 2);
  }

  // Permitir que las letras escaladas desborden el clip de .line tras las animaciones de entrada
  setTimeout(() => {
    document.querySelectorAll('.hero-title .line').forEach(l => {
      l.style.overflow = 'visible';
    });
  }, 2200);

  (function tick() {
    letters.forEach(l => {
      const r  = l.getBoundingClientRect();
      const cx = r.left + r.width  / 2;
      const cy = r.top  + r.height / 2;
      const p  = proximity(Math.hypot(mx - cx, my - cy));

      l.style.transform = `scale(${(1 + p * 0.28).toFixed(3)})`;

      const isAccent = !!l.closest('.accent');
      const from = isAccent ? ORANGE : WHITE;
      const to   = isAccent ? PEACH  : ORANGE;
      l.style.color = `rgb(${
        Math.round(from[0] + (to[0] - from[0]) * p)},${
        Math.round(from[1] + (to[1] - from[1]) * p)},${
        Math.round(from[2] + (to[2] - from[2]) * p)})`;
    });
    requestAnimationFrame(tick);
  })();
})();
