import { EN_UI } from '../data/en.js';

/**
 * Langue du site : choix mémorisé > ?lang=fr|en > langue du navigateur (fr → français, sinon anglais).
 * Le bouton FR/EN enregistre le choix puis recharge la page : tout (textes, projets, terminal) est reconstruit proprement.
 */
function detect() {
  try {
    const q = new URLSearchParams(location.search).get('lang');
    if (q === 'fr' || q === 'en') { try { localStorage.setItem('lang', q); } catch {} return q; }
    const s = localStorage.getItem('lang');
    if (s === 'fr' || s === 'en') return s;
  } catch {}
  return (navigator.language || 'fr').toLowerCase().startsWith('fr') ? 'fr' : 'en';
}

export const LANG = detect();
export const isEn = LANG === 'en';

/** Traduit un texte français exact (inchangé en français ou si la traduction manque). */
export const tr = (s) => (isEn && EN_UI[s]) || s;

const ATTRS = ['aria-label', 'alt', 'placeholder', 'title', 'data-quote', 'data-name'];

/** À appeler avant tout autre module : traduit le HTML statique et branche le bouton FR/EN. */
export function applyLang() {
  const root = document.documentElement;
  root.lang = LANG;
  const btn = document.getElementById('lang-toggle');
  if (btn) {
    btn.textContent = isEn ? 'FR' : 'EN';
    btn.setAttribute('aria-label', isEn ? 'Passer le site en français' : 'Switch the site to English');
    btn.setAttribute('lang', isEn ? 'fr' : 'en');
    btn.addEventListener('click', () => {
      try { localStorage.setItem('lang', isEn ? 'fr' : 'en'); } catch {}
      const u = new URL(location.href);
      u.searchParams.delete('lang');
      location.href = u.toString();
    });
  }
  if (!isEn) return;

  document.title = tr(document.title);
  document.querySelector('meta[name="description"]')?.setAttribute('content', tr(document.querySelector('meta[name="description"]').content));
  document.querySelectorAll('meta[property="og:title"], meta[property="og:description"]').forEach((m) => m.setAttribute('content', tr(m.content)));
  document.querySelector('meta[property="og:locale"]')?.setAttribute('content', 'en_US');

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.parentElement && !/^(SCRIPT|STYLE|NOSCRIPT)$/.test(n.parentElement.tagName) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach((n) => {
    const t = n.nodeValue.trim();
    const en = t && EN_UI[t];
    if (en) n.nodeValue = n.nodeValue.replace(t, en);
  });
  document.querySelectorAll(ATTRS.map((a) => `[${a}]`).join(',')).forEach((el) => {
    ATTRS.forEach((a) => { const v = el.getAttribute(a); if (v && EN_UI[v]) el.setAttribute(a, EN_UI[v]); });
  });
}
