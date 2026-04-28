// ─── LOADER ────────────────────────────────────────────
(function () {
  const loader   = document.getElementById('loader');
  const countEl  = document.getElementById('loaderCount');
  const fillEl   = document.getElementById('loaderFill');
  const chars    = document.querySelectorAll('.ln-c');
  if (!loader) return;

  document.body.style.overflow = 'hidden';

  const DURATION = 1400; // ms to count 0→100
  const start    = performance.now();
  const total    = chars.length;

  function tick(now) {
    const t        = Math.min((now - start) / DURATION, 1);
    const eased    = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    const count    = Math.floor(eased * 100);

    countEl.textContent = String(count).padStart(2, '0');
    fillEl.style.width  = count + '%';

    // Reveal name characters progressively
    chars.forEach((c, i) => {
      if (count >= Math.round(((i + 1) / total) * 100)) c.classList.add('show');
    });

    if (t < 1) {
      requestAnimationFrame(tick);
    } else {
      countEl.textContent = '100';
      chars.forEach(c => c.classList.add('show'));
      setTimeout(exitLoader, 280);
    }
  }

  function exitLoader() {
    loader.classList.add('exit');
    document.body.style.overflow = '';
    setTimeout(() => loader.remove(), 800);
  }

  requestAnimationFrame(tick);
})();


// ─── SCROLL PROGRESS BAR ───────────────────────────────
const progressBar = document.getElementById('scrollProgress');
function updateProgress() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  if (progressBar && max > 0) {
    progressBar.style.width = ((window.scrollY / max) * 100) + '%';
  }
}

// ─── NAV SCROLL STATE ──────────────────────────────────
const nav = document.querySelector('.nav');
function updateNav() {
  nav.classList.toggle('scrolled', window.scrollY > 20);
}

// ─── HERO PARALLAX (activated after entry animations) ──
const heroContent = document.querySelector('.hero-content');
const heroVisual  = document.querySelector('.hero-visual');
let parallaxReady = false;
setTimeout(() => { parallaxReady = true; }, 1800);

function heroParallax() {
  if (!parallaxReady) return;
  const y = window.scrollY;
  // Text moves faster than photo → natural depth
  if (heroContent) heroContent.style.transform = `translateY(${y * 0.13}px)`;
  if (heroVisual)  heroVisual.style.transform  = `translateY(${y * 0.06}px)`;
}

// ─── SINGLE SCROLL LISTENER ────────────────────────────
window.addEventListener('scroll', () => {
  updateProgress();
  updateNav();
  heroParallax();
}, { passive: true });

// ─── SCROLL REVEAL (IntersectionObserver) ──────────────
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

// ─── COUNT-UP ANIMATION ────────────────────────────────
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

// ─── MAGNETIC BUTTON ───────────────────────────────────
document.querySelectorAll('.magnetic').forEach(el => {
  el.addEventListener('mousemove', e => {
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left - r.width  / 2) * 0.18;
    const y = (e.clientY - r.top  - r.height / 2) * 0.18;
    el.style.transform = `translate(${x}px, ${y}px)`;
  });
  el.addEventListener('mouseleave', () => { el.style.transform = ''; });
});

// ─── PROJECTS INTERACTIVE SELECTOR ─────────────────────
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

// ─── FOOTER TEXT HOVER EFFECT ──────────────────────────
(function () {
  const svg       = document.getElementById('footerTextSvg');
  const revealGrad = document.getElementById('hf-revealMask');
  const drawText   = document.getElementById('hf-draw');
  const outline    = document.getElementById('hf-outline');
  if (!svg || !revealGrad) return;

  const VW = 1000, VH = 110; // matches SVG viewBox
  let targetCx = VW / 2, targetCy = VH / 2;
  let currentCx = VW / 2, currentCy = VH / 2;

  // Draw-in animation when footer enters viewport
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        drawText && drawText.classList.add('hf-animate');
        io.disconnect();
      }
    }, { threshold: 0.3 });
    io.observe(svg);
  }

  // Mouse interaction on the SVG area
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
  });

  // Smooth lerp loop to move the reveal radial gradient
  (function loop() {
    currentCx += (targetCx - currentCx) * 0.1;
    currentCy += (targetCy - currentCy) * 0.1;
    revealGrad.setAttribute('cx', currentCx.toFixed(1));
    revealGrad.setAttribute('cy', currentCy.toFixed(1));
    requestAnimationFrame(loop);
  })();
})();

// ─── CURSOR GLOW (desktop only) ────────────────────────
if (window.matchMedia('(pointer: fine)').matches) {
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

// ─── HERO TEXT CURSOR PROXIMITY ────────────────────────
(function () {
  const heroTitle = document.querySelector('.hero-title');
  if (!heroTitle || !window.matchMedia('(pointer: fine)').matches) return;

  // Recursively wrap every character in a .tcp-l span, preserving element tree
  function wrapChars(el) {
    Array.from(el.childNodes).slice().forEach(node => {
      if (node.nodeType === 3) { // text node
        const frag = document.createDocumentFragment();
        [...node.textContent].forEach(ch => {
          if (ch === ' ') {
            frag.appendChild(document.createTextNode(' '));
          } else {
            const s = document.createElement('span');
            s.className = 'tcp-l';
            s.textContent = ch;
            frag.appendChild(s);
          }
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

  // Gaussian falloff: full effect at distance 0, fades to 0 at ~RADIUS
  function proximity(d) {
    return Math.exp(-Math.pow(d / (RADIUS * 0.5), 2) / 2);
  }

  // Allow scaled letters to overflow .line clip after entry animations finish
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
