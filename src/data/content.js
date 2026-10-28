/**
 * ============================================================
 *  CONTENU DU SITE — le seul fichier à modifier pour tes textes
 * ============================================================
 *  - Tout ce qui est marqué [À COMPLÉTER] est une info que tu ne m'as pas donnée.
 *  - Les textes dynamiques (projets, parcours, compétences, terminal) vivent ici.
 *  - i18n : `fr` est complet. Copie la structure dans `en` pour ajouter l'anglais ;
 *    toute clé absente de `en` retombe automatiquement sur `fr`.
 */

export const LINKS = {
  linkedin: 'https://www.linkedin.com/in/adrien-lavigne-93197a381/',
  github: 'https://github.com/ADsansGluten',
  email: 'adrien.lavigne@ynov.com',
  cv: 'cv-adrien-lavigne.pdf', // [À COMPLÉTER] dépose ton CV dans /public avec ce nom
  // [À COMPLÉTER] crée un formulaire sur formspree.io puis colle l'URL ici (ex: https://formspree.io/f/xxxxxxx)
  formEndpoint: '',
};

export const PROFILE = {
  name: 'Adrien Lavigne',
  school: 'Ynov Campus Sophia',
  city: 'Sophia Antipolis',
};

/** Compétences : level = niveau annoncé dans ton CV / tes messages. Rien d'inventé. */
export const SKILLS = {
  categories: {
    ai: { label: 'IA / ML', angle: -2.2 },
    data: { label: 'Data', angle: -0.6 },
    dev: { label: 'Dev', angle: 0.7 },
    infra: { label: 'Cyber / Infra', angle: 2.0 },
    tools: { label: 'Outils', angle: 3.1 },
  },
  nodes: [
    { id: 'llm', label: 'LLM & prompts', cat: 'ai', level: 'en apprentissage', projects: ['recrutia'] },
    { id: 'biais', label: 'Biais algorithmiques', cat: 'ai', level: 'sensibilisation (projet RecrutIA)', projects: ['recrutia'] },
    { id: 'algo', label: 'Algorithmique', cat: 'data', level: 'débutant', projects: [] },
    { id: 'excel', label: 'Excel', cat: 'data', level: 'intermédiaire', projects: [] },
    { id: 'backtest', label: 'Back-testing (XAUUSD)', cat: 'data', level: 'pratique personnelle', projects: [] },
    { id: 'html', label: 'HTML / CSS', cat: 'dev', level: 'débutant', projects: ['recrutia', 'portfolio'] },
    { id: 'js', label: 'JavaScript', cat: 'dev', level: 'débutant', projects: ['recrutia', 'portfolio'] },
    { id: 'go', label: 'Go', cat: 'dev', level: 'débutant', projects: ['projet-red-ybot'] },
    { id: 'git', label: 'Git / GitHub', cat: 'dev', level: 'en pratique', projects: ['recrutia', 'shieldwall', 'portfolio', 'projet-red-ybot'] },
    { id: 'ad', label: 'Active Directory', cat: 'infra', level: 'en cours (Shieldwall)', projects: ['shieldwall'] },
    { id: 'vmware', label: 'VMware Workstation', cat: 'infra', level: 'en cours (Shieldwall)', projects: ['shieldwall'] },
    { id: 'ptracer', label: 'Packet Tracer / VLAN', cat: 'infra', level: 'en cours (Shieldwall)', projects: ['shieldwall'] },
    { id: 'canva', label: 'Canva', cat: 'tools', level: 'avancé', projects: [] },
    { id: 'office', label: 'Word / Excel', cat: 'tools', level: 'intermédiaire', projects: [] },
    { id: 'pix', label: 'Certification Pix', cat: 'tools', level: 'certifié', projects: [] },
    { id: 'claude', label: 'Claude (assistant IA)', cat: 'tools', level: 'usage quotidien', projects: ['portfolio'] },
  ],
};

