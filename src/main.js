import './styles/main.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

import { reduced } from './utils/env.js';
import { runPreloader } from './modules/preloader.js';
import { initCursor } from './modules/cursor.js';
import { initKinetic, heroIntro, heroPrep } from './modules/kinetic.js';
import { initMagnetic, initSurfaces, initTheme, initAnchors, initLinkedInNudge } from './modules/interactions.js';
import { initSkills } from './modules/skills.js';
import { renderProjects, openProject, syncFromHash } from './modules/projects.js';
import { initTimeline } from './modules/timeline.js';
import { initTerminal } from './modules/terminal.js';
import { initEasterEggs, toggleMatrix } from './modules/easter.js';
import { initContact } from './modules/contact.js';

const noGsap = window.__noGsap === true;
if (!noGsap) gsap.registerPlugin(ScrollTrigger);
if (reduced) document.documentElement.classList.add('reduced');
document.body.classList.add('is-loading');

// --- Smooth scroll (Lenis) branché sur le ticker GSAP ---
let lenis = null;
if (!reduced) {
  lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

// --- Construction du DOM dynamique + modules (avant la fin du preloader) ---
initTheme();
initCursor();
initKinetic();
renderProjects(lenis);
initTimeline();
initSkills({ onOpenProject: (slug) => openProject(slug) });
initTerminal({
  toggleMatrix,
  toggleTheme: () => document.getElementById('theme-toggle').click(),
});
initEasterEggs();
initContact();
initMagnetic();
initSurfaces();
initAnchors(lenis);
initLinkedInNudge();

// Le WebGL est chargé en différé : il n'entre pas dans le chemin critique
const loadHero = () => import('./modules/hero.js').then((m) => m.initHero(document.getElementById('hero-canvas')));

// Le champ WebGL est construit PENDANT le preloader (derrière le rideau) : plus de saccade à la révélation.
// Garde-fou : on n'attend jamais plus de 2,5 s.
if (!noGsap) heroPrep();
const heroReady = Promise.race([
  loadHero().catch(() => {}),
  new Promise((r) => setTimeout(r, 2500)),
]);
const ready = noGsap
  ? Promise.resolve().then(() => document.getElementById('preloader')?.remove())
  : Promise.all([runPreloader(), heroReady]);
ready.then(() => {
  document.body.classList.remove('is-loading');
  if (!noGsap) heroIntro();
  syncFromHash(); // si l'URL pointe directement vers #/projet/xxx
  if (!noGsap) ScrollTrigger.refresh();
});

// Sécurité : si le preloader plante, on ne bloque jamais la page
window.addEventListener('error', () => document.body.classList.remove('is-loading'));
