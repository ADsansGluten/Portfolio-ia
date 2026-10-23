// Génère un portfolio en UN SEUL fichier HTML (sans npm ni serveur) à partir des sources.
// Usage : node scripts/build-single.mjs   →   dist-single/index.html
// GSAP, Lenis et Three.js sont chargés depuis des CDN au moment de l'ouverture de la page.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';

const read = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const ORDER = ['utils/env', 'utils/split', 'data/content', 'modules/preloader', 'modules/cursor', 'modules/kinetic',
  'modules/interactions', 'modules/skills', 'modules/projects', 'modules/timeline', 'modules/terminal',
  'modules/easter', 'modules/contact', 'modules/linkedin', 'modules/hero', 'main'];

const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js';

let js = ORDER.map((f) => {
  let s = read(`src/${f}${f === 'main' ? '' : ''}.js`);
  s = s.replace(/^import\s[^\n]*;\s*$/gm, '');           // imports locaux / npm → supprimés (globaux CDN)
  s = s.replace(/^export\s+(default\s+)?/gm, '');         // plus de modules : tout est dans un seul scope
  if (f === 'modules/hero') s = s.replace("import('three')", `import('${THREE_URL}')`);
  if (f === 'main') s = s.replace(/import\('\.\/modules\/hero\.js'\)\.then\(\(m\) => m\.initHero\(([^)]*\)[^)]*)\)\);/, 'initHero($1);')
    .replace("() => import('./modules/hero.js').then((m) => m.initHero(document.getElementById('hero-canvas')))", "() => initHero(document.getElementById('hero-canvas'))");
  return `/* ───── ${f} ───── */\n${s}`;
}).join('\n');

const css = read('src/styles/main.css');
const fav = 'data:image/svg+xml,' + encodeURIComponent(read('public/favicon.svg').trim());

let html = read('index.html')
  .replace(/<link rel="icon"[^>]*>/, `<link rel="icon" href="${fav}" type="image/svg+xml" />`)
  .replace('</head>', `<style>\n${css}\n</style>\n</head>`)
  .replace('<script type="module" src="/src/main.js"></script>', `
  <!-- Bibliothèques (CDN). Si elles échouent, le site reste lisible en version sobre. -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/gsap.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/ScrollTrigger.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/lenis@1/dist/lenis.min.js"></script>
  <script>window.__noGsap = !(window.gsap && window.ScrollTrigger);</script>
  <script type="module">
${js}
  </script>`);

// Portrait : incrusté en base64 pour rester un seul fichier
const MIME = { jpg: 'image/jpeg', webp: 'image/webp', png: 'image/png' };
html = html.replace(/src="((?:li\/)?[\w.-]+\.(?:jpg|webp|png))"/g, (m, f) => {
  const u = new URL('../public/' + f, import.meta.url);
  if (!existsSync(u)) return m;
  return `src="data:${MIME[f.split('.').pop()]};base64,${readFileSync(u).toString('base64')}"`;
});

mkdirSync(new URL('../dist-single/', import.meta.url), { recursive: true });
writeFileSync(new URL('../dist-single/index.html', import.meta.url), html);
console.log('OK dist-single/index.html', (html.length / 1024).toFixed(0) + ' Ko');
