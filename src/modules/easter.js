import { reduced, accent, toast } from '../utils/env.js';

/**
 * Easter eggs :
 *  - Konami code (↑↑↓↓←→←→ B A) → data rain
 *  - Échap → coupe la pluie
 *  - 5 clics sur le gros « LAVIGNE » du footer
 *  - commande `matrix` / `sudo hire adrien` dans le terminal
 */
let on = false;
let raf = 0;

export function toggleMatrix(force) {
  const canvas = document.getElementById('matrix');
  on = typeof force === 'boolean' ? force : !on;
  canvas.classList.toggle('on', on);
  if (!on) { cancelAnimationFrame(raf); return; }
  if (reduced) { on = false; canvas.classList.remove('on'); toast('Mode sobre actif : pluie de données désactivée.'); return; }

  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const size = 16;
  const cols = Math.ceil(innerWidth / size);
  const drops = Array.from({ length: cols }, () => Math.random() * -50);
  const glyphs = 'アイウエオカキクケコサシスセソ01{}[]<>=+*#λπΣ∇'.split('');
  ctx.font = `${size}px "JetBrains Mono", monospace`;

  const draw = () => {
    ctx.fillStyle = 'rgba(7,7,11,0.12)';
    ctx.fillRect(0, 0, innerWidth, innerHeight);
    ctx.fillStyle = accent();
    drops.forEach((y, i) => {
      ctx.fillText(glyphs[(Math.random() * glyphs.length) | 0], i * size, y * size);
      drops[i] = y * size > innerHeight && Math.random() > 0.975 ? 0 : y + 1;
    });
    raf = requestAnimationFrame(draw);
  };
  draw();
}

export function initEasterEggs() {
  // Konami
  const code = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let i = 0;
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && on) { toggleMatrix(false); return; }
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    i = k === code[i] ? i + 1 : k === code[0] ? 1 : 0;
    if (i === code.length) { i = 0; toggleMatrix(); toast(on ? '↑↑↓↓←→←→BA — data rain activée (Échap pour couper)' : 'Data rain coupée'); }
  });

  // Footer : 5 clics
  const big = document.getElementById('footer-big');
  const egg = document.getElementById('footer-egg');
  let clicks = 0;
  big.addEventListener('click', () => {
    clicks++;
    if (clicks === 5) { clicks = 0; egg.textContent = '404 : bug introuvable. Embauche-moi plutôt ;)'; toggleMatrix(true); setTimeout(() => toggleMatrix(false), 3500); toast('Easter egg #2 trouvé'); }
  });
}
