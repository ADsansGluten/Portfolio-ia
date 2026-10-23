import { reduced, isMobile } from '../utils/env.js';

/**
 * Section LinkedIn : défilement « coverflow » piloté par le scroll.
 * Une piste haute (.li-track) contient un bloc collant (.li-sticky) ; la progression du scroll dans la piste
 * choisit le visuel actif. Indépendant de GSAP : fonctionne aussi dans la version sobre ou sans CDN.
 */
export function initLinkedIn(lenis) {
  const track = document.getElementById('li-track');
  if (!track) return;
  const stage = document.getElementById('li-stage');
  const wrap = document.getElementById('li-slides');
  const slides = [...wrap.querySelectorAll('.li-slide')];
  const N = slides.length;
  const quoteEl = document.getElementById('li-quote');
  const nameEl = document.getElementById('li-name');
  const idxEl = document.getElementById('li-idx');
  const barEl = document.getElementById('li-bar');
  const dots = [...document.querySelectorAll('.li-dot')];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const pad = (n) => String(n).padStart(2, '0');

  const maxScroll = () => Math.max(1, track.offsetHeight - innerHeight);
  const trackTop = () => track.getBoundingClientRect().top + scrollY;
  const goTo = (i) => {
    const y = trackTop() + (clamp(i, 0, N - 1) / (N - 1)) * maxScroll() + 2;
    if (lenis) lenis.scrollTo(y, { duration: 1.3 }); else window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
  };
  dots.forEach((d) => d.addEventListener('click', () => (reduced ? slides[+d.dataset.go].scrollIntoView({ behavior: 'auto', inline: 'center', block: 'nearest' }) : goTo(+d.dataset.go))));

  // Version sobre : pas d'effet collant, simple rangée défilable
  if (reduced) { dots.forEach((d) => (d.hidden = true)); return; }

  let target = 0, pos = 0, raf = 0, shown = -1;
  let mx = 0, my = 0, smx = 0, smy = 0;
  const measure = () => { target = clamp(-track.getBoundingClientRect().top / maxScroll(), 0, 1) * (N - 1); };

  function setActive(i) {
    if (i === shown) return;
    shown = i;
    const s = slides[i];
    quoteEl.classList.add('is-out');
    setTimeout(() => { quoteEl.textContent = s.dataset.quote; nameEl.textContent = s.dataset.name; quoteEl.classList.remove('is-out'); }, 170);
    idxEl.textContent = pad(i + 1);
    dots.forEach((d, k) => { d.classList.toggle('is-on', k === i); d.setAttribute('aria-current', k === i ? 'true' : 'false'); });
    slides.forEach((el, k) => el.setAttribute('aria-hidden', k === i ? 'false' : 'true'));
  }

  function render() {
    const spread = isMobile ? 58 : 64;
    slides.forEach((el, i) => {
      const d = i - pos, ad = Math.abs(d);
      const sc = 1 - Math.min(ad, 2.2) * 0.11;
      el.style.transform = `translate(-50%, -50%) translateX(${d * spread}%) translateZ(${-ad * 170}px) rotateY(${clamp(-d, -1.4, 1.4) * 24}deg) scale(${sc})`;
      el.style.opacity = String(clamp(1 - ad * 0.5, 0, 1));
      el.style.zIndex = String(100 - Math.round(ad * 10));
      el.style.setProperty('--glow', (Math.max(0, 1 - ad) * 0.6).toFixed(2));
      el.style.filter = ad > 0.05 ? `brightness(${(1 - Math.min(ad, 1.6) * 0.32).toFixed(2)})` : 'none';
    });
    wrap.style.transform = `rotateX(${(-smy * 4).toFixed(2)}deg) rotateY(${(smx * 6).toFixed(2)}deg)`;
    barEl.style.transform = `scaleX(${(pos / (N - 1)).toFixed(4)})`;
    setActive(clamp(Math.round(pos), 0, N - 1));
  }

  function loop() {
    pos += (target - pos) * 0.13;
    smx += (mx - smx) * 0.08; smy += (my - smy) * 0.08;
    const settled = Math.abs(target - pos) < 0.0008 && Math.abs(mx - smx) < 0.002 && Math.abs(my - smy) < 0.002;
    if (settled) { pos = target; smx = mx; smy = my; }
    render();
    raf = settled ? 0 : requestAnimationFrame(loop);
  }
  const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
  const onScroll = () => { measure(); kick(); };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  stage.addEventListener('pointermove', (e) => {
    const r = stage.getBoundingClientRect();
    mx = ((e.clientX - r.left) / r.width - 0.5) * 2; my = ((e.clientY - r.top) / r.height - 0.5) * 2; kick();
  }, { passive: true });
  stage.addEventListener('pointerleave', () => { mx = my = 0; kick(); });
  stage.tabIndex = 0;
  stage.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); goTo(Math.round(pos) + 1); }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); goTo(Math.round(pos) - 1); }
  });

  measure(); pos = target; render();
}
