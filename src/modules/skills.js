import { SKILLS, PROJECTS } from '../data/content.js';
import { reduced, accent, accentGlow, cssVar, isLight } from '../utils/env.js';

/**
 * Carte de compétences — constellation interactive (canvas 2D).
 *  - au centre : moi ; autour : 5 catégories ; autour de chaque catégorie : ses technos
 *  - la taille d'un point reflète le niveau (indicatif), la couleur la catégorie
 *  - les projets sont reliés aux technos qu'ils utilisent (traits pointillés)
 *  - survol / clic : le réseau s'illumine, des particules circulent sur les liens
 *  - filtres par catégorie, parallaxe discrète, apparition en cascade
 * Le placement est calculé une fois (relaxation anti-collision) : pas de simulation qui « tremble ».
 */

// Niveau indicatif sur 5, déduit du texte réel de content.js (rien n'est inventé)
function levelScore(t = '') {
  t = t.toLowerCase();
  if (t.includes('certifi') || t.includes('avanc') || t.includes('quotidien')) return 4;
  if (t.includes('interm') || t.includes('en pratique') || t.includes('pratique perso')) return 3;
  if (t.includes('en cours') || t.includes('sensibil')) return 2;
  return 1; // débutant / en apprentissage
}

const CAT_COLORS = {
  dark: { data: '#38bdf8', dev: '#f472b6', infra: '#fbbf24', tools: '#34d399' },
  light: { data: '#0284c7', dev: '#db2777', infra: '#d97706', tools: '#059669' },
};

