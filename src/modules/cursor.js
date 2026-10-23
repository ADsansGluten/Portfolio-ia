import gsap from 'gsap';
import { finePointer } from '../utils/env.js';

/**
 * Curseur custom. États via l'attribut data-cursor sur n'importe quel élément :
 *  - "link"  : grossit
 *  - "view"  : cercle accent avec le texte VIEW
 *  - "drag"  : cercle accent avec le texte DRAG
 * Désactivé sur écran tactile.
 */
export function initCursor() {
  if (!finePointer) return;
  const el = document.getElementById('cursor');
  const label = el.querySelector('.cursor__label');
  document.body.classList.add('has-cursor');

  const x = gsap.quickTo(el, 'x', { duration: 0.18, ease: 'power3' });
  const y = gsap.quickTo(el, 'y', { duration: 0.18, ease: 'power3' });
  window.addEventListener('pointermove', (e) => { x(e.clientX); y(e.clientY); }, { passive: true });

  const set = (state) => {
    el.classList.remove('is-link', 'is-view', 'is-drag');
    if (state) el.classList.add('is-' + state);
    label.textContent = state === 'view' ? 'VIEW' : state === 'drag' ? 'DRAG' : '';
  };
  // Délégation : fonctionne aussi pour les éléments créés dynamiquement
  document.addEventListener('pointerover', (e) => {
    const t = e.target.closest?.('[data-cursor]');
    set(t ? t.dataset.cursor : '');
  });
  document.addEventListener('pointerleave', () => { el.style.opacity = 0; });
  document.addEventListener('pointerenter', () => { el.style.opacity = 1; });
}
