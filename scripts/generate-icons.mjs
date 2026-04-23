// scripts/generate-icons.mjs
// Generates PWA icons from the existing logo.svg using sharp
import { createCanvas } from "canvas";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = join(process.cwd(), "public", "icons");

mkdirSync(iconsDir, { recursive: true });

// We'll create SVG-based placeholder icons with the brand color
// and "BE" monogram that look great on any device
const BG_COLOR = "#1b3022";
const TEXT_COLOR = "#ffffff";

function createIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = BG_COLOR;
  ctx.beginPath();
  const radius = size * 0.22;
  ctx.roundRect(0, 0, size, size, radius);
  ctx.fill();

  // Book shape
  const bookW = size * 0.52;
  const bookH = size * 0.38;
  const bookX = (size - bookW) / 2;
  const bookY = size * 0.34;

  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.fillRect(bookX, bookY, bookW, bookH);

  ctx.fillStyle = TEXT_COLOR;
  ctx.fillRect(bookX, bookY, bookW * 0.48, bookH);

  // Spine
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fillRect(size / 2 - size * 0.015, bookY, size * 0.03, bookH);

  // "B" letter above
  ctx.fillStyle = TEXT_COLOR;
  ctx.font = `bold ${size * 0.22}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("B", size / 2, size * 0.22);

  return canvas.toBuffer("image/png");
}

for (const size of sizes) {
  try {
    const buf = createIcon(size);
    writeFileSync(join(iconsDir, `icon-${size}x${size}.png`), buf);
    console.log(`✅ Generated icon-${size}x${size}.png`);
  } catch (e) {
    console.log(`⚠️  Skipped ${size}px:`, e.message);
  }
}

console.log("Done! Icons in public/icons/");
