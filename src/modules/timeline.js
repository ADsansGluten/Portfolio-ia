import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TIMELINE } from '../data/content.js';
import { reduced } from '../utils/env.js';

const KIND = { study: 'formation', work: 'expérience', intern: 'stage', project: 'projet' };

/** Timeline verticale : la ligne se remplit au scroll, chaque étape entre en cascade. */
export function initTimeline() {
  const ol = document.getElementById('timeline');
  ol.innerHTML = '<span class="timeline__progress" aria-hidden="true"></span>' + TIMELINE.map((t) => `
    <li class="tl-item" data-kind="${t.kind}">
      <p class="tl-item__date mono">${t.date}<br><span style="color:var(--accent-glow)">${KIND[t.kind] || ''}</span></p>
      <div>
        <h3 class="tl-item__title">${t.title}</h3>
        <p class="tl-item__place mono">${t.place}</p>
        <p class="tl-item__text">${t.text}</p>
      </div>
    </li>`).join('');

  if (reduced) { ol.querySelector('.timeline__progress').style.transform = 'scaleY(1)'; return; }

  gsap.to('.timeline__progress', {
    scaleY: 1, ease: 'none',
    scrollTrigger: { trigger: ol, start: 'top 70%', end: 'bottom 70%', scrub: true },
  });
  gsap.utils.toArray('.tl-item').forEach((item) => {
    gsap.from(item, { opacity: 0, x: 40, duration: 0.9, ease: 'expo.out', scrollTrigger: { trigger: item, start: 'top 85%' } });
  });
  ScrollTrigger.refresh();
}
