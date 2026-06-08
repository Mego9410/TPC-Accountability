import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(dir, "..");
const mark = path.join(root, "public", "brand", "monogram-gold.png");
const out = path.join(root, "public");

// Official midnight ground sampled from the supplied lockup.
const midnight = { r: 0x1b, g: 0x28, b: 0x30, alpha: 1 };

async function makeIcon(size, scale, file) {
  const markSize = Math.round(size * scale);
  const markBuf = await sharp(mark)
    .resize({
      width: markSize,
      height: markSize,
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  await sharp({
    create: { width: size, height: size, channels: 4, background: midnight },
  })
    .composite([{ input: markBuf, gravity: "center" }])
    .png()
    .toFile(path.join(out, file));

  console.log("wrote", file);
}

await makeIcon(192, 0.7, "icon-192.png");
await makeIcon(512, 0.7, "icon-512.png");
// Maskable needs extra safe-area padding so launchers can crop to a circle.
await makeIcon(512, 0.56, "icon-maskable-512.png");
