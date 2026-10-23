import { reduced, isMobile, accent, accentGlow } from '../utils/env.js';

/**
 * HERO — champ d'embeddings.
 * Des milliers de points flottent en clusters « sémantiques ». Le curseur joue le rôle
 * d'une REQUÊTE : les points proches sont attirés vers lui, puis reliés à leurs voisins
 * (graphe de plus proches voisins), et retombent dans leur cluster quand il s'éloigne.
 * Three.js est chargé en différé (import dynamique) pour ne pas bloquer le premier rendu.
 */
export async function initHero(canvas) {
  let THREE;
  try { THREE = await import('three'); } catch { canvas.style.display = 'none'; return; }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'high-performance' });
  } catch { canvas.style.display = 'none'; return; } // pas de WebGL : le hero reste lisible sans

  const N = isMobile ? 1400 : 4200;
  const CLUSTERS = 7;
  const RADIUS = 2.4; // rayon d'influence de la « requête »
  const MAX_LINKED = 46;
  const MAX_SEG = 150;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 60);
  camera.position.z = 9;
  const group = new THREE.Group();
  scene.add(group);

  // --- Génération des clusters (gaussiennes 3D) ---
  const rand = (() => { let s = 7; return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646; })(); // déterministe
  const gauss = () => (rand() + rand() + rand() + rand() - 2) * 1.2;
  const centers = Array.from({ length: CLUSTERS }, () => new THREE.Vector3(gauss() * 2.6, gauss() * 1.7, gauss() * 1.8));
  const base = new Float32Array(N * 3);
  const pos = new Float32Array(N * 3);
  const size = new Float32Array(N);
  const mixv = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const c = centers[i % CLUSTERS];
    const spread = 0.55 + (i % CLUSTERS) * 0.07;
    base[i * 3] = pos[i * 3] = c.x + gauss() * spread;
    base[i * 3 + 1] = pos[i * 3 + 1] = c.y + gauss() * spread;
    base[i * 3 + 2] = pos[i * 3 + 2] = c.z + gauss() * spread;
    size[i] = 0.6 + rand() * 1.6;
    mixv[i] = rand() < 0.08 ? 1 : rand() * 0.35; // quelques points « chauds »
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  geo.setAttribute('aMix', new THREE.BufferAttribute(mixv, 1));

  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: {
      uPix: { value: Math.min(window.devicePixelRatio, 1.75) },
      uColor: { value: new THREE.Color(accent()) },
      uGlow: { value: new THREE.Color(accentGlow()) },
    },
    vertexShader: /* glsl */ `
      uniform float uPix; attribute float aSize; attribute float aMix; varying float vMix;
      void main(){
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize * uPix * (7.0 / -mv.z) * 2.2;
        gl_Position = projectionMatrix * mv; vMix = aMix;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; uniform vec3 uGlow; varying float vMix;
      void main(){
        float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard;
        float a = smoothstep(0.5, 0.0, d);
        gl_FragColor = vec4(mix(uColor, uGlow, vMix), a * (0.28 + vMix * 0.7));
      }`,
  });
  group.add(new THREE.Points(geo, mat));

  // --- Lignes du graphe de voisinage (desktop uniquement) ---
  let lineGeo, lineMat, linePos;
  if (!isMobile) {
    linePos = new Float32Array(MAX_SEG * 2 * 3);
    lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3).setUsage(THREE.DynamicDrawUsage));
    lineGeo.setDrawRange(0, 0);
    lineMat = new THREE.LineBasicMaterial({ color: new THREE.Color(accentGlow()), transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false });
    group.add(new THREE.LineSegments(lineGeo, lineMat));
  }

  // --- Taille / résize ---
  const resize = () => {
    const { clientWidth: w, clientHeight: h } = canvas.parentElement;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.z = w / h < 0.8 ? 12 : 9;
    camera.updateProjectionMatrix();
    mat.uniforms.uPix.value = Math.min(window.devicePixelRatio, 1.75);
    if (reduced) renderer.render(scene, camera);
  };
  new ResizeObserver(resize).observe(canvas.parentElement);
  resize();

  // Changement de palette
  window.addEventListener('themechange', () => {
    mat.uniforms.uColor.value.set(accent());
    mat.uniforms.uGlow.value.set(accentGlow());
    lineMat?.color.set(accentGlow());
  });

  if (reduced) { renderer.render(scene, camera); return; } // version sobre : image fixe

  // --- Pointeur → point « requête » dans l'espace ---
  const ndc = new THREE.Vector2(0, 0);
  const smooth = new THREE.Vector2(0, 0);
  let lastMove = 0;
  let strength = 0;
  window.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1));
    lastMove = performance.now();
  }, { passive: true });

  const raycaster = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const q = new THREE.Vector3();
  const qLocal = new THREE.Vector3();

  // Pause hors écran
  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);

  const linked = new Int32Array(MAX_LINKED);
  const clock = new THREE.Clock();

  function frame() {
    requestAnimationFrame(frame);
    if (!visible || document.hidden) return;
    const t = clock.getElapsedTime();

    smooth.lerp(ndc, 0.08);
    group.rotation.y += ((smooth.x * 0.25 + t * 0.03) - group.rotation.y) * 0.03;
    group.rotation.x += ((-smooth.y * 0.12) - group.rotation.x) * 0.03;
    group.updateMatrixWorld();

    // La requête reste « active » 1,6 s après le dernier mouvement, puis relâche doucement.
    const active = performance.now() - lastMove < 1600;
    strength += ((active ? 1 : 0) - strength) * 0.06;

    raycaster.setFromCamera(smooth, camera);
    raycaster.ray.intersectPlane(plane, q);
    qLocal.copy(q);
    group.worldToLocal(qLocal);

    let nLinked = 0;
    for (let i = 0; i < N; i++) {
      const i3 = i * 3;
      const bx = base[i3], by = base[i3 + 1], bz = base[i3 + 2];
      // dérive organique
      const dx = Math.sin(t * 0.4 + i) * 0.04, dy = Math.cos(t * 0.35 + i * 1.3) * 0.04;
      let tx = bx + dx, ty = by + dy, tz = bz;

      if (strength > 0.01) {
        const ex = qLocal.x - bx, ey = qLocal.y - by, ez = qLocal.z - bz;
        const d = Math.sqrt(ex * ex + ey * ey + ez * ez);
        if (d < RADIUS) {
          const f = (1 - d / RADIUS) ** 2 * 0.6 * strength;
          tx += ex * f; ty += ey * f; tz += ez * f;
          if (f > 0.22 && nLinked < MAX_LINKED) linked[nLinked++] = i;
        }
      }
      pos[i3] += (tx - pos[i3]) * 0.07;
      pos[i3 + 1] += (ty - pos[i3 + 1]) * 0.07;
      pos[i3 + 2] += (tz - pos[i3 + 2]) * 0.07;
    }
    geo.attributes.position.needsUpdate = true;

    // Graphe de voisinage entre les points capturés
    if (lineGeo) {
      let s = 0;
      for (let a = 0; a < nLinked && s < MAX_SEG; a++) {
        const ia = linked[a] * 3;
        for (let b = a + 1; b < nLinked && s < MAX_SEG; b++) {
          const ib = linked[b] * 3;
          const dx = pos[ia] - pos[ib], dy = pos[ia + 1] - pos[ib + 1], dz = pos[ia + 2] - pos[ib + 2];
          if (dx * dx + dy * dy + dz * dz < 0.55) {
            const o = s * 6;
            linePos[o] = pos[ia]; linePos[o + 1] = pos[ia + 1]; linePos[o + 2] = pos[ia + 2];
            linePos[o + 3] = pos[ib]; linePos[o + 4] = pos[ib + 1]; linePos[o + 5] = pos[ib + 2];
            s++;
          }
        }
      }
      lineGeo.setDrawRange(0, s * 2);
      lineGeo.attributes.position.needsUpdate = true;
      lineMat.opacity = 0.15 + 0.5 * strength;
    }
    renderer.render(scene, camera);
  }
  frame();
}
