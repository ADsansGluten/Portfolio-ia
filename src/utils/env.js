// Détection d'environnement, évaluée une fois.
// __noGsap : posé par la version « fichier unique » si les bibliothèques CDN n'ont pas pu se charger
export const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches || window.__noGsap === true;
export const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
export const isMobile = window.matchMedia('(max-width: 860px)').matches || !finePointer;

/** localStorage sécurisé (peut lever une exception en navigation privée). */
export const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* ignore */ } },
};

/** Couleur d'accent courante (variable CSS) */
export const accent = () => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#8b5cff';
export const accentGlow = () => getComputedStyle(document.documentElement).getPropertyValue('--accent-glow').trim() || '#b79cff';

/** Petit toast pour les easter eggs */
export function toast(msg) {
  const el = document.createElement('div');
  el.textContent = msg;
  el.setAttribute('role', 'status');
  Object.assign(el.style, {
    position: 'fixed', left: '50%', bottom: '28px', transform: 'translate(-50%, 20px)', zIndex: 4000,
    background: 'var(--accent)', color: '#05050a', padding: '12px 18px', borderRadius: '999px',
    fontFamily: 'var(--font-mono)', fontSize: '12px', opacity: 0, transition: 'all .4s cubic-bezier(.22,1,.36,1)',
  });
  document.body.appendChild(el);
  requestAnimationFrame(() => { el.style.opacity = 1; el.style.transform = 'translate(-50%, 0)'; });
  setTimeout(() => { el.style.opacity = 0; setTimeout(() => el.remove(), 500); }, 2800);
}
export const cssVar = (n, f = '') => getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f;
export const isLight = () => document.documentElement.dataset.mode === 'light';
