import sharp from "sharp";
import path from "node:path";
const SRC = "/tmp/anna-bgs";
const DST = path.resolve("public/img/bg");
const files = [
  "hero-drapery",
  "section-botanical",
  "section-water",
  "section-clay",
  "cta-curtain",
];
for (const name of files) {
  for (const w of [960, 1600, 2400]) {
    const out = path.join(DST, `${name}-${w}.webp`);
    await sharp(path.join(SRC, `${name}.png`))
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: 70, effort: 5 })
      .toFile(out);
    console.log("✓", path.basename(out));
  }
}
