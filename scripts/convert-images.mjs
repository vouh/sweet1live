/**
 * Convert public/images/s*.jpg → s*.webp (resize + compress).
 * Logo is unchanged. Run: npm run images:webp
 */
import fs from "fs";
import path from "path";
import sharp from "sharp";

const IMAGES_DIR = path.join(process.cwd(), "public", "images");
const MAX_WIDTH = 1920;
const WEBP_QUALITY = 82;

const files = fs
  .readdirSync(IMAGES_DIR)
  .filter((f) => /^s\d+\.jpg$/i.test(f))
  .sort((a, b) => {
    const na = parseInt(a.match(/\d+/)[0], 10);
    const nb = parseInt(b.match(/\d+/)[0], 10);
    return na - nb;
  });

if (files.length === 0) {
  console.log("No s*.jpg files found in public/images/");
  process.exit(0);
}

let beforeBytes = 0;
let afterBytes = 0;

for (const file of files) {
  const input = path.join(IMAGES_DIR, file);
  const output = path.join(IMAGES_DIR, file.replace(/\.jpg$/i, ".webp"));

  const inputStat = fs.statSync(input);
  beforeBytes += inputStat.size;

  await sharp(input)
    .rotate()
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY, effort: 4 })
    .toFile(output);

  afterBytes += fs.statSync(output).size;
  console.log(`${file} → ${path.basename(output)}`);
}

console.log(
  `\n${files.length} images converted. ${(beforeBytes / 1024 / 1024).toFixed(1)} MB JPG → ${(afterBytes / 1024 / 1024).toFixed(1)} MB WebP`,
);
