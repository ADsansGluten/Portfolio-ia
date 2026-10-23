import gsap from 'gsap';
import { reduced, finePointer, store } from '../utils/env.js';

/** Boutons magnétiques : l'élément est attiré par le curseur dans un rayon autour de lui. */
export function initMagnetic() {
  if (!finePointer || reduced) return;
  document.querySelectorAll('[data-magnetic]').forEach((el) => {
    const x = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'elastic.out(1, 0.5)' });
    const y = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'elastic.out(1, 0.5)' });
    const PAD = 40;
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const inside = e.clientX > r.left - PAD && e.clientX < r.right + PAD && e.clientY > r.top - PAD && e.clientY < r.bottom + PAD;
      if (inside) { x((e.clientX - cx) * 0.3); y((e.clientY - cy) * 0.3); } else { x(0); y(0); }
    };
    window.addEventListener('pointermove', onMove, { passive: true });
  });
}

/** Spotlight qui suit la souris sur les panneaux .glass + tilt 3D sur [data-tilt]. */
export function initSurfaces() {
  if (!finePointer) return;
  document.querySelectorAll('.glass').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', e.clientX - r.left + 'px');
      el.style.setProperty('--my', e.clientY - r.top + 'px');
    });
  });
  if (reduced) return;
  document.querySelectorAll('[data-tilt]').forEach((el) => {
    el.style.transformPerspective = 900;
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
      gsap.to(el, { rotationY: px * 9, rotationX: -py * 9, duration: 0.5, ease: 'power3.out' });
    });
    el.addEventListener('pointerleave', () => gsap.to(el, { rotationX: 0, rotationY: 0, duration: 0.9, ease: 'elastic.out(1, 0.5)' }));
  });
}

/** Bascule de palette violet ⇄ vert, mémorisée. */
export function initTheme() {
  const root = document.documentElement;
  const saved = store.get('theme');
  if (saved) root.dataset.theme = saved;
  document.getElementById('theme-toggle').addEventListener('click', () => {
    const next = root.dataset.theme === 'violet' ? 'green' : 'violet';
    root.dataset.theme = next;
    store.set('theme', next);
    window.dispatchEvent(new Event('themechange'));
  });
  if (saved) window.dispatchEvent(new Event('themechange'));
}

/** Ancres internes → défilement fluide via Lenis (les routes #/projet/... sont ignorées). */
export function initAnchors(lenis) {
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (href.startsWith('#/') || href === '#') return;
    const target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target, { duration: 1.4 });
    else target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    history.replaceState(null, '', href);
  });
}
