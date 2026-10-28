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
**GitHub Pages (ce qu'on utilise)** : le site est construit et publié par un workflow GitHub Actions (`.github/workflows/main.yml`), à chaque push sur `main`, chaque jour et à la demande (onglet *Actions → Run workflow*). Réglage unique : *Settings → Pages → Source : GitHub Actions*. Il n'y a plus de dossier `docs/` à mettre à jour à la main.

## Easter eggs

Konami code (↑↑↓↓←→←→ B A), `matrix`, `sudo hire adrien` dans le terminal, 5 clics sur « LAVIGNE » en bas, boutons « palette » et ☾/☀.

## Brancher un vrai LLM (optionnel)

Dans `src/modules/terminal.js`, renseigne `LLM_ENDPOINT = '/api/ask'`, puis crée une fonction serverless (Vercel : `api/ask.js`) qui reçoit `{ question }`, appelle l'API de ton choix avec la clé stockée en variable d'environnement, et renvoie `{ answer }`. Ne mets jamais la clé dans le code du site. Donne au modèle le contenu de `KB` comme contexte pour qu'il ne parle que de ton profil.

## i18n

`I18N.en` dans `content.js` + attributs `data-i18n` sur le HTML : la structure est prête, la logique de bascule reste à écrire (v2).

## Idées v2

Bascule FR/EN · vraies captures/vidéos de projets · self-host des polices · page 404 stylée · mini-jeu RecrutIA intégré · statistiques GitHub en direct · tests Lighthouse en CI.

## Version « un seul fichier »

`node scripts/build-single.mjs` génère `dist-single/index.html`, une page autonome (photo incrustée ; GSAP, Lenis et Three.js chargés depuis des CDN) qu'on peut ouvrir d'un double-clic ou publier telle quelle. La version publiée sur GitHub Pages est construite par le workflow GitHub Actions : `node scripts/build-single.mjs --web` génère une page plus légère (`dist-web/`, le jeu Mr Ybot n'est téléchargé qu'au clic), que le workflow publie. Si [esbuild](https://esbuild.github.io/) est installé (`npm i esbuild`), le JS et le CSS sont minifiés, sans aucun changement visuel.

## Compétences depuis Supabase (au build)

Les compétences du graphe peuvent venir d'une table Supabase (`Portfolio` : `id`, `label`, `cat`, `level`, `projects`), lue **pendant le build** par `scripts/fetch-skills.mjs` : aucune clé n'est dans le navigateur ni dans le dépôt.

- **En local** : copie `.env.example` en `.env.local` (ignoré par Git), remplis `SUPABASE_URL` et `SUPABASE_ANON_KEY`, puis `node scripts/fetch-skills.mjs` avant `npm run build`.
- **Sur GitHub** : ajoute les deux secrets dans *Settings → Secrets and variables → Actions*. Le workflow `.github/workflows/main.yml` reconstruit et publie le site à chaque push, chaque jour et à la demande (onglet Actions → *Run workflow*).
- **Plan B** : si les variables manquent ou si Supabase ne répond pas, le site garde les compétences de `src/data/content.js`.
- **Sécurité** : la table doit avoir le RLS activé avec une seule règle, `SELECT` pour tous. Utilise la clé `anon`, jamais `service_role`.

### Pourquoi lire Supabase au build plutôt que dans le navigateur ?

Une autre méthode courante consiste à générer un `config.js` avec la clé à partir des secrets GitHub, puis à faire un `fetch` depuis la page. Elle marche bien avec une clé publique, mais **la clé est alors visible par tous les visiteurs**. J'ai préféré lire la base pendant le build :

- **Rien n'arrive jamais dans la page.** Si un jour je dois utiliser une clé secrète, elle restera dans le workflow, jamais dans le navigateur.
- **C'est un plan B intégré.** Si Supabase est en pause ou ne répond pas, le site garde les compétences de `src/data/content.js`.
- **Le site se reconstruit chaque jour** (workflow planifié), donc les compétences restent à jour sans que je touche à quoi que ce soit.
- Contrepartie : un changement dans Supabase n'apparaît qu'au prochain build (au plus 24 h, ou tout de suite avec *Actions → Run workflow*).

## Collaboration

Ce portfolio est construit en collaboration avec [Claude](https://claude.ai) (Anthropic) : direction artistique, code et itérations se font en binôme, d'où les commits co-signés.
