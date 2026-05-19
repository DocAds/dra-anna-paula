import sharp from "sharp";
import { promises as fs } from "node:fs";
import path from "node:path";
const SRC = path.resolve("public/logo");
const variants = [
  { in: "3.png", out: "logo-cocoa-full" },      // header light bg
  { in: "4.png", out: "logo-cream-full" },      // dark bg
  { in: "1.png", out: "monogram-cocoa" },
  { in: "2.png", out: "monogram-cream" },
  { in: "5.png", out: "lockup-cocoa" },
  { in: "6.png", out: "lockup-cream" },
];
for (const v of variants) {
  const inP = path.join(SRC, v.in);
  for (const w of [240, 480, 720]) {
    const outP = path.join(SRC, `${v.out}-${w}.webp`);
    await sharp(inP)
      .trim({ threshold: 5 })
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: 92, effort: 5, alphaQuality: 100 })
      .toFile(outP);
    console.log("✓", path.basename(outP));
  }
}
console.log("done.");