export const PROJECTS = [
  {
    slug: 'recrutia',
    index: '01',
    title: 'RecrutIA',
    kicker: 'Jeu narratif · HTML / CSS / JS',
    year: '2026',
    status: 'En ligne',
    summary:
      "Un mini-jeu de décisions de 15 pages où tu incarnes un·e data scientist qui entraîne une IA de tri de CV.",
    context:
      "Projet HTML/CSS réalisé à Ynov Campus. L'idée d'orienter le jeu vers l'entraînement d'un modèle de langage vient de moi, avec l'aide de mon mentor Firas.",
    problem:
      "Comment faire comprendre, sans jargon, qu'une IA de recrutement peut reproduire des biais si ses données d'entraînement sont biaisées ?",
    solution:
      "Des pages HTML/CSS connectées façon « livre dont vous êtes le héros » : chaque choix du joueur influence les données, donc le comportement de l'IA fictive de l'entreprise RecrutIA. Trois fins possibles. Deux thèmes : v1 clair avec bouton jour/nuit (petit script JS), v2 sombre « console de données ».",
    result:
      "Jeu publié sur GitHub Pages. Prochaine étape envisagée : un portage en Go, jouable dans le terminal.",
    stack: ['HTML', 'CSS', 'JavaScript', 'GitHub Pages'],
    links: [
      { label: 'Jouer', href: 'https://adsansgluten.github.io/Jeu-LLM-Projet-HTML/' },
      { label: 'Code source', href: 'https://github.com/ADsansGluten/Jeu-LLM-Projet-HTML' },
    ],
    hue: 268,
  },
  {
    slug: 'shieldwall',
    index: '02',
    title: 'Opération Shieldwall',
    kicker: 'Infra & cybersécurité · Ynov B1',
    year: '2026',
    status: 'En cours',
    summary:
      "Sécuriser l'infrastructure d'une PME fictive (Azuria) : annuaire, serveur de fichiers, segmentation réseau.",
    context:
      "Projet de cybersécurité du B1 Ynov, réalisé seul. Parcours A — Windows (Active Directory + serveur de fichiers).",
    problem:
      "Je partais sans connaissances en réseau : il fallait monter une infrastructure cohérente et la défendre (approche Blue Team).",
    solution:
      "Hyperviseur VMware Workstation pour la partie Windows, maquette Packet Tracer pour la segmentation (cœur de réseau, pare-feu, un switch par zone, VLAN). Dépôt GitHub privé structuré (docs, configs, scripts, preuves) et roadmap suivie case par case.",
    result: 'Projet en cours : je travaille actuellement sur la maquette.',
    stack: ['Active Directory', 'VMware Workstation', 'Packet Tracer', 'VLAN', 'GitHub'],
    links: [{ label: 'Dépôt privé — accès sur demande', href: '' }],
    hue: 200,
  },
  {
    slug: 'portfolio',
    index: '03',
    title: 'Ce portfolio',
    kicker: 'Creative dev · Vite · WebGL',
    year: '2026',
    status: 'En ligne',
    summary:
      "Le site que tu consultes : un champ d'embeddings WebGL, un terminal « Ask me anything » et beaucoup trop d'easter eggs.",
    context: "Conçu pour présenter mon parcours de reconversion vers l'IA et la data.",
    problem: 'Se démarquer avec un portfolio qui raconte le métier visé plutôt que de se contenter de le lister.',
    solution:
      "Vite + JavaScript natif, GSAP et Lenis pour le mouvement, Three.js pour le hero, canvas 2D pour le graphe de compétences. Réalisé avec l'aide de Claude.",
    result: 'Voir la section Contact pour me dire ce que tu en penses.',
    stack: ['Vite', 'JavaScript', 'GSAP', 'Three.js', 'Canvas 2D'],
    links: [{ label: 'Code source', href: 'https://github.com/ADsansGluten' }],
    hue: 285,
  },
  {
    slug: 'projet-red-ybot',
    play: 'ybot',
    image: 'ybot/ybot-shot.webp',
    imageAlt: 'Capture du jeu Mr Ybot : un combat au tour par tour contre un Training Malware, dans le terminal',
    index: '04',
    title: 'Projet RED — Mr Ybot',
    kicker: 'Jeu en terminal · Go',
    year: '2026',
    status: 'Terminé',
    summary:
      "Un jeu de rôle en ligne de commande, thème cybersécurité : crée ton opérateur, équipe-le, fabrique du matériel et affronte des malwares au tour par tour.",
    context:
      "Projet final des 3 semaines d'Ymmersion à Ynov Sophia, en 1re année : un projet de développement réalisé en équipe de 3, le Projet RED. Ma part : le système de combat, les actions, les compétences et les ennemis. Le code est hébergé sur le GitHub d'un coéquipier (ItsForTheVibes).",
    problem:
      "Concevoir à trois, en trois semaines, un jeu complet jouable dans le terminal, inspiré du hacking et du cyberpunk.",
    solution:
      "Création d'opérateur avec affiliation et points de vie, inventaire (capacité 10, extensible), marchand en Ethereum, atelier de craft (Neural Visor, Firewall Jacket, Proxy Boots), compétences (Packet Punch, Zero-Day Blast), consommables et combat au tour par tour contre des malwares. Code découpé en packages : character, combat, economy, items, utils. Mon périmètre : le combat au tour par tour, les actions du joueur, les compétences (Packet Punch, Zero-Day Blast) et les ennemis (malwares avec leur propre comportement).",
    result: "Mr Ybot est jouable avec « go run . » (environ 1 500 lignes de Go). Une expérience qui m'a permis de mettre en pratique mes bases en programmation et de découvrir le travail en équipe sur un projet concret.",
    stack: ['Go', 'CLI', 'Git'],
    links: [{ label: 'Code source', href: 'https://github.com/ItsForTheVibes/Projet-Red-Mr-Ybot' }],
    hue: 150,
  },
];

