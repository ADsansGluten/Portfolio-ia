// Lit les compétences dans Supabase PENDANT LE BUILD et les écrit dans src/data/skills.generated.js.
// Aucune clé n'arrive dans le navigateur ni dans le dépôt : elle vient de l'environnement
// (secrets GitHub Actions, ou fichier .env.local en local, qui est ignoré par Git).
//
// Variables : SUPABASE_URL, SUPABASE_ANON_KEY, (optionnel) SUPABASE_TABLE (défaut : Portfolio)
// Plan B : si quelque chose manque ou échoue, on ne touche à rien et le site garde les compétences de content.js.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const OUT = new URL('src/data/skills.generated.js', root);
const CATS = ['ai', 'data', 'dev', 'infra', 'tools'];

// Petit lecteur de .env.local / .env (sans dépendance). L'environnement réel reste prioritaire.
for (const f of ['.env.local', '.env']) {
  const u = new URL(f, root);
  if (!existsSync(u)) continue;
  for (const line of readFileSync(u, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
}

const warn = (msg) => console.log(`${process.env.GITHUB_ACTIONS ? '::warning::' : '⚠ '}fetch-skills : ${msg} → plan B (compétences de content.js).`);
const url = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
const key = process.env.SUPABASE_ANON_KEY || '';
const table = process.env.SUPABASE_TABLE || 'Portfolio';
if (!url || !key) { warn('SUPABASE_URL / SUPABASE_ANON_KEY absents'); process.exit(0); }

try {
  const res = await fetch(`${url}/rest/v1/${encodeURIComponent(table)}?select=id,label,cat,level,projects`, {
    headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/json' },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const rows = await res.json();
  if (!Array.isArray(rows) || !rows.length) throw new Error('table vide ou réponse inattendue');

  // L'ordre des nœuds influe sur la mise en page du graphe : on garde l'ordre actuel de content.js,
  // puis les nouveautés par ordre alphabétique.
  const known = [...readFileSync(new URL('src/data/content.js', root), 'utf8').matchAll(/\{ id: '([a-z0-9-]+)', label:/g)].map((m) => m[1]);
  const rank = (id) => { const i = known.indexOf(id); return i < 0 ? 1e6 : i; };

  const nodes = rows.map((r) => ({
    id: String(r.id ?? '').trim(),
    label: String(r.label ?? '').trim(),
    cat: String(r.cat ?? '').trim(),
    level: String(r.level ?? '').trim(),
    projects: String(r.projects ?? '').split(',').map((s) => s.trim()).filter(Boolean),
  })).filter((n) => {
    const ok = n.id && n.label && n.level && CATS.includes(n.cat);
    if (!ok) console.log(`  ignoré (champ manquant ou catégorie inconnue) : ${JSON.stringify(n)}`);
    return ok;
  }).sort((a, b) => rank(a.id) - rank(b.id) || a.label.localeCompare(b.label, 'fr'));
  if (!nodes.length) throw new Error('aucune ligne valide');

  writeFileSync(OUT, `// Fichier généré par scripts/fetch-skills.mjs — ne pas modifier à la main.\nexport const SKILLS_REMOTE = ${JSON.stringify(nodes, null, 2)};\n`);
  console.log(`fetch-skills : ${nodes.length} compétences lues dans Supabase (${table}).`);
} catch (e) {
  warn(e.message);
}
