# Stav Gueta, design d'événements (site vitrine + boutique)

Site statique en 4 langues (hébreu par défaut en RTL, anglais, français, espagnol), généré par Vite.

## Choix technique
Vite + GSAP + Lenis plutôt que Next.js : le site n'a pas de contenu dynamique, chaque page est générée
à l'avance dans chaque langue (`/he/`, `/en/`, `/fr/`, `/es/`), ce qui donne un HTML complet pour Google,
un JavaScript léger (score Lighthouse élevé sur mobile) et un déploiement Vercel sans serveur.
La seule fonction serveur est `api/checkout.js` (paiement Stripe, désactivé par défaut).

## Commandes
- `npm run dev` : site en local (http://localhost:5184)
- `npm run build` : version de production dans `dist/`
- `npm run frames` : extrait images et extraits vidéo des reels bruts (`assets/raw/`)
- `npm run media` : optimise les visuels (AVIF/WebP, MP4/WebM, icônes, image de partage)
- `npm run contenu` : régénère `CONTENU.md` (textes 4 langues + infos à demander)

## Où modifier quoi
- Textes : `locales/he.json`, `en.json`, `fr.json`, `es.json` (aucun texte en dur ailleurs)
- Produits, prix, délai minimum, dates complètes, paiement : `data/products.json`
- Photos et vidéos utilisées : `src/data/media.js`
- Nom de marque, téléphone, Instagram : en haut de `scripts/generate.mjs`

## Paiement
Les commandes partent sur WhatsApp. Pour activer Stripe : `"stripeEnabled": true` dans
`data/products.json` et variable `STRIPE_SECRET_KEY` sur Vercel. Une solution israélienne
(Cardcom, Tranzila, Meshulam, Grow) peut remplacer `api/checkout.js`.

## Base de données
Volontairement non branchée pour le moment (aucune donnée enregistrée). Le jour venu : projet Supabase
partagé (multi-tenant, `site_id`), voir `dovsitbon/beth-habad-montmagny`.
