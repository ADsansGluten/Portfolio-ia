# Portfolio — Adrien Lavigne (Direction A « Ultraviolet Latent Space »)

**Site en ligne : https://adsansgluten.github.io/Portfolio-ia/**

Vite + JavaScript natif · GSAP (ScrollTrigger) · Lenis · Three.js (hero) · Canvas 2D (compétences).

Points forts : champ d'embeddings WebGL réactif au curseur, typographie cinétique, graphe de compétences interactif, projets en modale (routage `#/projet/slug`), section LinkedIn (visuels de mon post RecrutIA en coverflow piloté par le scroll), terminal « Ask me anything » local, easter eggs, **mode jour / nuit** (choix mémorisé), palette violet/vert, version sobre si `prefers-reduced-motion`.

## Lancer en local

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # génère /dist
npm run preview    # teste le build
```

## Remplacer tes contenus

Presque tout est dans **`src/data/content.js`** : liens, compétences, projets, parcours, base de connaissances du terminal.
Une information non fournie est marquée `[À COMPLÉTER]` plutôt qu'inventée.

| Sujet | Où |
|---|---|
| CV (téléphone et date de naissance floutés) | `public/cv-adrien-lavigne.pdf` |
| Photo du hero | `public/adrien.jpg` |
| Formulaire de contact | sans endpoint, ouvre le client mail ; pour un envoi direct, crée un formulaire sur formspree.io et colle l'URL dans `LINKS.formEndpoint` |
| Missions, projets, compétences | `src/data/content.js` |
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

Konami code (↑↑↓↓←→←→ B A), `matrix`, `sudo hire adrien` dans le terminal, 5 clics sur « LAVIGNE » en bas, boutons « palette » et ☾/☀.

## Brancher un vrai LLM (optionnel)

Dans `src/modules/terminal.js`, renseigne `LLM_ENDPOINT = '/api/ask'`, puis crée une fonction serverless (Vercel : `api/ask.js`) qui reçoit `{ question }`, appelle l'API de ton choix avec la clé stockée en variable d'environnement, et renvoie `{ answer }`. Ne mets jamais la clé dans le code du site. Donne au modèle le contenu de `KB` comme contexte pour qu'il ne parle que de ton profil.

## i18n

`I18N.en` dans `content.js` + attributs `data-i18n` sur le HTML : la structure est prête, la logique de bascule reste à écrire (v2).

## Idées v2

Bascule FR/EN · vraies captures/vidéos de projets · self-host des polices · page 404 stylée · mini-jeu RecrutIA intégré · statistiques GitHub en direct · tests Lighthouse en CI.

## Version « un seul fichier »

`node scripts/build-single.mjs` génère `dist-single/index.html`, une page autonome (photo incrustée ; GSAP, Lenis et Three.js chargés depuis des CDN) qu'on peut ouvrir d'un double-clic ou publier telle quelle. La copie publiée sur GitHub Pages est `docs/index.html` (à régénérer après chaque modification).

## Collaboration

Ce portfolio est construit en collaboration avec [Claude](https://claude.ai) (Anthropic) : direction artistique, code et itérations se font en binôme, d'où les commits co-signés.
