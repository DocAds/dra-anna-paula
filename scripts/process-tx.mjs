import sharp from "sharp";
import { promises as fs } from "node:fs";
import path from "node:path";
const SRC = "/tmp/anna-bgs";
const DST = path.resolve("public/img/bg");
const files = (await fs.readdir(SRC)).filter(f => f.startsWith("tx-") && f.endsWith(".png"));
for (const f of files) {
  const base = f.replace(".png","");
  for (const w of [800, 1200, 1600]) {
    const out = path.join(DST, `${base}-${w}.webp`);
    await sharp(path.join(SRC, f))
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: 75, effort: 5 })
      .toFile(out);
    console.log("✓", path.basename(out));
  }
}
