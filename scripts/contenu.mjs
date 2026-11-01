/**
 * Écrit CONTENU.md : tous les textes du site dans les 4 langues, côte à côte, pour validation
 * par la cliente, puis la liste des informations à lui demander.
 * Les textes se corrigent dans locales/*.json, puis : npm run contenu
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const LANGS = ["he", "en", "fr", "es"];
const L = {};
for (const l of LANGS) L[l] = JSON.parse(await readFile(path.join(ROOT, "locales", `${l}.json`), "utf8"));
const SHOP = JSON.parse(await readFile(path.join(ROOT, "data", "products.json"), "utf8"));

/** Aplatit un objet en paires « clé.sous-clé » -> texte. */
function flatten(obj, prefix = "", out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object") flatten(v, key, out);
    else out[key] = String(v);
  }
  return out;
}

const flat = Object.fromEntries(LANGS.map((l) => [l, flatten(L[l])]));
const cell = (s = "") => s.replace(/\|/g, "\\|").replace(/\n/g, "<br>");
const SECTIONS = [
  ["meta", "Référencement (titres et descriptions Google)"],
  ["brand", "Signature et zone"],
  ["nav", "Menu"],
  ["intro", "Écran d'ouverture"],
  ["hero", "Haut de page"],
  ["trust", "Bandeau de confiance (à confirmer)"],
  ["events", "01 · Les grands événements"],
  ["services", "02 · Les douze prestations"],
  ["shop", "03 · Boutique (accueil et page boutique)"],
  ["gallery", "04 · Galerie"],
  ["steps", "05 · Comment ça marche"],
  ["about", "06 · À propos"],
  ["reviews", "07 · Avis clients"],
  ["request", "08 · Demande d'événement"],
  ["wa", "Messages WhatsApp pré-remplis"],
  ["footer", "Pied de page"],
  ["float", "Bouton flottant"],
  ["legal", "Page accessibilité et confidentialité"],
  ["suggest", "Suggestion de langue"],
  ["media", "Légendes et textes alternatifs des photos"],
];

let md = `# Contenu du site Stav Gueta

Tous les textes visibles, dans les 4 langues. Merci de corriger directement dans ce tableau
(ou d'envoyer les corrections) : ils seront reportés dans \`locales/he.json\`, \`en.json\`, \`fr.json\`, \`es.json\`.

Les éléments entre accolades (\`{service}\`, \`{name}\`…) sont remplacés automatiquement.

`;
for (const [prefix, title] of SECTIONS) {
  const keys = Object.keys(flat.he).filter((k) => k === prefix || k.startsWith(`${prefix}.`));
  if (!keys.length) continue;
  md += `## ${title}\n\n| Clé | עברית | English | Français | Español |\n| --- | --- | --- | --- | --- |\n`;
  for (const k of keys) md += `| \`${k}\` | ${LANGS.map((l) => cell(flat[l][k])).join(" | ")} |\n`;
  md += "\n";
}

md += `## Prix de la boutique (exemples, fichier \`data/products.json\`)

| Produit | Prix d'exemple | Couleurs proposées |
| --- | --- | --- |
${SHOP.products.map((p) => `| ${L.fr.shop.products[p.id].name} | ${p.price ? `${p.price} ₪` : "sur devis"} | ${p.colors.map((c) => L.fr.shop.palette[c]).join(", ")} |`).join("\n")}

Réglages actuels : commande au moins ${SHOP.settings.minLeadHours} h à l'avance, créneaux ${SHOP.settings.slots.join(", ")}, samedi fermé (Chabbat), aucune date bloquée, paiement en ligne désactivé (commande sur WhatsApp).

---

# Informations à demander à Stav

Rien de tout cela n'a été inventé sur le site : ces points sont absents ou marqués « à remplir ».

## À décider
1. **Nom de marque** : le site affiche « Stav Gueta ». Son logo Instagram et le filigrane de ses vidéos disent « SOGU MOMENTS » (page sogumoments.kulialma.biz). Lequel mettre en avant ? Le changement se fait à un seul endroit (\`BRAND\` dans \`scripts/generate.mjs\`).
2. **Paiement en ligne** : Cardcom, Tranzila, Meshulam, Grow ou Stripe ? Pour l'instant, les commandes partent sur WhatsApp ; Stripe est prêt mais désactivé.

## À fournir
3. **Logo original** en haute qualité (PNG transparent ou SVG). Le site utilise un logo typographique provisoire et un pictogramme ballon.
4. **Portrait de Stav** pour la section « À propos » (photo de profil ou autre, avec son accord).
5. **Vrais avis clients** (story à la une « אתם ») : prénom, type d'événement, texte, avec accord. La section 07 renvoie pour l'instant vers Instagram.
6. **Photos et vidéos originales** sans texte incrusté (celles du site viennent d'Instagram, compressées et parfois recadrées pour enlever le texte).
7. **Photos manquantes** : bar et bat mitsva, chiffres géants (מעמדי ספרות), Tou BeAv, bouquet de mariée (זר כלה), événement au Monténégro.

## Prix et boutique
8. **Prix réels** de chaque produit (les prix affichés sont des exemples marqués comme tels).
9. **Zones et frais de livraison** (Ashkelon, environs, au-delà ?), et adresse de retrait.
10. **Délai minimum de commande** (48 h par défaut), créneaux horaires, jours fermés (samedi par défaut) et dates déjà complètes.
11. **Conditions** : acompte, annulation, ballons à l'hélium (durée de vol), allergies aux fleurs, etc.

## À confirmer
12. **Bandeau de confiance** : « design sur mesure », « fleurs fraîches », « installation sur place », « Ashkelon et environs ».
13. **Textes « À propos »** : rédigés à partir de ses publications (précision, message reçu après un événement). À relire par elle.
14. **Monténégro** : accord pour mentionner cet événement, et pour proposer des événements à l'étranger.
15. **Photos de clients** reconnaissables (prénoms sur les panneaux « Shira & Ram », « Noa », etc.) : accord pour les publier ?

## Manquant
16. Nom légal et numéro (עוסק מורשה / ח.פ.) pour le pied de page.
17. **Référent accessibilité** (nom, téléphone, e-mail) : obligatoire en Israël.
18. Adresse e-mail de contact, horaires de réponse.
19. Nom de domaine souhaité (le site est pour l'instant sur une adresse Vercel).
20. Autres réseaux (TikTok, Facebook) et fiche Google Business Profile (important pour « עיצוב אירועים אשקלון »).
`;

await writeFile(path.join(ROOT, "CONTENU.md"), md);
console.log("CONTENU.md écrit.");
