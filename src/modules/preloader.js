import gsap from 'gsap';
import { reduced } from '../utils/env.js';

const LOGS = [
  ['init', 'embedding_space v2026.10'],
  ['load', 'tokenizer ............ ok'],
  ['load', 'weights (adrien.bin) .. ok'],
  ['warm', 'attention heads ....... 8/8'],
  ['link', 'portfolio ready'],
];

/** Animation « initialisation d'un modèle » (~1,8 s). Retourne une promesse résolue à la révélation. */
export function runPreloader() {
  const root = document.getElementById('preloader');
  const logs = document.getElementById('preloader-logs');
  const count = document.getElementById('preloader-count');
  const bar = document.getElementById('preloader-bar');
  const dur = reduced ? 0.3 : 1.8;

  return new Promise((resolve) => {
    const state = { v: 0 };
    let shown = 0;
    gsap.to(state, {
      v: 100, duration: dur, ease: 'power2.inOut',
      onUpdate() {
        const v = Math.round(state.v);
        count.textContent = String(v).padStart(3, '0');
        bar.style.width = v + '%';
        const target = Math.floor((v / 100) * LOGS.length);
        while (shown < target && shown < LOGS.length) {
          const [tag, msg] = LOGS[shown++];
          const line = document.createElement('span');
          line.innerHTML = `<b>[${tag}]</b> ${msg}`;
          logs.appendChild(line);
        }
      },
      onComplete() {
        root.setAttribute('aria-busy', 'false');
        gsap.to(root, {
          yPercent: -100, duration: reduced ? 0.01 : 0.9, ease: 'expo.inOut', delay: 0.15,
          onComplete() { root.remove(); resolve(); },
        });
      },
    });
  });
}
