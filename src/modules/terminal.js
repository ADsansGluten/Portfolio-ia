import { KB, SUGGESTIONS, FALLBACK, LINKS } from '../data/content.js';
import { reduced } from '../utils/env.js';

/**
 * Terminal « Ask me anything ».
 * 100 % local : matching de mots-clés sur KB (src/data/content.js) + streaming token par token.
 *
 * ▸ Brancher une vraie API LLM (optionnel) : renseigne LLM_ENDPOINT ci-dessous avec l'URL d'une
 *   fonction serverless (Vercel / Netlify) qui reçoit { question } et renvoie { answer }.
 *   La clé API reste côté serveur. Voir README.md pour l'exemple de fonction.
 */
const LLM_ENDPOINT = ''; // ex: '/api/ask'

const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const linkify = (s) => s.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')
  .replace(/([\w.-]+@[\w.-]+\.\w+)/g, '<a href="mailto:$1">$1</a>');
const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

export function initTerminal({ toggleMatrix, toggleTheme }) {
  const out = document.getElementById('term-out');
  const form = document.getElementById('term-form');
  const input = document.getElementById('term-in');
  const sugg = document.getElementById('term-sugg');
  const history = [];
  let hIdx = 0;
  let busy = false;

  const scroll = () => { out.scrollTop = out.scrollHeight; };
  const line = (cls, html) => { const d = document.createElement('div'); d.className = 't-line ' + cls; d.innerHTML = html; out.appendChild(d); scroll(); return d; };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  /** Affiche un texte token par token (mots) avec un curseur clignotant. */
  async function stream(text, cls = 't-bot') {
    const el = line(cls + ' t-caret', '');
    if (reduced) { el.className = 't-line ' + cls; el.innerHTML = linkify(esc(text)); scroll(); return; }
    const tokens = text.split(/(\s+)/);
    let acc = '';
    for (const tok of tokens) {
      acc += tok;
      el.textContent = acc;
      scroll();
      if (tok.trim()) await sleep(18 + Math.random() * 38);
    }
    el.className = 't-line ' + cls;
    el.innerHTML = linkify(esc(text));
    scroll();
  }

  function answer(q) {
    const n = norm(q);
    const words = n.split(/[^a-z0-9@.]+/).filter(Boolean);
    let best = null, bestScore = 0;
    for (const item of KB) {
      let s = 0;
      for (const k of item.k) if (words.includes(k) || (k.length > 4 && n.includes(k))) s += k.length > 4 ? 2 : 1;
      if (s > bestScore) { best = item; bestScore = s; }
    }
    return best ? best.a : FALLBACK;
  }

  const COMMANDS = {
    help: () => stream("Commandes : help · clear · projets · competences · parcours · contact · linkedin · matrix · theme · whoami\nOu pose-moi une question en français. Il y a aussi quelques commandes secrètes…", 't-sys'),
    whoami: () => stream('visiteur@latent-space — bienvenue. Moi, c\'est Adrien.', 't-sys'),
    ls: () => stream('about.txt  skills.json  projects/  parcours.log  contact.sh', 't-sys'),
    clear: () => { out.innerHTML = ''; },
    matrix: () => { toggleMatrix(); return stream('Data rain togglé. (Échap pour arrêter)', 't-sys'); },
    theme: () => { toggleTheme(); return stream('Palette changée.', 't-sys'); },
    'cat cv': () => stream(`CV : ${location.origin}${LINKS.cv}`, 't-sys'),
  };

  async function hire() {
    const steps = [
      '[sudo] password for recruteur: ********',
      'authenticating ............. ok',
      'checking motivation ........ 100%',
      'checking curiosity ......... overflow',
      'generating offer_letter.pdf ... done',
    ];
    for (const s of steps) { line('t-sys', esc(s)); await sleep(reduced ? 0 : 420); }
    toggleMatrix(true);
    await stream(`Excellente décision. Écris-moi : ${LINKS.email} — ou ${LINKS.linkedin}`);
    setTimeout(() => toggleMatrix(false), 4000);
    setTimeout(() => document.getElementById('contact').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' }), 1200);
  }

  async function run(raw) {
    const q = raw.trim();
    if (!q || busy) return;
    busy = true;
    history.push(q); hIdx = history.length;
    line('t-user', esc(q));
    const n = norm(q);
    try {
      if (/^sudo\s+hire\s+adrien\b/.test(n)) await hire();
      else if (n.startsWith('sudo')) await stream("Bien tenté, mais tu n'as pas les droits. Essaie « sudo hire adrien » 😉", 't-sys');
      else if (/^(rm|rm -rf|exit|shutdown|reboot)/.test(n)) await stream('Permission refusée. Ce portfolio est protégé par mon amour-propre.', 't-sys');
      else if (COMMANDS[n]) await COMMANDS[n]();
      else if (LLM_ENDPOINT) {
        try {
          const r = await fetch(LLM_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: q }) });
          const j = await r.json();
          await stream(j.answer || answer(q));
        } catch { await stream(answer(q)); }
      } else { await sleep(reduced ? 0 : 250); await stream(answer(q)); }
    } finally { busy = false; input.focus({ preventScroll: true }); }
  }

  // Suggestions cliquables
  sugg.innerHTML = SUGGESTIONS.map((s) => `<button type="button">${s}</button>`).join('');
  sugg.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) run(b.textContent); });

  form.addEventListener('submit', (e) => { e.preventDefault(); const v = input.value; input.value = ''; run(v); });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp' && history.length) { e.preventDefault(); hIdx = Math.max(0, hIdx - 1); input.value = history[hIdx] || ''; }
    if (e.key === 'ArrowDown') { e.preventDefault(); hIdx = Math.min(history.length, hIdx + 1); input.value = history[hIdx] || ''; }
  });

  // Message d'accueil
  stream("Salut, je suis la version locale d'Adrien. Pose une question ou clique une suggestion. Tape « help » pour les commandes.", 't-sys');
}
