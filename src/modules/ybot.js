/**
 * Terminal « Tester le jeu » : fait tourner Mr Ybot (Go compilé en WebAssembly) dans la page.
 * Aucune dépendance : mini-terminal maison (couleurs ANSI, effacement d'écran, saisie ligne par ligne).
 * Chargé à la demande : le .wasm (≈0,8 Mo compressé) n'est téléchargé qu'au clic.
 */
const YB_COLORS = { 30: '#6b7280', 31: '#ff5c7a', 32: '#4ade80', 33: '#facc15', 34: '#60a5fa', 35: '#c084fc', 36: '#22d3ee', 37: '#e5e7eb' };

let ybRoot = null;
let ybSession = 0;
let ybRuntimePromise = null;

function ybB64ToBytes(b64) {
  const bin = atob(b64.trim());
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function ybLoadRuntime() {
  if (ybRuntimePromise) return ybRuntimePromise;
  ybRuntimePromise = (async () => {
    // Version « un seul fichier » : tout est incrusté dans la page. Version Vite : fichiers dans /ybot/.
    const emb = document.getElementById('ybot-runtime');
    const src = emb ? emb.textContent : await (await fetch('ybot/wasm_exec.js')).text();
    (0, eval)(src); // définit globalThis.Go
    let bytes;
    const wasmEl = document.getElementById('ybot-wasm');
    if (wasmEl) {
      const gz = ybB64ToBytes(wasmEl.textContent);
      const ds = new Response(new Blob([gz]).stream().pipeThrough(new DecompressionStream('gzip')));
      bytes = await ds.arrayBuffer();
    } else {
      bytes = await (await fetch('ybot/ybot.wasm')).arrayBuffer();
    }
    return WebAssembly.compile(bytes);
  })();
  ybRuntimePromise.catch(() => { ybRuntimePromise = null; });
  return ybRuntimePromise;
}

/* ─────────── Écran : interprète les séquences ANSI utiles ─────────── */
function ybScreen(pre) {
  let style = { bold: false, color: null };
  let carry = '';
  const dec = new TextDecoder();
  const append = (text) => {
    if (!text) return;
    const s = document.createElement('span');
    s.textContent = text;
    if (style.bold) s.style.fontWeight = '700';
    if (style.color) s.style.color = style.color;
    pre.appendChild(s);
  };
  const sgr = (params) => {
    const list = params === '' ? [0] : params.split(';').map(Number);
    for (const c of list) {
      if (c === 0) style = { bold: false, color: null };
      else if (c === 1) style.bold = true;
      else if (c === 22) style.bold = false;
      else if (c === 39) style.color = null;
      else if (YB_COLORS[c]) style.color = YB_COLORS[c];
      else if (c >= 90 && c <= 97 && YB_COLORS[c - 60]) style.color = YB_COLORS[c - 60];
    }
  };
  return {
    clear() { pre.textContent = ''; style = { bold: false, color: null }; carry = ''; },
    write(bytes) {
      let text = carry + dec.decode(bytes, { stream: true });
      carry = '';
      let plain = '';
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (ch === '\x1b') {
          const m = /^\x1b\[([0-9;?]*)([A-Za-z])/.exec(text.slice(i));
          if (!m) { // séquence incomplète : on attend la suite
            if (text.length - i < 16) { carry = text.slice(i); break; }
            plain += ch; continue;
          }
          append(plain); plain = '';
          if (m[2] === 'm') sgr(m[1]);
          else if (m[2] === 'J' && (m[1] === '2' || m[1] === '3' || m[1] === '')) { pre.textContent = ''; }
          i += m[0].length - 1;
        } else if (ch === '\r') { /* ignoré */ }
        else plain += ch;
      }
      append(plain);
      if (pre.childNodes.length > 4000) for (let k = 0; k < 1500; k++) pre.removeChild(pre.firstChild);
    },
  };
}

/* ─────────── Entrées / sorties du programme Go ─────────── */
function ybWireIO(screen, onActivity) {
  const queue = []; // octets en attente de lecture par Go
  let waiting = null;
  const flush = () => {
    if (!waiting || !queue.length) return;
    const { buffer, offset, length, cb } = waiting;
    waiting = null;
    const n = Math.min(length, queue.length);
    for (let i = 0; i < n; i++) buffer[offset + i] = queue.shift();
    cb(null, n);
  };
  const enosys = () => { const e = new Error('not implemented'); e.code = 'ENOSYS'; return e; };
  const fs = globalThis.fs;
  fs.writeSync = (fd, buf) => { if (fd === 1 || fd === 2) { screen.write(buf); onActivity(); } return buf.length; };
  fs.write = (fd, buf, offset, length, position, cb) => {
    if (offset !== 0 || length !== buf.length || position !== null) { cb(enosys()); return; }
    cb(null, fs.writeSync(fd, buf));
  };
  fs.read = (fd, buffer, offset, length, position, cb) => {
    if (fd !== 0) { cb(enosys()); return; }
    waiting = { buffer, offset, length, cb };
    flush();
  };
  return { send(line) { queue.push(...new TextEncoder().encode(line + '\n')); flush(); } };
}

/* ─────────── Interface ─────────── */
function ybBuild() {
  const el = document.createElement('div');
  el.className = 'ybot';
  el.id = 'ybot';
  el.hidden = true;
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-label', 'Terminal : Mr Ybot');
  el.dataset.lenisPrevent = '';
  el.innerHTML = `
    <div class="ybot__win">
      <div class="ybot__bar mono">
        <span class="ybot__dots" aria-hidden="true"><i></i><i></i><i></i></span>
        <span class="ybot__title">mr-ybot — projet-red · go (wasm)</span>
        <button class="ybot__btn" type="button" data-yb="restart">Redémarrer ↺</button>
        <button class="ybot__btn" type="button" data-yb="close">Fermer ✕</button>
      </div>
      <pre class="ybot__screen mono" id="ybot-screen" tabindex="-1" aria-live="off"></pre>
      <form class="ybot__form mono" autocomplete="off">
        <label for="ybot-in">›</label>
        <input id="ybot-in" type="text" enterkeyhint="send" autocapitalize="off" autocomplete="off" autocorrect="off" spellcheck="false" aria-label="Saisie du jeu (Entrée pour envoyer)" />
        <button class="ybot__send" type="submit">Envoyer</button>
      </form>
      <p class="ybot__foot mono">Jeu réalisé en équipe de 3 (Ynov, Ymmersion) · ma part : combat, actions, compétences, ennemis · <a href="https://github.com/ItsForTheVibes/Projet-Red-Mr-Ybot" target="_blank" rel="noopener">code source ↗</a></p>
    </div>`;
  document.body.appendChild(el);
  return el;
}

async function ybStart() {
  const my = ++ybSession;
  const pre = ybRoot.querySelector('#ybot-screen');
  const input = ybRoot.querySelector('#ybot-in');
  const form = ybRoot.querySelector('form');
  const screen = ybScreen(pre);
  const say = (t) => screen.write(new TextEncoder().encode(t));
  const toBottom = () => { pre.scrollTop = pre.scrollHeight; };
  pre.textContent = '';
  say('\x1b[36m> chargement du module…\x1b[0m\n');
  let mod;
  try { mod = await ybLoadRuntime(); }
  catch (err) {
    say('\x1b[31m[!] Impossible de charger le jeu dans ce navigateur.\x1b[0m\nTu peux le lancer chez toi avec « go run . » depuis le dépôt GitHub.\n');
    return;
  }
  if (my !== ybSession) return;
  screen.clear();
  const io = ybWireIO(screen, toBottom);
  ybRoot._send = (l) => io.send(l);
  const go = new globalThis.Go();
  go.argv = ['ybot'];
  go.env = {};
  go.exit = (code) => { go.exited = true; };
  try {
    const instance = await WebAssembly.instantiate(mod, go.importObject);
    input.focus({ preventScroll: true });
    const done = go.run(instance);
    done.then(() => {
      if (my !== ybSession) return;
      say('\n\x1b[33m— session terminée —\x1b[0m  (« Redémarrer ↺ » pour rejouer)\n'); toBottom();
    });
  } catch (err) {
    say('\n\x1b[31m[!] Erreur : ' + (err && err.message ? err.message : err) + '\x1b[0m\n');
  }
  form.onsubmit = (e) => {
    e.preventDefault();
    if (my !== ybSession) return;
    const line = input.value;
    input.value = '';
    say('\x1b[36m' + line + '\x1b[0m\n');
    toBottom();
    ybRoot._send?.(line);
  };
}

let ybLastFocus = null;
let ybLenis = null;

export function openYbot(lenis) {
  if (!ybRoot) {
    ybRoot = ybBuild();
    ybRoot.addEventListener('click', (e) => {
      const b = e.target.closest('[data-yb]');
      if (b?.dataset.yb === 'close') closeYbot();
      else if (b?.dataset.yb === 'restart') ybStart();
      else if (e.target.closest('#ybot-screen') && !window.getSelection().toString()) ybRoot.querySelector('#ybot-in').focus({ preventScroll: true });
    });
    document.addEventListener('keydown', (e) => {
      if (ybRoot.hidden) return;
      if (e.key === 'Escape') { e.stopImmediatePropagation(); closeYbot(); }
    }, true);
  }
  if (lenis) ybLenis = lenis;
  ybLastFocus = document.activeElement;
  ybRoot.hidden = false;
  document.body.style.overflow = 'hidden';
  ybLenis?.stop();
  ybStart();
}

export function closeYbot() {
  if (!ybRoot || ybRoot.hidden) return;
  ybSession++; // invalide la session en cours
  ybRoot.hidden = true;
  const modal = document.getElementById('modal');
  if (!modal || modal.hidden) { document.body.style.overflow = ''; ybLenis?.start(); }
  ybLastFocus?.focus?.();
}
