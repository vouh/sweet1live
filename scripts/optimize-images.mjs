/**
 * Build responsive WebP variants for fast live loads.
 * From each public/images/sN.webp →
 *   sN-640.webp  (phones)
 *   sN-1280.webp (tablets / laptop)
 * Leaves the original sN.webp as the desktop source.
 *
 * Also writes public/videos/brunch-vibes-poster.webp for the hero.
 *
 * Run: npm run images:optimize
 */
import fs from "fs";
import path from "path";
import sharp from "sharp";

const IMAGES_DIR = path.join(process.cwd(), "public", "images");
const VIDEOS_DIR = path.join(process.cwd(), "public", "videos");

const VARIANTS = [
  { suffix: "-640", width: 640, quality: 72 },
  { suffix: "-1280", width: 1280, quality: 75 },
];

const files = fs
  .readdirSync(IMAGES_DIR)
  .filter((f) => /^s\d+\.webp$/i.test(f) && !/-\d+\.webp$/i.test(f))
  .sort((a, b) => {
    const na = parseInt(a.match(/\d+/)[0], 10);
    const nb = parseInt(b.match(/\d+/)[0], 10);
    return na - nb;
  });

if (files.length === 0) {
  console.log("No s*.webp files found in public/images/");
  process.exit(0);
}

let variantBytes = 0;

for (const file of files) {
  const input = path.join(IMAGES_DIR, file);
  const base = file.replace(/\.webp$/i, "");

  for (const v of VARIANTS) {
    const out = path.join(IMAGES_DIR, `${base}${v.suffix}.webp`);
    await sharp(input)
      .rotate()
      .resize({ width: v.width, withoutEnlargement: true })
      .webp({ quality: v.quality, effort: 5 })
      .toFile(out);
    variantBytes += fs.statSync(out).size;
  }

  console.log(`${file} → -640 / -1280`);
}

const posterSrc = path.join(IMAGES_DIR, "s1.webp");
if (fs.existsSync(posterSrc)) {
  fs.mkdirSync(VIDEOS_DIR, { recursive: true });
  const posterOut = path.join(VIDEOS_DIR, "brunch-vibes-poster.webp");
  await sharp(posterSrc)
    .resize({ width: 1280, withoutEnlargement: true })
    .webp({ quality: 70, effort: 5 })
    .toFile(posterOut);
  console.log(`poster → ${path.relative(process.cwd(), posterOut)}`);
}

console.log(`\nDone. Responsive variants total ~${(variantBytes / 1024 / 1024).toFixed(1)} MB on disk.`);
