import sharp from "sharp";
import { promises as fs } from "node:fs";
import path from "node:path";

const SRC = path.resolve("public/logo/1.png"); // monograma AB cocoa fundo branco
const OUT_APP = path.resolve("src/app");
const OUT_PUB = path.resolve("public");

// gera versões PNG quadradas com fundo cream pra contraste
const bg = { r: 251, g: 247, b: 241, alpha: 1 }; // porcelain

async function pngSquare(size, outPath) {
  await sharp(SRC)
    .resize({ width: Math.round(size * 0.72), height: Math.round(size * 0.72), fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({
      top: Math.round(size * 0.14),
      bottom: Math.round(size * 0.14),
      left: Math.round(size * 0.14),
      right: Math.round(size * 0.14),
      background: bg,
    })
    .resize(size, size)
    .png()
    .toFile(outPath);
  console.log("✓", path.basename(outPath));
}

// PNG variantes (Next.js auto-detecta icon.png e apple-icon.png em app/)
await pngSquare(32, path.join(OUT_APP, "icon.png"));
await pngSquare(180, path.join(OUT_APP, "apple-icon.png"));
await pngSquare(192, path.join(OUT_PUB, "icon-192.png"));
await pngSquare(512, path.join(OUT_PUB, "icon-512.png"));

// favicon.ico
const ico16 = await sharp(SRC)
  .resize({ width: 11, height: 11, fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .extend({ top: 3, bottom: 2, left: 2, right: 3, background: bg })
  .png().toBuffer();
const ico32 = await sharp(SRC)
  .resize({ width: 23, height: 23, fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .extend({ top: 5, bottom: 4, left: 4, right: 5, background: bg })
  .png().toBuffer();
// Como ICO requer múltiplas resoluções, gravo só PNG no nome favicon.ico - browsers aceitam
await fs.writeFile(path.join(OUT_PUB, "favicon.ico"), ico32);
console.log("✓ favicon.ico");