/** Parcours, du plus récent au plus ancien. kind: study | work | intern | project */
export const TIMELINE = [
  { date: 'Sep 2026 →', kind: 'study', title: 'Bachelor 1 IA / Data', place: 'Ynov Campus Sophia — Sophia Antipolis', text: "Je rejoins le cursus Data Ingénieur / Développement IA. Mastère visé : Expert en intelligence artificielle." },
  { date: 'Oct 2025 – Sep 2026', kind: 'work', title: 'Social Media Video Creator', place: 'El Nacho — Station du Val Joly', text: "Média du restaurant pour optimiser le CTR ; prises de vue et montage vidéo pour les événements." },
  { date: 'Fév – Juin 2026', kind: 'work', title: 'Vendeur polyvalent (CDD)', place: 'MR.Bricolage / MY INVEST — Le Rouret', text: "Réapprovisionnement via le stock inter-franchisé, vente sur toute la surface, objectifs de CA." },
  { date: 'Sep 2025 – Juin 2026', kind: 'study', title: 'Licence 1 Droit', place: 'Paris 1 Panthéon-Sorbonne', text: "Une année de droit, sans la poursuivre, avant la réorientation vers l'IA et la data." },
  { date: 'Sep – Nov 2025', kind: 'work', title: 'Défourneur (intérim)', place: 'Maison Menissez — Maubeuge', text: "Responsable du défournement principal sur des commandes importantes (CROUS notamment), 5 fours rotatifs." },
  { date: 'Juil – Août 2025', kind: 'work', title: 'Barman / Cuisinier', place: 'Station du Val Joly — Camping', text: "Prise de commande, caisse, gestion de la salle ; cuisinier autonome dans un foodtruck." },
  { date: 'Fév 2024 – Juil 2025', kind: 'study', title: 'Baccalauréat Général (mention)', place: 'CNED — Rennes', text: "Spécialités Mathématiques et SES, option Mathématiques Expertes." },
  { date: 'Juil 2023', kind: 'intern', title: 'Stage en agence immobilière', place: 'HOME-IMMO — Antibes', text: 'Réalisation de deux rendez-vous pour une visite.' },
  { date: 'Juin 2023', kind: 'intern', title: 'Stage en gestion de patrimoine privé', place: 'Olifan Group — Cannes', text: "Accompagnement d'un rendez-vous client pour un nouveau produit structuré." },
  { date: 'Sep 2021 – Juin 2023', kind: 'work', title: 'Arbitre national UNSS / départemental FFBB', place: 'Basketball — Paris', text: "Application rigoureuse des règlements, gestion des situations conflictuelles pendant les matchs." },
];