export function initSkills({ onOpenProject }) {
  const canvas = document.getElementById('skills-canvas');
  const ctx = canvas.getContext('2d');
  const el = (id) => document.getElementById(id);
  const nameEl = el('skills-name'), levelEl = el('skills-level'), catEl = el('skills-cat'), pipsEl = el('skills-pips');
  const projEl = el('skills-projects'), projTitle = el('skills-projects-title'), relEl = el('skills-rel'), relTitle = el('skills-rel-title');
  const listEl = el('skills-list'), filtersEl = el('skills-filters');

  // ---------- Données ----------
  const nodes = [], byId = new Map();
  const add = (n) => { nodes.push(n); byId.set(n.id, n); return n; };
  const center = add({ id: 'me', type: 'me', label: 'AL', r: 24 });
  Object.entries(SKILLS.categories).forEach(([key, c]) => add({ id: 'cat:' + key, type: 'cat', cat: key, label: c.label, r: 13 }));
  PROJECTS.forEach((p) => add({ id: 'proj:' + p.slug, type: 'proj', label: p.title, slug: p.slug, r: 10 }));
  SKILLS.nodes.forEach((s) => add({ id: s.id, type: 'skill', label: s.label, cat: s.cat, level: s.level, score: levelScore(s.level), projects: s.projects, r: 4.5 + levelScore(s.level) * 1.5 }));
  nodes.forEach((n, i) => { n.phase = i * 1.7; n.delay = n.type === 'me' ? 0 : n.type === 'cat' ? 120 : n.type === 'proj' ? 420 : 280 + (i % 9) * 55; });

  const edges = []; // [a, b, kind]
  Object.keys(SKILLS.categories).forEach((k) => edges.push(['me', 'cat:' + k, 'hub']));
  SKILLS.nodes.forEach((s) => {
    edges.push([s.id, 'cat:' + s.cat, 'cat']);
    s.projects.forEach((p) => edges.push([s.id, 'proj:' + p, 'proj']));
  });
  const neighbors = new Map(nodes.map((n) => [n.id, new Set()]));
  edges.forEach(([a, b]) => { neighbors.get(a).add(b); neighbors.get(b).add(a); });

  listEl.innerHTML = SKILLS.nodes.map((s) => `<li>${s.label} — ${SKILLS.categories[s.cat].label} — ${s.level}</li>`).join('');

  // ---------- Couleurs ----------
  let colors = {};
  function readColors() {
    const set = CAT_COLORS[isLight() ? 'light' : 'dark'];
    const green = document.documentElement.dataset.theme === 'green';
    colors = { ai: accent(), ...set, tools: green ? (isLight() ? '#7c3aed' : '#a78bfa') : set.tools };
  }
  const colorOf = (n) => (n.cat ? colors[n.cat] : accentGlow());
  const hexA = (hex, a) => { // #rrggbb + alpha → rgba()
    const h = hex.replace('#', ''); const v = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
    return `rgba(${parseInt(v.slice(0, 2), 16)},${parseInt(v.slice(2, 4), 16)},${parseInt(v.slice(4, 6), 16)},${a})`;
  };

  // ---------- Filtres ----------
  let filter = null;
  const chips = [{ key: null, label: 'Tout' }, ...Object.entries(SKILLS.categories).map(([k, c]) => ({ key: k, label: c.label }))];
  filtersEl.innerHTML = chips.map((c) => `<button type="button" class="sk-chip${c.key === null ? ' is-on' : ''}" data-cat="${c.key ?? ''}" aria-pressed="${c.key === null}"><i></i>${c.label}</button>`).join('');
  filtersEl.addEventListener('click', (e) => {
    const b = e.target.closest('.sk-chip'); if (!b) return;
    filter = b.dataset.cat || null;
    filtersEl.querySelectorAll('.sk-chip').forEach((x) => { const on = (x.dataset.cat || null) === filter; x.classList.toggle('is-on', on); x.setAttribute('aria-pressed', String(on)); });
    if (selected && filter && selected.cat !== filter && selected.type !== 'proj') select(null); else redraw();
  });
  const paintChips = () => filtersEl.querySelectorAll('.sk-chip').forEach((x) => x.style.setProperty('--c', x.dataset.cat ? colors[x.dataset.cat] : accent()));

  // ---------- Placement ----------
  let W = 0, H = 0, dpr = 1, small = false;
  const PAD_TOP = 62;
  const labelW = (n) => { ctx.font = `${n.type === 'cat' ? 700 : n.type === 'proj' ? 600 : 400} ${n.type === 'cat' ? 12 : 11}px "JetBrains Mono", monospace`; return ctx.measureText(n.type === 'cat' ? n.label.toUpperCase() : n.label).width; };
  function layout() {
    small = W < 560;
    const cx = W / 2, cy = PAD_TOP + (H - PAD_TOP) / 2;
    const rx = W * (small ? 0.30 : 0.29), ry = (H - PAD_TOP) * (small ? 0.30 : 0.30);
    const unit = Math.max(0.62, Math.min(1.15, Math.min(W, H - PAD_TOP) / 500));
    center.bx = cx; center.by = cy;
    const cats = nodes.filter((n) => n.type === 'cat');
    cats.forEach((c, i) => {
      const a = -Math.PI / 2 + (i / cats.length) * Math.PI * 2;
      c.bx = cx + Math.cos(a) * rx; c.by = cy + Math.sin(a) * ry; c.dir = a;
      const kids = nodes.filter((n) => n.type === 'skill' && n.cat === c.cat);
      const m = kids.length, spread = m > 1 ? Math.min(0.75, 2.1 / m) : 0;
      kids.forEach((k, j) => {
        const aa = a + (j - (m - 1) / 2) * spread;
        const R = unit * (96 + (j % 2) * 34);
        k.bx = c.bx + Math.cos(aa) * R; k.by = c.by + Math.sin(aa) * R;
      });
    });
    const projs = nodes.filter((n) => n.type === 'proj');
    projs.forEach((p, i) => {
      const a = (i / projs.length) * Math.PI * 2 + 0.5;
      const pr = small ? 74 : Math.max(66, Math.min(W, H) * 0.11); p.bx = cx + Math.cos(a) * pr; p.by = cy + Math.sin(a) * pr;
    });
    // Relaxation : écarte les nœuds trop proches, garde tout dans le cadre
    const minD = (a, b) => (a.type === 'me' || b.type === 'me' ? 70 : small ? 52 : 70) * (a.type === 'proj' || b.type === 'proj' ? 0.9 : 1);
    for (let it = 0; it < 90; it++) {
      for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        if (a.type === 'me' && b.type === 'proj' || a.type === 'proj' && b.type === 'me') continue;
        let dx = b.bx - a.bx, dy = b.by - a.by; const d = Math.hypot(dx, dy) || 0.01, m = minD(a, b);
        if (d < m) { const f = (m - d) / 2; dx /= d; dy /= d; if (a.type !== 'me') { a.bx -= dx * f; a.by -= dy * f; } if (b.type !== 'me') { b.bx += dx * f; b.by += dy * f; } }
      }
      nodes.forEach((n) => {
        if (n.type === 'me') return;
        let lo = 24, hi = W - 24;
        if (n.type === 'skill') { // l'étiquette doit tenir dans le cadre : côté libre choisi selon la place restante
          const need = labelW(n) + n.r + 14;
          n.align = n.bx >= center.x ? 'left' : 'right';
          if (n.align === 'left' && n.bx + need > W - 8) n.align = n.bx - need > 8 ? 'right' : 'left';
          if (n.align === 'right' && n.bx - need < 8) n.align = n.bx + need < W - 8 ? 'left' : 'right';
          if (n.align === 'left') hi = W - need; else lo = need;
          if (hi < lo) { lo = 12; hi = W - 12; }
        } else if (n.type === 'cat' || n.type === 'proj') { const hw = labelW(n) / 2 + 8; lo = Math.max(lo, hw); hi = Math.min(hi, W - hw); }
        n.bx = Math.min(hi, Math.max(lo, n.bx)); n.by = Math.min(H - 22, Math.max(PAD_TOP + 8, n.by));
      });
    }
    nodes.forEach((n) => { n.x = n.bx; n.y = n.by; });
  }

  // ---------- Rendu ----------
  let hover = null, selected = null, t0 = 0, started = false, visible = false, raf = 0, px = 0, py = 0, tpx = 0, tpy = 0;
  const ease = (t) => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  function isLit(n, focus) {
    if (filter) {
      const inCat = n.cat === filter || n.type === 'me' || (n.type === 'proj' && SKILLS.nodes.some((s) => s.cat === filter && s.projects.includes(n.slug)));
      if (!inCat) return false;
    }
    if (!focus) return true;
    return n === focus || neighbors.get(focus.id).has(n.id);
  }

  function draw(now = performance.now()) {
    const t = reduced ? 1e6 : now - t0;
    const FG = cssVar('--fg', '#edebf5'), FGRGB = cssVar('--fg-rgb', '237,235,245'), BG = cssVar('--bg', '#07070b');
    const focus = hover || selected;
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.translate(px, py);

    // lueur centrale + orbites
    const g = ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, Math.min(W, H) * 0.55);
    g.addColorStop(0, hexA(accent(), isLight() ? 0.16 : 0.22)); g.addColorStop(1, hexA(accent(), 0));
    ctx.fillStyle = g; ctx.fillRect(-px, -py, W, H);
    ctx.lineWidth = 1; ctx.strokeStyle = `rgba(${FGRGB},0.06)`; ctx.setLineDash([2, 7]);
    [0.5, 1].forEach((k) => { ctx.beginPath(); ctx.ellipse(center.x, center.y, W * (small ? 0.30 : 0.29) * k, (H - PAD_TOP) * 0.30 * k, 0, 0, 7); ctx.stroke(); });
    ctx.setLineDash([]);

    const appear = (n) => (reduced ? 1 : clamp((t - n.delay) / 650, 0, 1));
    const floatOf = (n) => (reduced ? [0, 0] : [Math.sin(now / 1500 + n.phase) * 2.6, Math.cos(now / 1800 + n.phase * 1.3) * 2.6]);
    nodes.forEach((n) => { const [fx, fy] = floatOf(n); n.x = n.bx + fx * (n.type === 'me' ? 0 : 1); n.y = n.by + fy * (n.type === 'me' ? 0 : 1); });

    // liens
    for (const [ia, ib, kind] of edges) {
      const a = byId.get(ia), b = byId.get(ib);
      const k = Math.min(appear(a), appear(b)); if (k <= 0) continue;
      const lit = isLit(a, focus) && isLit(b, focus);
      const on = focus && (a === focus || b === focus);
      const col = kind === 'hub' ? accent() : colorOf(a.type === 'skill' ? a : b.type === 'cat' ? b : a);
      ctx.globalAlpha = k * (lit ? 1 : 0.1);
      ctx.strokeStyle = on ? hexA(col, 0.95) : kind === 'hub' ? `rgba(${FGRGB},0.14)` : hexA(col, kind === 'proj' ? 0.3 : 0.4);
      ctx.lineWidth = on ? 1.8 : 1;
      ctx.setLineDash(kind === 'proj' ? [4, 5] : []);
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, nx = -(b.y - a.y) * 0.08, ny = (b.x - a.x) * 0.08;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo(mx + nx, my + ny, b.x, b.y); ctx.stroke();
      // particules sur les liens du nœud en focus
      if (on && !reduced) {
        ctx.setLineDash([]);
        for (let q = 0; q < 2; q++) {
          const u = ((now / 1400 + q * 0.5 + a.phase) % 1);
          const qx = (1 - u) * (1 - u) * a.x + 2 * (1 - u) * u * (mx + nx) + u * u * b.x;
          const qy = (1 - u) * (1 - u) * a.y + 2 * (1 - u) * u * (my + ny) + u * u * b.y;
          ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 10;
          ctx.beginPath(); ctx.arc(qx, qy, 2.4, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
        }
      }
    }
    ctx.setLineDash([]);

    // nœuds
    for (const n of nodes) {
      const k = appear(n); if (k <= 0) continue;
      const lit = isLit(n, focus);
      const s = ease(k) * (n === focus ? 1.18 : 1);
      ctx.globalAlpha = k * (lit ? 1 : 0.14);
      const col = n.type === 'me' ? accent() : colorOf(n);
      if (n.type === 'me') {
        const ring = (now / 2600) % 1;
        if (!reduced) { ctx.strokeStyle = hexA(col, (1 - ring) * 0.35); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(n.x, n.y, n.r * s + ring * 38, 0, 7); ctx.stroke(); }
        ctx.fillStyle = BG; ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.shadowColor = col; ctx.shadowBlur = 24;
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r * s, 0, 7); ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
        ctx.fillStyle = FG; ctx.font = `700 ${Math.round(14 * s)}px "Space Grotesk", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('AL', n.x, n.y + 1); ctx.textBaseline = 'alphabetic';
      } else if (n.type === 'cat') {
        ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = lit ? 22 : 0;
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r * s, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
        ctx.strokeStyle = hexA(col, 0.4); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(n.x, n.y, n.r * s + 6, 0, 7); ctx.stroke();
      } else if (n.type === 'proj') {
        const sz = n.r * 2 * s; ctx.fillStyle = BG; ctx.strokeStyle = accentGlow(); ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.roundRect(n.x - sz / 2, n.y - sz / 2, sz, sz, 4); ctx.fill(); ctx.stroke();
        ctx.fillStyle = accentGlow(); ctx.beginPath(); ctx.roundRect(n.x - sz / 5, n.y - sz / 5, sz * 0.4, sz * 0.4, 2); ctx.fill();
      } else {
        ctx.fillStyle = n === focus || (focus && lit) ? col : hexA(col, 0.9);
        ctx.shadowColor = col; ctx.shadowBlur = n === focus ? 22 : lit && focus ? 10 : 0;
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r * s, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
        ctx.strokeStyle = `rgba(${FGRGB},0.5)`; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(n.x, n.y, n.r * s + 3, 0, 7); ctx.stroke();
      }
    }

    // étiquettes (par-dessus, dans l'ordre pour que le focus passe devant)
    ctx.textBaseline = 'alphabetic';
    const order = [...nodes].sort((a, b) => (a === focus) - (b === focus));
    for (const n of order) {
      if (n.type === 'me') continue;
      const k = appear(n); if (k < 0.7) continue;
      const lit = isLit(n, focus);
      const showSkill = !small || n === focus || (focus && lit) || n === selected;
      if (n.type === 'skill' && !showSkill) continue;
      if (n.type === 'proj' && small && n !== focus && !(focus && lit)) continue;
      ctx.globalAlpha = (k - 0.7) / 0.3 * (lit ? 1 : 0.14);
      const col = colorOf(n);
      let text = n.label, size = 11, fill = `rgba(${FGRGB},${n === focus ? 1 : 0.78})`, dx = 0, dy = 0, align = 'center';
      if (n.type === 'cat') { text = n.label.toUpperCase(); size = small ? 11 : 12; fill = col; dy = -(n.r + 12); ctx.font = `700 ${size}px "JetBrains Mono", monospace`; }
      else if (n.type === 'proj') { size = 11; fill = accentGlow(); dy = n.r + 17; ctx.font = `600 ${size}px "JetBrains Mono", monospace`; }
      else { align = n.align || (n.bx >= center.x ? 'left' : 'right'); dx = (align === 'left' ? 1 : -1) * (n.r + 9); dy = 4; ctx.font = `${size}px "JetBrains Mono", monospace`; }
      ctx.textAlign = align;
      if (n === focus) { // pastille derrière le texte pour la lisibilité
        const w = ctx.measureText(text).width + 12, hx = align === 'left' ? n.x + dx - 6 : align === 'right' ? n.x + dx - w + 6 : n.x - w / 2;
        ctx.fillStyle = hexA(isLight() ? '#ffffff' : '#07070b', 0.85); ctx.beginPath(); ctx.roundRect(hx, n.y + dy - 14, w, 20, 6); ctx.fill();
      }
      ctx.fillStyle = fill; ctx.fillText(text, n.x + dx, n.y + dy);
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  // ---------- Boucle (active seulement quand visible) ----------
  function frame(now) {
    px += (tpx - px) * 0.08; py += (tpy - py) * 0.08;
    draw(now);
    raf = visible ? requestAnimationFrame(frame) : 0;
  }
  const redraw = () => { if (reduced || !visible) draw(); };
  function start() { if (!started) { started = true; t0 = performance.now(); } if (!raf && !reduced) raf = requestAnimationFrame(frame); }

  // ---------- Interaction ----------
  const local = (e) => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left - px, e.clientY - r.top - py]; };
  const pick = (x, y) => {
    let best = null, bd = 1e9;
    for (const n of nodes) {
      if (n.type === 'me' || !isLit(n, null)) continue;
      const d = Math.hypot(n.x - x, n.y - y), rad = n.r + (small ? 14 : 11);
      if (d < rad && d < bd) { best = n; bd = d; }
    }
    return best;
  };

  function pips(score, col) {
    pipsEl.hidden = false; pipsEl.innerHTML = '';
    for (let i = 1; i <= 5; i++) { const s = document.createElement('span'); if (i <= score) { s.className = 'on'; s.style.background = col; s.style.boxShadow = `0 0 10px ${col}`; } pipsEl.appendChild(s); }
  }
  function chipBtn(label, slug, id) {
    const li = document.createElement('li'); const a = document.createElement('a');
    if (slug) { a.href = '#/projet/' + slug; a.addEventListener('click', (e) => { e.preventDefault(); onOpenProject(slug); }); }
    else { a.href = '#skills'; a.addEventListener('click', (e) => { e.preventDefault(); select(byId.get(id)); }); }
    a.textContent = (slug ? '→ ' : '') + label; li.appendChild(a); return li;
  }
  function select(n) {
    selected = n;
    projEl.innerHTML = ''; relEl.innerHTML = ''; projTitle.hidden = relTitle.hidden = true; pipsEl.hidden = true; catEl.hidden = true;
    if (!n) { nameEl.textContent = 'Aucun nœud sélectionné'; levelEl.textContent = 'Survole ou clique une techno.'; redraw(); return; }
    nameEl.textContent = n.label;
    const col = colorOf(n);
    if (n.type === 'skill') {
      catEl.hidden = false; catEl.textContent = SKILLS.categories[n.cat].label; catEl.style.setProperty('--c', col);
      levelEl.textContent = `Niveau : ${n.level}`;
      pips(n.score, col);
      projTitle.hidden = false;
      n.projects.forEach((slug) => projEl.appendChild(chipBtn(PROJECTS.find((x) => x.slug === slug).title, slug)));
      if (!n.projects.length) { const li = document.createElement('li'); li.className = 'dim'; li.textContent = 'Pas encore relié à un projet publié.'; projEl.appendChild(li); }
    } else if (n.type === 'cat') {
      const kids = nodes.filter((x) => x.type === 'skill' && x.cat === n.cat);
      catEl.hidden = false; catEl.textContent = 'Catégorie'; catEl.style.setProperty('--c', col);
      levelEl.textContent = `${kids.length} compétences`;
      relTitle.hidden = false; kids.forEach((k) => relEl.appendChild(chipBtn(k.label, null, k.id)));
    } else {
      catEl.hidden = false; catEl.textContent = 'Projet'; catEl.style.setProperty('--c', accentGlow());
      levelEl.textContent = 'Ouvre la fiche détaillée.';
      projTitle.hidden = false; projEl.appendChild(chipBtn(n.label, n.slug));
      const used = SKILLS.nodes.filter((s) => s.projects.includes(n.slug));
      if (used.length) { relTitle.hidden = false; used.forEach((s) => relEl.appendChild(chipBtn(s.label, null, s.id))); }
    }
    redraw();
  }

  canvas.addEventListener('pointermove', (e) => {
    const [x, y] = local(e);
    if (e.pointerType === 'mouse' && !reduced) { const r = canvas.getBoundingClientRect(); tpx = -((e.clientX - r.left) / r.width - 0.5) * 12; tpy = -((e.clientY - r.top) / r.height - 0.5) * 8; }
    const n = pick(x, y);
    if (n !== hover) { hover = n; canvas.style.cursor = n ? 'pointer' : ''; canvas.dataset.cursor = n ? 'link' : ''; redraw(); }
  });
  canvas.addEventListener('pointerleave', () => { hover = null; tpx = tpy = 0; canvas.style.cursor = ''; redraw(); });
  canvas.addEventListener('click', (e) => {
    const [x, y] = local(e); const n = pick(x, y);
    if (n) { select(n); if (n.type === 'proj' && e.pointerType === 'mouse') onOpenProject(n.slug); }
    else select(null);
  });

  // ---------- Cycle de vie ----------
  function resize() {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    layout(); redraw(); if (reduced) draw();
  }
  new ResizeObserver(resize).observe(canvas);
  const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) start(); }, { threshold: 0.12 });
  io.observe(canvas);
  window.addEventListener('themechange', () => { readColors(); paintChips(); select(selected); draw(); });
  readColors(); paintChips(); resize();
  if (reduced) draw();
}
