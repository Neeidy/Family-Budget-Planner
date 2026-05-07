/**
 * PWA icon generator.
 *
 * Renders a brand-gradient square with the panda mascot, then
 * outputs the four icon sizes vite-plugin-pwa expects:
 *   icon-192.png            (any-purpose 192x192, no padding)
 *   icon-512.png            (any-purpose 512x512, no padding)
 *   icon-512-maskable.png   (maskable, ~20% safe-area padding for
 *                            Android adaptive masks)
 *   apple-touch-icon.png    (180x180, iOS auto-rounds the corners
 *                            so we render flush to edge)
 *
 * Run:
 *   pnpm tsx scripts/generate-pwa-icons.ts
 */
import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, "..", "client", "public", "icons");

type IconSpec = {
  filename: string;
  size: number;
  /** Padding ratio (0-0.5). Maskable icons need ~20% safe area. */
  padding: number;
};

const ICONS: IconSpec[] = [
  { filename: "icon-192.png",          size: 192, padding: 0 },
  { filename: "icon-512.png",          size: 512, padding: 0 },
  { filename: "icon-512-maskable.png", size: 512, padding: 0.2 },
  { filename: "apple-touch-icon.png",  size: 180, padding: 0 },
];

/**
 * Brand SVG: gradient background (accent-green → owner-yigit blue,
 * matching sidebar avatar) with a stylized panda head built from
 * SVG primitives. Using primitives instead of an emoji glyph because
 * sharp/librsvg can't render Apple Color Emoji on macOS headless.
 */
function buildSvg(size: number, padding: number): string {
  const pad = Math.round(size * padding);
  const inner = size - pad * 2;
  // Outer square radius (only used when padding=0; maskable bg is
  // a full square for the OS to mask).
  const outerRadius = padding > 0 ? 0 : Math.round(size * 0.22);

  // Panda layout, all values relative to the inner content box.
  const cx = size / 2;
  const cy = size / 2;
  const faceR = inner * 0.32; // face radius
  const earR = inner * 0.13; // ear radius
  const earOffsetX = faceR * 0.85;
  const earOffsetY = faceR * 0.85;
  const eyeR = inner * 0.08; // black eye-patch radius
  const eyeOffsetX = faceR * 0.42;
  const eyeOffsetY = -faceR * 0.05;
  const pupilR = inner * 0.025;
  const noseR = inner * 0.035;
  const noseY = faceR * 0.2;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stop-color="#10b981"/>
      <stop offset="100%" stop-color="#3b82f6"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${outerRadius}" fill="url(#g)"/>
  <!-- ears (black) -->
  <circle cx="${cx - earOffsetX}" cy="${cy - earOffsetY}" r="${earR}" fill="#1a1a1a"/>
  <circle cx="${cx + earOffsetX}" cy="${cy - earOffsetY}" r="${earR}" fill="#1a1a1a"/>
  <!-- face (white) -->
  <circle cx="${cx}" cy="${cy}" r="${faceR}" fill="#ffffff"/>
  <!-- eye patches (black ovals) -->
  <ellipse cx="${cx - eyeOffsetX}" cy="${cy + eyeOffsetY}" rx="${eyeR}" ry="${eyeR * 1.25}" fill="#1a1a1a" transform="rotate(-15 ${cx - eyeOffsetX} ${cy + eyeOffsetY})"/>
  <ellipse cx="${cx + eyeOffsetX}" cy="${cy + eyeOffsetY}" rx="${eyeR}" ry="${eyeR * 1.25}" fill="#1a1a1a" transform="rotate(15 ${cx + eyeOffsetX} ${cy + eyeOffsetY})"/>
  <!-- pupils (white sparkle) -->
  <circle cx="${cx - eyeOffsetX + pupilR * 0.4}" cy="${cy + eyeOffsetY - pupilR * 0.4}" r="${pupilR}" fill="#ffffff"/>
  <circle cx="${cx + eyeOffsetX + pupilR * 0.4}" cy="${cy + eyeOffsetY - pupilR * 0.4}" r="${pupilR}" fill="#ffffff"/>
  <!-- nose (black) -->
  <circle cx="${cx}" cy="${cy + noseY}" r="${noseR}" fill="#1a1a1a"/>
</svg>`;
}

async function main() {
  for (const spec of ICONS) {
    const svg = buildSvg(spec.size, spec.padding);
    const outPath = path.join(OUT_DIR, spec.filename);
    await sharp(Buffer.from(svg)).png().toFile(outPath);
    console.log("→", spec.filename, `${spec.size}x${spec.size}`, `pad=${spec.padding}`);
  }
  console.log("done — wrote", ICONS.length, "files to", OUT_DIR);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
