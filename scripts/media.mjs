/**
 * Prépare les visuels du dossier assets/ pour le web (à relancer après tout ajout de photo) :
 *   - photos  -> public/media/<catégorie>/<nom>-<largeur>.avif|webp (480, 960, 1600 px max)
 *   - vidéos  -> public/media/videos/<nom>.mp4 (H.264) + .webm (VP9), sans son, 720 px max, + affiche .webp
 *   - logo    -> favicon, icônes et image Open Graph (à partir de public/favicon.svg)
 * Écrit src/data/media-sizes.json (dimensions utilisées par le générateur de pages).
 *
 *   npm run media
 */
import { readdir, mkdir, writeFile, stat } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { tmpdir } from "node:os";
import sharp from "sharp";
import ffmpeg from "ffmpeg-static";

const ROOT = path.resolve(import.meta.dirname, "..");
const ASSETS = path.join(ROOT, "assets");
const OUT = path.join(ROOT, "public", "media");
const WIDTHS = [480, 960, 1600];
const PHOTO_DIRS = ["hafrashat-hala", "coins-photo", "ballons", "fleurs", "voiture-maries", "evjf", "bar-bat-mitsva", "naissances", "anniversaires", "chambres", "about"];

const sizes = {};

async function isFresh(src, out) {
  try {
    return (await stat(out)).mtimeMs >= (await stat(src)).mtimeMs;
  } catch {
    return false;
  }
}

for (const dir of PHOTO_DIRS) {
  const files = (await readdir(path.join(ASSETS, dir)).catch(() => [])).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
  await mkdir(path.join(OUT, dir), { recursive: true });
  for (const file of files) {
    const name = file.replace(/\.[^.]+$/, "");
    const src = path.join(ASSETS, dir, file);
    const meta = await sharp(src).metadata();
    const widths = WIDTHS.filter((w) => w < meta.width).concat(meta.width < 1600 ? [meta.width] : []).slice(0, 3);
    for (const w of widths) {
      const base = path.join(OUT, dir, `${name}-${w}`);
      if (await isFresh(src, `${base}.webp`)) continue;
      const img = sharp(src).rotate().resize({ width: w, withoutEnlargement: true });
      await img.clone().avif({ quality: 50, effort: 5 }).toFile(`${base}.avif`);
      await img.clone().webp({ quality: 74 }).toFile(`${base}.webp`);
    }
    sizes[`${dir}/${name}`] = { w: meta.width, h: meta.height, widths };
  }
}

// Vidéos : boucles muettes, démarrage rapide (faststart), deux formats.
await mkdir(path.join(OUT, "videos"), { recursive: true });
for (const file of (await readdir(path.join(ASSETS, "videos")).catch(() => [])).filter((f) => f.endsWith(".mp4"))) {
  const name = file.replace(/\.mp4$/, "");
  const src = path.join(ASSETS, "videos", file);
  const out = path.join(OUT, "videos", `${name}.mp4`);
  if (!(await isFresh(src, out))) {
    const scale = ["-vf", "scale='min(720,iw)':-2,fps=30"];
    execFileSync(ffmpeg, ["-v", "error", "-y", "-i", src, "-an", ...scale,
      "-c:v", "libx264", "-preset", "slow", "-crf", "27", "-pix_fmt", "yuv420p", "-movflags", "+faststart", out]);
    execFileSync(ffmpeg, ["-v", "error", "-y", "-i", src, "-an", ...scale,
      "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "40", "-row-mt", "1", "-deadline", "good", "-cpu-used", "4", out.replace(/\.mp4$/, ".webm")]);
    const poster = path.join(tmpdir(), `stav-${name}.jpg`);
    execFileSync(ffmpeg, ["-v", "error", "-y", "-ss", "0.4", "-i", out, "-frames:v", "1", "-q:v", "2", poster]);
    await sharp(poster).webp({ quality: 70 }).toFile(path.join(OUT, "videos", `${name}.webp`));
  }
  const m = await sharp(path.join(OUT, "videos", `${name}.webp`)).metadata();
  sizes[`videos/${name}`] = { w: m.width, h: m.height };
}

// Icônes et image de partage, à partir du pictogramme (ballon).
const mark = path.join(ROOT, "public", "favicon.svg");
const ink = await sharp(mark, { density: 600 }).resize(400, 400, { fit: "contain", background: "#00000000" }).png().toBuffer();
for (const [file, size, pad] of [["apple-touch-icon.png", 180, 34], ["icon-192.png", 192, 36], ["icon-512.png", 512, 96]]) {
  const inner = await sharp(ink).resize(size - pad * 2, size - pad * 2, { fit: "contain", background: "#00000000" }).toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: "#FAF6F1" } })
    .composite([{ input: inner }]).png().toFile(path.join(ROOT, "public", file));
}

const ogPhoto = await sharp(path.join(ASSETS, "evjf", "evjf-arche-ballons-fleurs.jpg")).resize(520, 630, { fit: "cover", position: "top" }).toBuffer();
const ogText = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="680" height="630">
  <rect width="680" height="630" fill="#FAF6F1"/>
  <g transform="translate(316 150) scale(1.4)"><ellipse cx="17" cy="20" rx="15" ry="18" fill="#D9B8B0"/><path d="M17 38 l-2.4 3.6 h4.8z" fill="#D9B8B0"/><path d="M17 41.6 c-3 6 3 9 0 16" fill="none" stroke="#B89B6A" stroke-width="1.2"/></g>
  <text x="340" y="340" text-anchor="middle" font-family="Georgia, serif" font-size="58" letter-spacing="10" fill="#2A2A2A">STAV GUETA</text>
  <text x="340" y="388" text-anchor="middle" font-family="Arial, sans-serif" font-size="17" letter-spacing="7" fill="#7A6A5E">EVENT DESIGN · ASHKELON</text>
  <text x="340" y="462" text-anchor="middle" font-family="Arial, sans-serif" font-size="26" fill="#2A2A2A">כשעיצוב יוצר רגעים שנשארים</text>
</svg>`);
await sharp({ create: { width: 1200, height: 630, channels: 3, background: "#FAF6F1" } })
  .composite([{ input: ogText, left: 0, top: 0 }, { input: ogPhoto, left: 680, top: 0 }])
  .jpeg({ quality: 82 }).toFile(path.join(ROOT, "public", "og.jpg"));

await mkdir(path.join(ROOT, "src", "data"), { recursive: true });
await writeFile(path.join(ROOT, "src", "data", "media-sizes.json"), JSON.stringify(sizes, null, 1));
console.log(`${Object.keys(sizes).length} médias prêts.`);
