/**
 * Compress hero MP4 for web — preserves aspect ratio, no crop, no stretch.
 * Trims TRIM_START s off the head and TRIM_END s off the tail.
 * Run: npm run video:compress
 *
 * Optional one-time source: public/videos/brunch-vibes.source.mp4
 * Site ships only public/videos/brunch-vibes.mp4 (~13 MB).
 */
import { execFileSync, spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";

const TRIM_START = 2;
const TRIM_END = 2;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const videosDir = path.join(root, "public", "videos");
const source = path.join(videosDir, "brunch-vibes.source.mp4");
const output = path.join(videosDir, "brunch-vibes.mp4");
const temp = path.join(videosDir, "brunch-vibes.compressed.mp4");
const ffmpeg = ffmpegInstaller.path;

const input = fs.existsSync(source) ? source : output;

if (!fs.existsSync(input)) {
  console.error("Missing hero video:", input);
  process.exit(1);
}

function probeDurationSeconds(file) {
  const result = spawnSync(ffmpeg, ["-i", file], { encoding: "utf8" });
  const match = result.stderr.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/);
  if (!match) throw new Error(`Could not read duration for ${file}`);
  const [, h, m, s] = match;
  return Number(h) * 3600 + Number(m) * 60 + Number(s);
}

const fullDuration = probeDurationSeconds(input);
const clipDuration = fullDuration - TRIM_START - TRIM_END;

if (clipDuration <= 0) {
  console.error(
    `Clip too short: ${fullDuration.toFixed(2)}s — trim ${TRIM_START}+${TRIM_END}s leaves nothing.`,
  );
  process.exit(1);
}

const before = fs.statSync(input).size;
console.log(`Input: ${path.basename(input)} (${(before / 1024 / 1024).toFixed(1)} MB)`);
console.log(
  `Trim: ${TRIM_START}s → ${(fullDuration - TRIM_END).toFixed(2)}s (${clipDuration.toFixed(2)}s clip)`,
);

execFileSync(
  ffmpeg,
  [
    "-y",
    "-ss",
    String(TRIM_START),
    "-i",
    input,
    "-t",
    String(clipDuration),
    "-vf",
    "scale=min(iw\\,1280):-2:force_original_aspect_ratio=decrease,fps=24",
    "-c:v",
    "libx264",
    "-crf",
    "26",
    "-preset",
    "medium",
    "-pix_fmt",
    "yuv420p",
    "-an",
    "-movflags",
    "+faststart",
    temp,
  ],
  { stdio: "inherit" },
);

const after = fs.statSync(temp).size;
fs.renameSync(temp, output);

console.log(`\nDone: ${path.basename(output)} ${(after / 1024 / 1024).toFixed(1)} MB`);
