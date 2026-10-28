// Génère un portfolio en UN SEUL fichier HTML (sans npm ni serveur) à partir des sources.
// Usage : node scripts/build-single.mjs   →   dist-single/index.html
// GSAP, Lenis et Three.js sont chargés depuis des CDN au moment de l'ouverture de la page.
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { gzipSync } from 'node:zlib';

const read = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const ORDER = ['utils/env', 'utils/split', 'data/en', 'utils/i18n', 'data/content', 'modules/preloader', 'modules/cursor', 'modules/kinetic',
  'modules/interactions', 'modules/skills', 'modules/ybot', 'modules/projects', 'modules/timeline', 'modules/terminal',
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

for (const n of ['ybot-shot', 'recrutia-shot']) {
  const shot = readFileSync(new URL(`../public/ybot/${n}.webp`, import.meta.url)).toString('base64');
  js = js.replace(`'ybot/${n}.webp'`, `'data:image/webp;base64,${shot}'`);
}

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

// Jeu Mr Ybot (Go → WebAssembly) incrusté, compressé, pour rester un seul fichier
{
  const rt = readFileSync(new URL('../public/ybot/wasm_exec.js', import.meta.url), 'utf8');
  const wasm = gzipSync(readFileSync(new URL('../public/ybot/ybot.wasm', import.meta.url)), { level: 9 }).toString('base64');
  if (rt.includes('</script')) throw new Error('wasm_exec.js contient </script');
  html = html.replace('</body>', () => `<script type="text/plain" id="ybot-runtime">${rt}</script>\n<script type="application/octet-stream" id="ybot-wasm">${wasm}</script>\n</body>`);
}

mkdirSync(new URL('../dist-single/', import.meta.url), { recursive: true });
writeFileSync(new URL('../dist-single/index.html', import.meta.url), html);
// Garde-fou : le script concaténé doit être un module valide (détecte les doublons d'identifiants entre fichiers)
{
  const m = html.match(/<script type="module">([\s\S]*?)<\/script>/);
  const tmp = new URL('../dist-single/_check.mjs', import.meta.url);
  writeFileSync(tmp, m[1].replace(/import\('https:[^']+'\)/g, 'null'));
  const r = spawnSync(process.execPath, ['--check', tmp.pathname], { encoding: 'utf8' });
  if (r.status !== 0) { console.error('ERREUR : le script unique est invalide\n' + r.stderr); process.exit(1); }
  rmSync(tmp);
}
console.log('OK dist-single/index.html', (html.length / 1024).toFixed(0) + ' Ko');
