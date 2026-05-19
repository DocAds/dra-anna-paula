import sharp from "sharp";
import path from "node:path";
const SRC = "/tmp/anna-bgs";
const DST = path.resolve("public/img/dra");
const files = ["sobre-main", "sobre-detail", "sobre-moment-1", "sobre-moment-2"];
for (const f of files) {
  for (const w of [480, 960, 1440]) {
    const out = path.join(DST, `${f}-${w}.webp`);
    await sharp(path.join(SRC, `${f}.png`))
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: 80, effort: 5 })
      .toFile(out);
    console.log("✓", path.basename(out));
  }
}
