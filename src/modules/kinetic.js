import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { splitChars, splitWords } from '../utils/split.js';
import { reduced, finePointer } from '../utils/env.js';

/**
 * Typographie cinétique :
 *  1. les titres [data-kinetic] se « recomposent » à l'entrée (lettres dispersées → alignées)
 *  2. au survol, les lettres proches du curseur sont repoussées puis reviennent (ressort)
 *  3. [data-reveal-words] : texte révélé mot par mot au scroll
 */
export function initKinetic() {
  document.querySelectorAll('[data-kinetic]').forEach((el) => {
    const chars = splitChars(el);
    el._chars = chars;
    if (el.closest('.hero')) return; // le hero est animé par l'intro
    if (reduced) return;
    gsap.from(chars, {
      yPercent: () => gsap.utils.random(40, 120), xPercent: () => gsap.utils.random(-40, 40),
      rotate: () => gsap.utils.random(-25, 25), opacity: 0, stagger: { each: 0.012, from: 'random' }, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%', end: 'top 50%', scrub: 0.6 },
    });
  });

  if (finePointer && !reduced) {
    document.querySelectorAll('[data-kinetic]').forEach(attachRepel);
  }

  // Révélation mot par mot
  document.querySelectorAll('[data-reveal-words]').forEach((el) => {
    const words = splitWords(el);
    if (reduced) { words.forEach((w) => { w.style.opacity = 1; }); return; }
    gsap.to(words, {
      opacity: 1, stagger: 0.08, ease: 'none',
      scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: true },
    });
  });
}

/** Les lettres fuient le curseur et reviennent en ressort élastique. */
function attachRepel(el) {
  const chars = el._chars || [];
  let raf = 0, mx = 0, my = 0, inside = false;
  const R = 130;

  const tick = () => {
    raf = 0;
    for (const c of chars) {
      const r = c.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const dx = cx - mx, dy = cy - my;
      const d = Math.hypot(dx, dy);
      if (inside && d < R) {
        const f = (1 - d / R) * 48;
        gsap.to(c, { x: (dx / (d || 1)) * f, y: (dy / (d || 1)) * f, rotate: (dx / R) * 18, duration: 0.35, overwrite: 'auto' });
        c._moved = true;
      } else if (c._moved) {
        c._moved = false;
        gsap.to(c, { x: 0, y: 0, rotate: 0, duration: 1.1, ease: 'elastic.out(1, 0.45)', overwrite: 'auto' });
      }
    }
  };
  el.addEventListener('pointermove', (e) => { mx = e.clientX; my = e.clientY; inside = true; if (!raf) raf = requestAnimationFrame(tick); });
  el.addEventListener('pointerleave', () => { inside = false; if (!raf) raf = requestAnimationFrame(tick); });
}

/** Intro du hero après le preloader. */
export function heroIntro() {
  const chars = [...document.querySelectorAll('.hero [data-kinetic]')].flatMap((el) => el._chars || []);
  if (reduced) return;
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  tl.from(chars, { yPercent: 120, rotate: 12, opacity: 0, duration: 1.3, stagger: 0.045 })
    .from('.hero .label', { y: 16, opacity: 0, duration: 0.8 }, 0.1)
    .from('.hero__tag', { y: 24, opacity: 0, duration: 1 }, 0.5)
    .from('.hero__cta .btn', { y: 24, opacity: 0, duration: 0.9, stagger: 0.1 }, 0.7)
    .from('.hero__hint, .hero__scroll, .nav', { opacity: 0, duration: 1.2 }, 1);
  ScrollTrigger.refresh();
}
