import sharp from "sharp";
import { promises as fs } from "node:fs";
import path from "node:path";

const SRC = "/tmp/anna-source/fotos";
const DST = path.resolve("public/img/dra");
const SIZES = [480, 960, 1440, 2000];

const files = [
  { in: "dra-principal.jpg", out: "dra-principal" },
  { in: "dra-fundo.webp", out: "dra-fundo" },
  { in: "dra-1.jpg", out: "dra-1" },
  { in: "dra-2.jpg", out: "dra-2" },
  { in: "dra-3.jpg", out: "dra-3" },
  { in: "dra-4.jpg", out: "dra-4" },
  { in: "dra-5.jpg", out: "dra-5" },
  { in: "dra-6.jpg", out: "dra-6" },
];

await fs.mkdir(DST, { recursive: true });

for (const f of files) {
  const inPath = path.join(SRC, f.in);
  for (const w of SIZES) {
    const outPath = path.join(DST, `${f.out}-${w}.webp`);
    await sharp(inPath)
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: 78, effort: 5 })
      .toFile(outPath);
    console.log("✓", path.relative(process.cwd(), outPath));
  }
}
console.log("done.");
