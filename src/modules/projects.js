import { openYbot } from './ybot.js';
import gsap from 'gsap';
import { tr } from '../utils/i18n.js';
import { PROJECTS } from '../data/content.js';
import { reduced, finePointer } from '../utils/env.js';

let lenisRef = null;
let lastFocus = null;

/** Visuel génératif (SVG) : nuage de points relié façon « espace latent », teinte propre à chaque projet. */
function previewArt(p) {
  const h = p.hue, W = 320, H = 156;
  const rnd = (i, k) => { const v = Math.sin(i * 12.9898 + k * 78.233 + h) * 43758.5453; return v - Math.floor(v); };
  const pts = Array.from({ length: 34 }, (_, i) => ({ x: 14 + rnd(i, 1) * (W - 28), y: 12 + rnd(i, 2) * (H - 24), r: 1.2 + rnd(i, 3) * 2.6 }));
  let lines = '';
  pts.forEach((a, i) => pts.forEach((b, j) => { if (j > i) { const d = Math.hypot(a.x - b.x, a.y - b.y); if (d < 62) lines += `<line x1="${a.x.toFixed(0)}" y1="${a.y.toFixed(0)}" x2="${b.x.toFixed(0)}" y2="${b.y.toFixed(0)}" stroke="hsl(${h} 90% 78%)" stroke-opacity="${(0.32 * (1 - d / 62)).toFixed(2)}"/>`; } }));
  const dots = pts.map((q) => `<circle cx="${q.x.toFixed(0)}" cy="${q.y.toFixed(0)}" r="${q.r.toFixed(1)}" fill="hsl(${h} 95% 82%)" opacity="${(0.45 + q.r / 8).toFixed(2)}"/>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice"><defs><radialGradient id="g" cx="25%" cy="20%" r="95%"><stop offset="0" stop-color="hsl(${h} 90% 52%)"/><stop offset="0.55" stop-color="hsl(${h} 70% 18%)"/><stop offset="1" stop-color="#07070b"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#g)"/>${lines}${dots}</svg>`;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}

const escPv = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function previewHTML(p) {
  return `<div class="pv" style="--h:${p.hue}">
    <div class="pv__art" style="background:${previewArt(p)} center / cover"><span class="pv__open mono">${tr('Ouvrir')} <b>↗</b></span></div>
    <div class="pv__body">
      <div class="pv__top mono"><span>${escPv(p.index)} / ${escPv(p.year)}</span><span class="pv__status${p.live ? ' live' : ''}">${escPv(p.status)}</span></div>
      <p class="pv__title">${escPv(p.title)}</p>
      <p class="pv__kicker mono">${escPv(p.kicker)}</p>
      <ul class="pv__stack mono">${p.stack.slice(0, 4).map((t) => `<li>${escPv(t)}</li>`).join('')}</ul>
    </div>
  </div>`;
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
        <span class="project-row__status mono ${p.live ? 'live' : ''}">${p.status}</span>
      </a>
    </li>`).join('');

  // Preview qui suit le curseur
  const prev = document.getElementById('preview');
  if (finePointer && !reduced) {
    const CARD_W = 320;
    gsap.set(prev, { xPercent: 0, yPercent: 0, rotation: 0, scale: 0.9, opacity: 0 });
    const x = gsap.quickTo(prev, 'x', { duration: 0.55, ease: 'power3' });
    const y = gsap.quickTo(prev, 'y', { duration: 0.55, ease: 'power3' });
    const rot = gsap.quickTo(prev, 'rotation', { duration: 0.7, ease: 'power3' });
    let lastX = 0, settle = 0;
    list.addEventListener('pointermove', (e) => {
      // La carte passe à gauche du curseur près du bord droit de l'écran
      const flip = e.clientX + 36 + CARD_W > innerWidth - 12;
      x(flip ? e.clientX - 36 - CARD_W : e.clientX + 36);
      y(Math.min(innerHeight - prev.offsetHeight - 12, Math.max(12, e.clientY - prev.offsetHeight * 0.35)));
      // Légère inclinaison selon la vitesse horizontale, qui se redresse à l'arrêt
      rot(Math.max(-5, Math.min(5, (e.clientX - lastX) * 0.25))); lastX = e.clientX;
      clearTimeout(settle); settle = setTimeout(() => rot(0), 90);
    });
    let shown = false, current = null;
    const show = () => { shown = true; gsap.to(prev, { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.6)', overwrite: 'auto' }); };
    const hide = () => { if (!shown && gsap.getProperty(prev, 'opacity') === 0) return; shown = false; gsap.to(prev, { opacity: 0, scale: 0.92, duration: 0.25, ease: 'power2.in', overwrite: 'auto' }); };
    list.querySelectorAll('.project-row').forEach((row) => {
      const p = PROJECTS.find((q) => q.slug === row.dataset.slug);
      row.addEventListener('pointerenter', () => {
        if (current !== p.slug) {
          current = p.slug; prev.innerHTML = previewHTML(p);
          gsap.fromTo(prev.querySelectorAll('.pv__body > *'), { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, stagger: 0.05, ease: 'power3.out' });
          gsap.fromTo(prev.querySelector('.pv__art'), { scale: 1.08 }, { scale: 1, duration: 0.7, ease: 'power3.out' });
        }
        show();
      });
      row.addEventListener('pointerleave', hide);
    });
    // Filets de sécurité : un défilement rapide peut faire rater pointerleave
    list.addEventListener('pointerleave', hide);
    let mx = -1, my = -1;
    const check = () => { if (shown && !document.elementFromPoint(mx, my)?.closest('.project-row')) hide(); };
    window.addEventListener('pointermove', (e) => { mx = e.clientX; my = e.clientY; check(); }, { passive: true });
    window.addEventListener('scroll', check, { passive: true });
    lenisRef?.on('scroll', check);
    window.addEventListener('blur', hide);
    document.addEventListener('mouseleave', hide);
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
  const play = p.play ? `<button class="btn btn--primary" type="button" data-play="${p.play}" data-cursor="link">${tr('▶ Tester le jeu ici')} <b>↘</b></button>` : '';
  const links = play + p.links.map((l) => l.href
    ? `<a class="btn btn--primary" href="${l.href}" target="_blank" rel="noopener">${l.label} <b>↗</b></a>`
    : `<span class="btn mono">${l.label}</span>`).join('');
  document.getElementById('modal-content').innerHTML = `
    <div><p class="label mono">${p.index} / ${p.kicker} <span class="dot"></span> ${p.year} · ${p.status}</p></div>
    <h2 class="modal__title" id="modal-title">${p.title}</h2>
    <p class="modal__lede">${p.summary}</p>
    ${p.image ? `<figure class="modal__shot"><img src="${p.image}" alt="${p.imageAlt || ''}" loading="lazy" decoding="async" /><figcaption class="mono">// ${tr('capture :')} ${p.imageCaption || ''}</figcaption></figure>` : ''}
    <div class="modal__grid">
      <div><h3>${tr('Contexte')}</h3><p>${p.context}</p></div>
      <div><h3>${tr('Problème')}</h3><p>${p.problem}</p></div>
      <div><h3>${tr('Solution')}</h3><p>${p.solution}</p></div>
      <div><h3>${tr('Résultat')}</h3><p>${p.result}</p></div>
    </div>
    <div><h3 class="mono label">// stack</h3><ul class="modal__stack">${p.stack.map((s) => `<li>${s}</li>`).join('')}</ul></div>
    <div class="modal__links">${links}</div>`;
}

document.addEventListener('click', (e) => {
  const b = e.target.closest?.('[data-play]');
  if (b) openYbot(lenisRef);
});

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
