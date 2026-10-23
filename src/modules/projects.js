import gsap from 'gsap';
import { PROJECTS } from '../data/content.js';
import { reduced, finePointer } from '../utils/env.js';

let lenisRef = null;
let lastFocus = null;

/** Visuel génératif (SVG) pour la preview au survol — aucune image externe à fournir. */
function previewArt(p) {
  const h = p.hue;
  const dots = Array.from({ length: 46 }, (_, i) => {
    const x = (Math.sin(i * 12.9898 + h) * 43758.5453 % 1 + 1) % 1;
    const y = (Math.sin(i * 78.233 + h) * 12345.678 % 1 + 1) % 1;
    return `<circle cx="${(x * 340).toFixed(0)}" cy="${(y * 220).toFixed(0)}" r="${(1 + (i % 4)).toFixed(0)}" fill="hsl(${h} 90% 75%)" opacity="${(0.25 + (i % 5) * 0.12).toFixed(2)}"/>`;
  }).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 220"><defs><radialGradient id="g" cx="30%" cy="30%" r="90%"><stop offset="0" stop-color="hsl(${h} 90% 55%)"/><stop offset="1" stop-color="#07070b"/></radialGradient></defs><rect width="340" height="220" fill="url(#g)"/>${dots}<text x="18" y="200" font-family="monospace" font-size="13" fill="white" opacity=".85">${p.index} / ${p.title}</text></svg>`;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}

export function renderProjects(lenis) {
  lenisRef = lenis;
  const list = document.getElementById('projects-list');
  list.innerHTML = PROJECTS.map((p) => `
    <li>
      <a class="project-row" href="#/projet/${p.slug}" data-slug="${p.slug}" data-cursor="view" aria-label="${p.title} — ${p.kicker}">
        <span class="project-row__idx mono">${p.index}</span>
        <span class="project-row__title">${p.title}</span>
        <span class="project-row__kicker">${p.kicker}<br><span class="mono">${p.summary}</span></span>
        <span class="project-row__status mono ${p.status === 'En ligne' ? 'live' : ''}">${p.status}</span>
      </a>
    </li>`).join('');

  // Preview qui suit le curseur
  const prev = document.getElementById('preview');
  const img = document.getElementById('preview-img');
  if (finePointer && !reduced) {
    const x = gsap.quickTo(prev, 'x', { duration: 0.5, ease: 'power3' });
    const y = gsap.quickTo(prev, 'y', { duration: 0.5, ease: 'power3' });
    list.addEventListener('pointermove', (e) => { x(e.clientX + 30); y(e.clientY - 10); });
    list.querySelectorAll('.project-row').forEach((row) => {
      const p = PROJECTS.find((q) => q.slug === row.dataset.slug);
      row.addEventListener('pointerenter', () => {
        img.style.background = previewArt(p) + ' center / cover';
        gsap.to(prev, { opacity: 1, scale: 1, duration: 0.45, ease: 'power3.out' });
      });
      row.addEventListener('pointerleave', () => gsap.to(prev, { opacity: 0, scale: 0.85, duration: 0.3 }));
    });
  }

  // Routage par l'historique : #/projet/slug
  list.addEventListener('click', (e) => {
    const a = e.target.closest('.project-row');
    if (!a) return;
    e.preventDefault();
    openProject(a.dataset.slug);
  });
  window.addEventListener('popstate', syncFromHash);
  document.getElementById('modal-close').addEventListener('click', () => closeProject());
  window.addEventListener('keydown', (e) => {
    const modal = document.getElementById('modal');
    if (modal.hidden) return;
    if (e.key === 'Escape') closeProject();
    if (e.key === 'Tab') { // piège à focus
      const f = [...modal.querySelectorAll('a[href], button')].filter((el) => !el.hidden);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
}

export function syncFromHash() {
  const m = location.hash.match(/^#\/projet\/([\w-]+)/);
  if (m) openProject(m[1], false); else closeProject(false);
}

function fill(p) {
  const links = p.links.map((l) => l.href
    ? `<a class="btn btn--primary" href="${l.href}" target="_blank" rel="noopener">${l.label} <b>↗</b></a>`
    : `<span class="btn mono">${l.label}</span>`).join('');
  document.getElementById('modal-content').innerHTML = `
    <div><p class="label mono">${p.index} / ${p.kicker} <span class="dot"></span> ${p.year} · ${p.status}</p></div>
    <h2 class="modal__title" id="modal-title">${p.title}</h2>
    <p class="modal__lede">${p.summary}</p>
    <div class="modal__grid">
      <div><h3>Contexte</h3><p>${p.context}</p></div>
      <div><h3>Problème</h3><p>${p.problem}</p></div>
      <div><h3>Solution</h3><p>${p.solution}</p></div>
      <div><h3>Résultat</h3><p>${p.result}</p></div>
    </div>
    <div><h3 class="mono label">// stack</h3><ul class="modal__stack">${p.stack.map((s) => `<li>${s}</li>`).join('')}</ul></div>
    <div class="modal__links">${links}</div>`;
}

export function openProject(slug, push = true) {
  const p = PROJECTS.find((x) => x.slug === slug);
  if (!p) return;
  const modal = document.getElementById('modal');
  const panel = document.getElementById('modal-panel');
  if (!modal.hidden && modal.dataset.slug === slug) return;
  lastFocus = document.activeElement;
  fill(p);
  modal.dataset.slug = slug;
  modal.hidden = false;
  if (push) history.pushState(null, '', '#/projet/' + slug);
  lenisRef?.stop();
  document.body.style.overflow = 'hidden';
  panel.scrollTop = 0;
  if (reduced) { panel.style.clipPath = 'inset(0)'; }
  else {
    gsap.to(panel, { clipPath: 'inset(0% 0 0 0)', duration: 0.9, ease: 'expo.inOut' });
    gsap.from('#modal-content > *', { y: 40, opacity: 0, duration: 0.9, ease: 'expo.out', stagger: 0.08, delay: 0.45 });
  }
  setTimeout(() => document.getElementById('modal-close').focus(), reduced ? 0 : 500);
}

export function closeProject(push = true) {
  const modal = document.getElementById('modal');
  if (modal.hidden) return;
  const panel = document.getElementById('modal-panel');
  const done = () => {
    modal.hidden = true; delete modal.dataset.slug;
    document.body.style.overflow = '';
    lenisRef?.start();
    lastFocus?.focus?.();
  };
  if (push) history.pushState(null, '', location.pathname + location.search + '#projects');
  if (reduced) { panel.style.clipPath = 'inset(100% 0 0 0)'; done(); }
  else gsap.to(panel, { clipPath: 'inset(100% 0 0 0)', duration: 0.7, ease: 'expo.inOut', onComplete: done });
}
