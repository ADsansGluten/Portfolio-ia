import { SKILLS, PROJECTS } from '../data/content.js';
import { reduced, accent, accentGlow } from '../utils/env.js';

/**
 * Graphe de compétences (canvas 2D).
 * Trois types de nœuds : catégories (hubs), technos, projets. Une mini simulation
 * de forces (ressort vers l'ancre + répulsion) les place ; clic = sélection.
 * En reduced-motion, la simulation est calculée d'un coup, sans animation.
 */
export function initSkills({ onOpenProject }) {
  const canvas = document.getElementById('skills-canvas');
  const ctx = canvas.getContext('2d');
  const nameEl = document.getElementById('skills-name');
  const levelEl = document.getElementById('skills-level');
  const projEl = document.getElementById('skills-projects');
  const listEl = document.getElementById('skills-list');

  // --- Construction du graphe ---
  const nodes = [];
  const byId = new Map();
  const add = (n) => { nodes.push(n); byId.set(n.id, n); return n; };

  Object.entries(SKILLS.categories).forEach(([key, c]) => add({ id: 'cat:' + key, type: 'cat', label: c.label, angle: c.angle, r: 9 }));
  PROJECTS.forEach((p, i) => add({ id: 'proj:' + p.slug, type: 'proj', label: p.title, slug: p.slug, angle: (i / PROJECTS.length) * Math.PI * 2 + 0.6, r: 8 }));
  SKILLS.nodes.forEach((s) => add({ id: s.id, type: 'skill', label: s.label, cat: s.cat, level: s.level, projects: s.projects, r: 5.5 }));

  const edges = [];
  SKILLS.nodes.forEach((s) => {
    edges.push([s.id, 'cat:' + s.cat, 'cat']);
    s.projects.forEach((p) => edges.push([s.id, 'proj:' + p, 'proj']));
  });
  const neighbors = new Map(nodes.map((n) => [n.id, new Set()]));
  edges.forEach(([a, b]) => { neighbors.get(a).add(b); neighbors.get(b).add(a); });

  // Liste accessible (lecteurs d'écran)
  listEl.innerHTML = SKILLS.nodes.map((s) => `<li>${s.label} — ${SKILLS.categories[s.cat].label} — ${s.level}</li>`).join('');

  // --- Dimensions & ancres ---
  let W = 0, H = 0, dpr = 1;
  const anchor = (n) => {
    const cx = W / 2, cy = H / 2;
    if (n.type === 'cat') return { x: cx + Math.cos(n.angle) * W * 0.34, y: cy + Math.sin(n.angle) * H * 0.34 };
    if (n.type === 'proj') return { x: cx + Math.cos(n.angle) * Math.min(W, H) * 0.12, y: cy + Math.sin(n.angle) * Math.min(W, H) * 0.12 };
    const hub = byId.get('cat:' + n.cat);
    const h = anchor(hub);
    return { x: (h.x * 2 + cx) / 3, y: (h.y * 2 + cy) / 3 }; // entre le hub et le centre
  };

  function resize() {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    nodes.forEach((n) => {
      const a = anchor(n);
      if (n.x === undefined) { n.x = a.x + (Math.random() - 0.5) * 60; n.y = a.y + (Math.random() - 0.5) * 60; n.vx = n.vy = 0; }
    });
    energy = 1;
    if (reduced) { for (let i = 0; i < 300; i++) step(); draw(); } else kick();
  }

  // --- Simulation ---
  let energy = 1;
  function step() {
    for (const n of nodes) {
      const a = anchor(n);
      const k = n.type === 'cat' ? 0.06 : n.type === 'proj' ? 0.03 : 0.012;
      n.vx += (a.x - n.x) * k; n.vy += (a.y - n.y) * k;
    }
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        let dx = a.x - b.x, dy = a.y - b.y;
        const d2 = dx * dx + dy * dy + 0.01, min = 74;
        if (d2 < min * min) {
          const d = Math.sqrt(d2), f = ((min - d) / min) * 0.9;
          dx /= d; dy /= d;
          a.vx += dx * f; a.vy += dy * f; b.vx -= dx * f; b.vy -= dy * f;
        }
      }
    }
    // ressorts des arêtes
    for (const [ia, ib] of edges) {
      const a = byId.get(ia), b = byId.get(ib);
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1;
      const f = (d - 90) * 0.0025;
      a.vx += (dx / d) * f; a.vy += (dy / d) * f; b.vx -= (dx / d) * f; b.vy -= (dy / d) * f;
    }
    let e = 0;
    for (const n of nodes) {
      n.vx *= 0.82; n.vy *= 0.82;
      n.x = Math.min(W - 16, Math.max(16, n.x + n.vx));
      n.y = Math.min(H - 16, Math.max(16, n.y + n.vy));
      e += Math.abs(n.vx) + Math.abs(n.vy);
    }
    energy = e;
  }

  let running = false;
  function kick() {
    if (running || reduced) return;
    running = true;
    const loop = () => {
      step(); draw();
      if (energy > 0.15 || hover || dragging) requestAnimationFrame(loop); else running = false;
    };
    requestAnimationFrame(loop);
  }

  // --- Rendu ---
  let hover = null, selected = null, dragging = null, t0 = performance.now();
  function draw() {
    const A = accent(), G = accentGlow();
    ctx.clearRect(0, 0, W, H);
    const focus = hover || selected;
    const near = focus ? neighbors.get(focus.id) : null;
    const lit = (n) => !focus || n === focus || near.has(n.id);

    // arêtes
    ctx.lineWidth = 1;
    for (const [ia, ib, kind] of edges) {
      const a = byId.get(ia), b = byId.get(ib);
      const on = focus && (a === focus || b === focus);
      ctx.strokeStyle = on ? G : 'rgba(255,255,255,0.10)';
      ctx.globalAlpha = focus && !on ? 0.35 : 1;
      if (kind === 'proj') ctx.setLineDash([4, 4]); else ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    ctx.setLineDash([]); ctx.globalAlpha = 1;

    // nœuds
    for (const n of nodes) {
      const on = lit(n);
      ctx.globalAlpha = on ? 1 : 0.25;
      const pulse = n === focus ? 1 + Math.sin((performance.now() - t0) / 220) * 0.12 : 1;
      if (n.type === 'cat') {
        ctx.fillStyle = A; ctx.shadowColor = A; ctx.shadowBlur = 18;
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r * pulse, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
        label(n, 12, '#edebf5', true);
      } else if (n.type === 'proj') {
        ctx.fillStyle = '#07070b'; ctx.strokeStyle = G; ctx.lineWidth = 1.5;
        const s = n.r * 1.6 * pulse;
        ctx.beginPath(); ctx.rect(n.x - s / 2, n.y - s / 2, s, s); ctx.fill(); ctx.stroke();
        label(n, 11, G, false);
      } else {
        ctx.fillStyle = n === focus ? G : '#edebf5';
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r * pulse, 0, 7); ctx.fill();
        label(n, 11, 'rgba(237,235,245,0.78)', false);
      }
    }
    ctx.globalAlpha = 1;
  }
  function label(n, size, color, upper) {
    ctx.font = `${size}px "JetBrains Mono", monospace`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.fillText(upper ? n.label.toUpperCase() : n.label, n.x, n.y + n.r + 15);
  }

  // --- Interaction ---
  const pick = (x, y) => {
    let best = null, bd = 22;
    for (const n of nodes) { const d = Math.hypot(n.x - x, n.y - y); if (d < Math.max(bd, 0) && d < n.r + 16) { best = n; bd = d; } }
    return best;
  };
  const local = (e) => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };

  function select(n) {
    selected = n;
    projEl.innerHTML = '';
    if (!n) { nameEl.textContent = 'Aucun nœud sélectionné'; levelEl.textContent = 'Survole ou clique une techno.'; draw(); return; }
    nameEl.textContent = n.label;
    if (n.type === 'skill') {
      levelEl.textContent = `Niveau : ${n.level}`;
      n.projects.forEach((slug) => addProjLink(slug));
      if (!n.projects.length) { const li = document.createElement('li'); li.textContent = 'Pas encore relié à un projet publié.'; projEl.appendChild(li); }
    } else if (n.type === 'cat') {
      const skills = SKILLS.nodes.filter((s) => 'cat:' + s.cat === n.id);
      levelEl.textContent = `${skills.length} compétences`;
    } else {
      levelEl.textContent = 'Projet — ouvre la fiche détaillée.';
      addProjLink(n.slug);
    }
    draw();
  }
  function addProjLink(slug) {
    const p = PROJECTS.find((x) => x.slug === slug);
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = '#/projet/' + slug; a.textContent = '→ ' + p.title;
    a.addEventListener('click', (e) => { e.preventDefault(); onOpenProject(slug); });
    li.appendChild(a); projEl.appendChild(li);
  }

  canvas.addEventListener('pointermove', (e) => {
    const [x, y] = local(e);
    if (dragging) { dragging.x = x; dragging.y = y; dragging.vx = dragging.vy = 0; kick(); draw(); return; }
    const n = pick(x, y);
    if (n !== hover) {
      hover = n;
      canvas.style.cursor = n ? 'pointer' : '';
      canvas.dataset.cursor = n ? 'link' : '';
      reduced ? draw() : kick();
    }
  });
  canvas.addEventListener('pointerleave', () => { hover = null; dragging = null; reduced ? draw() : kick(); });
  canvas.addEventListener('pointerdown', (e) => {
    const [x, y] = local(e); const n = pick(x, y);
    if (n && n.type !== 'cat') { dragging = n; canvas._moved = false; }
  });
  canvas.addEventListener('pointerup', (e) => {
    const [x, y] = local(e); const n = pick(x, y);
    dragging = null;
    if (n) { select(n); if (n.type === 'proj' && e.pointerType === 'mouse') onOpenProject(n.slug); }
    else select(null);
    kick();
  });

  new ResizeObserver(resize).observe(canvas);
  window.addEventListener('themechange', draw);
  resize();
}
