/**
 * Catalogue des visuels (tous tirés des publications Instagram de @stav.gueta).
 * `cat` = dossier dans assets/ et public/media/, `filter` = filtre de la galerie.
 * Les textes alternatifs sont dans locales/<langue>.json > media.<file>.
 */
export const MEDIA = [
  { cat: "evjf", file: "evjf-noeuds-mur-personnalise", filter: "evjf" },
  { cat: "hafrashat-hala", file: "hafrasha-bougies-roses-blanches", filter: "hafrasha" },
  { cat: "evjf", file: "evjf-arche-ballons-fleurs", filter: "evjf" },
  { cat: "coins-photo", file: "mariage-entree-roses-poudrees", filter: "wedding" },
  { cat: "naissances", file: "zeved-habat-rose-poudre", filter: "birth" },
  { cat: "ballons", file: "ballons-helium-perle-taupe", filter: "balloons" },
  { cat: "evjf", file: "evjf-shay-agrumes", filter: "evjf" },
  { cat: "hafrashat-hala", file: "hafrasha-table-dressee", filter: "hafrasha" },
  { cat: "voiture-maries", file: "voiture-noeud-gypsophile", filter: "wedding" },
  { cat: "anniversaires", file: "anniversaire-50-arche", filter: "birthday" },
  { cat: "evjf", file: "evjf-noeuds-bougies-flottantes", filter: "evjf" },
  { cat: "coins-photo", file: "mariage-entree-voilages", filter: "wedding" },
  { cat: "chambres", file: "chambre-anniversaire-rose", filter: "room" },
  { cat: "evjf", file: "evjf-noa-rayures-roses", filter: "evjf" },
  { cat: "hafrashat-hala", file: "hafrasha-voilages-blancs", filter: "hafrasha" },
  { cat: "naissances", file: "brit-ballons-bleus-ourson", filter: "birth" },
  { cat: "fleurs", file: "fleurs-panier-roses", filter: "balloons" },
  { cat: "evjf", file: "evjf-boho-chic", filter: "evjf" },
  { cat: "voiture-maries", file: "voiture-capot-gypsophile", filter: "wedding" },
  { cat: "anniversaires", file: "anniversaire-restaurant-helium", filter: "birthday" },
  { cat: "evjf", file: "evjf-noeuds-tour-coupes", filter: "evjf" },
  { cat: "coins-photo", file: "mariage-entree-detail-fleurs", filter: "wedding" },
  { cat: "chambres", file: "chambre-ballons-chrome", filter: "room" },
  { cat: "naissances", file: "zeved-habat-detail", filter: "birth" },
  { cat: "hafrashat-hala", file: "hafrasha-marque-places", filter: "hafrasha" },
  { cat: "ballons", file: "ballons-helium-bulles", filter: "balloons" },
  { cat: "evjf", file: "evjf-noa-bar-boissons", filter: "evjf" },
  { cat: "anniversaires", file: "anniversaire-50-noir-blanc", filter: "birthday" },
  { cat: "voiture-maries", file: "voiture-portiere-tulle", filter: "wedding" },
  { cat: "chambres", file: "chambre-ballons-hbd", filter: "room" },
  { cat: "voiture-maries", file: "voiture-volant-gypsophile", filter: "wedding" },
];

/** Vidéos de la galerie (boucles muettes), insérées entre les photos. */
export const GALLERY_VIDEOS = [
  { file: "hafrasha", filter: "hafrasha", after: 2 },
  { file: "mariage-cheers", filter: "wedding", after: 6 },
  { file: "zeved-habat", filter: "birth", after: 10 },
  { file: "evjf-noeuds", filter: "evjf", after: 14 },
  { file: "chambre-ballons", filter: "room", after: 17 },
  { file: "evjf-noa", filter: "evjf", after: 20 },
  { file: "anniversaire-50", filter: "birthday", after: 23 },
  { file: "ballons-helium", filter: "balloons", after: 30 },
];

export const GALLERY_FILTERS = ["all", "evjf", "wedding", "hafrasha", "birth", "birthday", "balloons", "room"];

/** Hero : trois reels verticaux côte à côte sur grand écran, un seul sur mobile (le premier). */
export const HERO = ["hafrasha", "evjf-noeuds", "mariage-entree"];

/** Les grands événements : affiche + vidéo lue au survol. `video: null` = pas encore de média. */
export const EVENTS = [
  { key: "hafrasha", photo: "hafrashat-hala/hafrasha-bougies-roses-blanches", video: "hafrasha", filter: "hafrasha" },
  { key: "evjf", photo: "evjf/evjf-noeuds-mur-personnalise", video: "evjf-noeuds", filter: "evjf" },
  { key: "wedding", photo: "coins-photo/mariage-entree-roses-poudrees", video: "mariage-cheers", filter: "wedding" },
  { key: "mitzva", photo: null, video: null, filter: "all" },
];

/** Les douze prestations (ordre de la bio et des stories à la une). */
export const SERVICES = [
  { key: "photo", photo: "evjf/evjf-arche-ballons-fleurs", type: "photo" },
  { key: "balloons", photo: "anniversaires/anniversaire-restaurant-helium", type: "balloons" },
  { key: "flowers", photo: "fleurs/fleurs-panier-roses", type: "flowers" },
  { key: "hafrasha", photo: "hafrashat-hala/hafrasha-table-dressee", type: "hafrasha" },
  { key: "car", photo: "voiture-maries/voiture-capot-gypsophile", type: "wedding" },
  { key: "evjf", photo: "evjf/evjf-shay-agrumes", type: "evjf" },
  { key: "mitzva", photo: null, type: "mitzva" },
  { key: "birth", photo: "naissances/zeved-habat-rose-poudre", type: "birth" },
  { key: "birthday", photo: "anniversaires/anniversaire-50-arche", type: "birthday" },
  { key: "room", photo: "chambres/chambre-ballons-chrome", type: "room" },
  { key: "numbers", photo: "chambres/chambre-anniversaire-rose", type: "birthday" },
  { key: "special", photo: null, type: "other" },
];

/** Types proposés dans le formulaire de demande (clés des services). */
export const REQUEST_TYPES = ["hafrasha", "evjf", "wedding", "mitzva", "birth", "birthday", "photo", "balloons", "room", "special"];
