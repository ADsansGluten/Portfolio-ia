# Portfolio — Adrien Lavigne (Direction A « Ultraviolet Latent Space »)

Vite + JavaScript natif · GSAP (ScrollTrigger) · Lenis · Three.js (hero) · Canvas 2D (compétences).

## Lancer en local

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # génère /dist
npm run preview    # teste le build
```

## Remplacer tes contenus

Presque tout est dans **`src/data/content.js`** : liens, compétences, projets, parcours, base de connaissances du terminal.
Cherche `[À COMPLÉTER]` (dans `content.js` et `index.html`) : ce sont les infos que tu n'as pas encore fournies.

| À faire | Où |
|---|---|
| Phrase de motivation, problématique/résumé/points clés du mémoire | `index.html` (sections About et Research) |
| CV et mémoire en PDF | dépose `cv-adrien-lavigne.pdf` et `memoire.pdf` dans `public/` |
| Formulaire de contact | crée un formulaire sur formspree.io, colle l'URL dans `LINKS.formEndpoint` |
| Missions des 2 stages, résultats de Shieldwall | `content.js` (`TIMELINE`, `PROJECTS`) |
| URL finale du site | `index.html` (og:url, og:image), `public/sitemap.xml`, `public/robots.txt` |

Sans endpoint Formspree, le formulaire ouvre ton client mail (rien n'est perdu).

## Déployer gratuitement

**Vercel** : `npm i -g vercel && vercel --prod` (ou importe le dépôt GitHub sur vercel.com).
**Netlify** : `npm run build`, puis glisse le dossier `dist` sur app.netlify.com/drop (ou connecte le dépôt : build `npm run build`, publish `dist`).
**GitHub Pages** : `base: './'` est déjà configuré.
```bash
npm run build
npx gh-pages -d dist      # publie sur la branche gh-pages
```
Puis Settings → Pages → branche `gh-pages`.

## Easter eggs

Konami code (↑↑↓↓←→←→ B A), `matrix`, `sudo hire adrien` dans le terminal, 5 clics sur « LAVIGNE » en bas, bouton « palette ».

## Brancher un vrai LLM (optionnel)

Dans `src/modules/terminal.js`, renseigne `LLM_ENDPOINT = '/api/ask'`, puis crée une fonction serverless (Vercel : `api/ask.js`) qui reçoit `{ question }`, appelle l'API de ton choix avec la clé stockée en variable d'environnement, et renvoie `{ answer }`. Ne mets jamais la clé dans le code du site. Donne au modèle le contenu de `KB` comme contexte pour qu'il ne parle que de ton profil.

## i18n

`I18N.en` dans `content.js` + attributs `data-i18n` sur le HTML : la structure est prête, la logique de bascule reste à écrire (v2).

## Idées v2

Bascule FR/EN · vraies captures/vidéos de projets · self-host des polices · page 404 stylée · mode clair · mini-jeu RecrutIA intégré · statistiques GitHub en direct · tests Lighthouse en CI.

## Version « un seul fichier »

`node scripts/build-single.mjs` génère `dist-single/index.html`, une page autonome (GSAP, Lenis et Three.js chargés depuis des CDN) qu'on peut ouvrir d'un double-clic ou publier telle quelle.

## Collaboration

Ce portfolio est construit en collaboration avec [Claude](https://claude.ai) (Anthropic) : direction artistique, code et itérations se font en binôme, d'où les commits co-signés.
