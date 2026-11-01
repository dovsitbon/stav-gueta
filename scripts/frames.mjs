/**
 * Classe les médias bruts récupérés sur Instagram (assets/raw/, identifiants des publications) :
 *   - images fixes extraites des reels (ffmpeg)       -> assets/<catégorie>/<nom>.jpg
 *   - photos des carrousels                           -> assets/<catégorie>/<nom>.jpg
 *   - extraits vidéo sans texte incrusté              -> assets/videos/<nom>.mp4
 * Beaucoup de reels ont du texte incrusté en haut ou au centre : on choisit des passages propres
 * ou l'on recadre sous le texte (crop = part de la hauteur gardée, depuis le haut ou le bas).
 * À relancer seulement si assets/raw/ change. Ensuite : npm run media.
 *
 *   npm run frames
 */
import { mkdir, copyFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
import ffmpeg from "ffmpeg-static";

const ROOT = path.resolve(import.meta.dirname, "..");
const RAW = path.join(ROOT, "assets", "raw");
const A = (...p) => path.join(ROOT, "assets", ...p);

// [publication, seconde, dossier, nom, recadrage facultatif { keep: 0..1, from: "top" | "bottom" }]
const FRAMES = [
  ["DSpz1AHCFEd", 29.4, "hafrashat-hala", "hafrasha-voilages-blancs"],
  ["DSpz1AHCFEd", 31.2, "hafrashat-hala", "hafrasha-bougies-roses-blanches"],
  ["DSpz1AHCFEd", 34.8, "hafrashat-hala", "hafrasha-table-dressee"],
  ["DSpz1AHCFEd", 36.6, "hafrashat-hala", "hafrasha-marque-places"],
  ["DcYvX7TIj6i", 14.5, "coins-photo", "mariage-entree-roses-poudrees"],
  ["DcYvX7TIj6i", 19.5, "coins-photo", "mariage-entree-detail-fleurs"],
  ["Dd1us6moO2k", 15.6, "coins-photo", "mariage-entree-voilages"],
  ["DS4cezNCKJ-", 1.0, "evjf", "evjf-noeuds-mur-personnalise"],
  ["DS4cezNCKJ-", 7.0, "evjf", "evjf-noeuds-bougies-flottantes"],
  ["DS4cezNCKJ-", 9.5, "evjf", "evjf-noeuds-tour-coupes"],
  ["DcqXardIXXn", 1.0, "evjf", "evjf-noa-rayures-roses"],
  ["DcqXardIXXn", 9.0, "evjf", "evjf-noa-bar-boissons"],
  ["De6YKQPIHqM", 5.0, "evjf", "evjf-boho-chic", { keep: 0.8, from: "bottom" }],
  ["DSklJB9CHm2", 2.5, "naissances", "zeved-habat-detail"],
  ["DbGOhnKIK89", 27.0, "naissances", "brit-ballons-bleus-ourson", { keep: 0.72, from: "bottom" }],
  ["DcqYVxAoIrg", 13.0, "anniversaires", "anniversaire-50-noir-blanc"],
  ["DcqYVxAoIrg", 18.5, "anniversaires", "anniversaire-50-arche"],
  ["DT7ygmciNTI", 17.4, "anniversaires", "anniversaire-restaurant-helium", { keep: 0.62, from: "bottom" }],
  ["DUBCgrkiPtH", 14.3, "chambres", "chambre-anniversaire-rose"],
  ["DeY6Yxto07N", 16.1, "chambres", "chambre-ballons-chrome"],
  ["DeY6Yxto07N", 20.7, "chambres", "chambre-ballons-hbd"],
  ["De7N5wsiNcL", 3.0, "ballons", "ballons-helium-bulles"],
  ["DSU3FS-iMeY", 44.6, "voiture-maries", "voiture-volant-gypsophile"],
  ["DepA9rjISiq", 6.3, "voiture-maries", "voiture-capot-gypsophile", { keep: 0.68, from: "top" }],
  ["DepA9rjISiq", 27.3, "voiture-maries", "voiture-noeud-gypsophile", { keep: 0.6, from: "top" }],
  ["DepA9rjISiq", 31.5, "voiture-maries", "voiture-portiere-tulle", { keep: 0.62, from: "top" }],
  ["DbgX2PaIIko", 24.1, "fleurs", "fleurs-panier-roses", { keep: 0.78, from: "top" }],
  ["DcqYVxAoIrg", 10.4, "about", "installation-anniversaire"],
];

// Photos des carrousels (pleine résolution)
const PHOTOS = [
  ["DXegdFrCLOL", "evjf", "evjf-arche-ballons-fleurs"],
  ["DcYtNlviK6l", "evjf", "evjf-shay-agrumes"],
  ["DSklKpAiKA3", "naissances", "zeved-habat-rose-poudre"],
  ["De7OA4jCB-B", "ballons", "ballons-helium-perle-taupe"],
  ["logo-profil", "logo", "logo-instagram"],
];

// [publication, début, durée, nom] : boucles muettes, sans texte incrusté
const CLIPS = [
  ["DS4cezNCKJ-", 0, 9, "evjf-noeuds"],
  ["DSpz1AHCFEd", 28, 12, "hafrasha"],
  ["DcYvX7TIj6i", 10.5, 10.5, "mariage-entree"],
  ["Dd1us6moO2k", 12.2, 4.6, "mariage-cheers"],
  ["DcqXardIXXn", 0, 10, "evjf-noa"],
  ["DXeZPCniObn", 0, 9, "evjf-arche"],
  ["DcYtCSviE0F", 0, 5, "evjf-shay"],
  ["DSklJB9CHm2", 0, 5.3, "zeved-habat"],
  ["DcqYVxAoIrg", 10, 10, "anniversaire-50"],
  ["De7N5wsiNcL", 0, 6.6, "ballons-helium"],
  ["DeY6Yxto07N", 14, 9.5, "chambre-ballons"],
];

const crop = ({ keep, from }) => `crop=iw:ih*${keep}:0:${from === "top" ? 0 : `ih*${(1 - keep).toFixed(3)}`}`;

for (const [id, t, dir, name, c] of FRAMES) {
  await mkdir(A(dir), { recursive: true });
  execFileSync(ffmpeg, ["-v", "error", "-y", "-ss", String(t), "-i", path.join(RAW, `${id}.mp4`), "-frames:v", "1",
    ...(c ? ["-vf", crop(c)] : []), "-q:v", "2", A(dir, `${name}.jpg`)]);
}
for (const [id, dir, name] of PHOTOS) {
  await mkdir(A(dir), { recursive: true });
  await copyFile(path.join(RAW, `${id}.jpg`), A(dir, `${name}.jpg`));
}
await mkdir(A("videos"), { recursive: true });
for (const [id, start, dur, name] of CLIPS) {
  execFileSync(ffmpeg, ["-v", "error", "-y", "-ss", String(start), "-t", String(dur), "-i", path.join(RAW, `${id}.mp4`),
    "-an", "-c:v", "libx264", "-preset", "fast", "-crf", "18", "-pix_fmt", "yuv420p", A("videos", `${name}.mp4`)]);
}
console.log(`${FRAMES.length + PHOTOS.length} images et ${CLIPS.length} extraits prêts dans assets/.`);