/** Base de connaissances du terminal. `k` = mots-clés (sans accents, minuscules). */
export const KB = [
  { id: 'about', k: ['qui', 'about', 'presente', 'presentation', 'adrien', 'toi', 'profil'], a: "Adrien Lavigne. Étudiant en Bachelor 1 IA / Data à Ynov Campus Sophia depuis septembre 2026. Je viens du droit (Paris 1 Panthéon-Sorbonne) et je me reconvertis vers l'IA et la data. Mastère visé : Expert en intelligence artificielle." },
  { id: 'path', k: ['parcours', 'droit', 'reconversion', 'pourquoi', 'histoire', 'bac', 'cned'], a: "Bac général au CNED (maths expertes, SES, mention), puis une L1 de droit à Paris 1. Cette année, je me réoriente vers l'IA et la data, par vision d'avenir : je me suis projeté et j'ai estimé que c'était ce domaine qui correspondait à mon idéal." },
  { id: 'now', k: ['actuellement', 'currently', 'now', 'formation', 'etudes', 'ynov', 'ecole'], a: "En formation à Ynov Campus Sophia (B1 IA / Data). Je suis à la recherche d'un stage ou d'une alternance, et j'apprends en parallèle Go, le développement web et les bases de l'infrastructure sécurisée." },
  { id: 'skills', k: ['competences', 'skills', 'techno', 'stack', 'langage', 'savoir'], a: "Je suis encore en début de parcours, donc voici mon niveau réel : Canva (avancé), Word/Excel (intermédiaire), HTML/CSS, JavaScript, Go et algorithmique (débutant), Active Directory et réseau (en cours via Shieldwall). Pas de baratin : j'apprends vite et je le montre en projet." },
  { id: 'projects', k: ['projet', 'projets', 'projects', 'realise', 'portfolio', 'github', 'code'], a: "Quatre projets à voir : RecrutIA (jeu narratif sur les biais d'une IA de tri de CV, en ligne), Opération Shieldwall (infra & cybersécurité, en cours), Projet RED – Mr Ybot (jeu en terminal en Go) et ce portfolio. Tape « recrutia » ou « shieldwall » pour le détail." },
  { id: 'recrutia', k: ['recrutia', 'jeu', 'biais', 'game'], a: "RecrutIA : un jeu de 15 pages en HTML/CSS/JS où tu es data scientist et entraînes une IA de tri de CV. Trois fins, deux thèmes. Jouable sur GitHub Pages. Idée : montrer comment des données biaisées donnent une IA biaisée." },
  { id: 'shieldwall', k: ['shieldwall', 'cyber', 'cybersecurite', 'securite', 'azuria', 'reseau', 'infra', 'active', 'directory'], a: "Opération Shieldwall : projet B1 de cybersécurité, réalisé seul. Active Directory + serveur de fichiers sur VMware Workstation, maquette Packet Tracer avec VLAN. Je partais de zéro en réseau. Projet toujours en cours." },
  { id: 'exp', k: ['experience', 'experiences', 'travail', 'job', 'stage', 'stages', 'alternance'], a: "Expériences : création vidéo pour le restaurant El Nacho, vendeur CDD chez MR.Bricolage, défourneur en intérim, barman/cuisinier, arbitre national UNSS, et deux stages de découverte (immobilier à Antibes, gestion de patrimoine à Cannes)." },
  { id: 'lang', k: ['langue', 'langues', 'anglais', 'espagnol', 'francais'], a: "Français (natif), espagnol (B1+), anglais (B1-)." },
  { id: 'hobby', k: ['loisir', 'loisirs', 'hobby', 'interet', 'interets', 'echecs', 'sport', 'muscu', 'trading'], a: "Musculation, échecs (1400 elo), back-testing de trading sur XAUUSD, parfumerie et horlogerie." },
  { id: 'linkedin', k: ['linkedin', 'reseau social'], a: `Mon LinkedIn : ${LINKS.linkedin}` },
  { id: 'contact', k: ['contact', 'contacter', 'mail', 'email', 'joindre', 'recruter', 'embaucher'], a: `Le plus simple : ${LINKS.email} ou LinkedIn (${LINKS.linkedin}). Tu peux aussi utiliser le formulaire plus bas.` },
];

export const SUGGESTIONS = ['Qui es-tu ?', 'Tes projets', 'Tes compétences', 'Parcours', 'Contact'];

export const FALLBACK =
  "Je n'ai pas cette info dans ma base locale. Essaie : parcours, projets, compétences, contact, ou tape « help ».";

/** Dictionnaire i18n pour le HTML statique (attributs data-i18n). `fr` est dans index.html. */
export const I18N = {
  fr: {},
  en: {
    // Exemple — décommente et complète pour activer l'anglais :
    // 'hero.cta.projects': 'See my projects',
    // 'hero.cta.contact': 'Get in touch',
  },
};
