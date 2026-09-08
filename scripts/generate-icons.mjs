import sharp from "sharp";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { writeFileSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");

function createSvg(size) {
  return `
  <svg width="${size}" height="${size}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#141418" />
        <stop offset="100%" stop-color="#070709" />
      </linearGradient>
      <linearGradient id="glowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#22c55e" />
        <stop offset="50%" stop-color="#1ed760" />
        <stop offset="100%" stop-color="#1DB954" />
      </linearGradient>
      <linearGradient id="beamGrad1" x1="0%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" stop-color="#1DB954" stop-opacity="0.5" />
        <stop offset="100%" stop-color="#1DB954" stop-opacity="0" />
      </linearGradient>
      <linearGradient id="beamGrad2" x1="100%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" stop-color="#1ed760" stop-opacity="0.5" />
        <stop offset="100%" stop-color="#1ed760" stop-opacity="0" />
      </linearGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="10" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>

    <!-- App Icon Base -->
    <rect width="512" height="512" rx="112" fill="url(#bgGrad)" />
    <rect width="504" height="504" x="4" y="4" rx="108" fill="none" stroke="#1f2922" stroke-width="4" />

    <!-- Stage Spotlights / Beams -->
    <polygon points="60,0 200,420 280,420 160,0" fill="url(#beamGrad1)" />
    <polygon points="452,0 312,420 232,420 352,0" fill="url(#beamGrad2)" />

    <!-- Ticket / Stage Pass Badge Shape -->
    <g filter="url(#glow)">
      <!-- Central ticket emblem -->
      <path d="M176 160 C176 142 190 128 208 128 L304 128 C322 128 336 142 336 160 L336 216 C320 216 308 228 308 244 C308 260 320 272 336 272 L336 352 C336 370 322 384 304 384 L208 384 C190 384 176 370 176 352 L176 272 C192 272 204 260 204 244 C204 228 192 216 176 216 Z" 
            fill="#101411" 
            stroke="url(#glowGrad)" 
            stroke-width="8" />

      <!-- Pass Neck Hole / Lanyard slot -->
      <rect x="232" y="152" width="48" height="12" rx="6" fill="url(#glowGrad)" />

      <!-- Center Audio Wave / Stage Graphic -->
      <path d="M216 280 L216 240 M236 300 L236 220 M256 312 L256 208 M276 300 L276 220 M296 280 L296 240" 
            stroke="url(#glowGrad)" 
            stroke-width="8" 
            stroke-linecap="round" />
    </g>
  </svg>`.trim();
}

async function run() {
  console.log("Generating Spotify Green StagePass icons...");
  
  // Save icon.svg
  const svgContent = createSvg(512);
  writeFileSync(join(publicDir, "icon.svg"), svgContent, "utf-8");

  // Generate PNG sizes
  const sizes = [192, 512];
  for (const size of sizes) {
    const svg = Buffer.from(createSvg(size));
    const outputPath = join(publicDir, `icon-${size}x${size}.png`);
    await sharp(svg)
      .resize(size, size)
      .png({ quality: 100 })
      .toFile(outputPath);
    console.log(`✓ Generated ${outputPath} (${size}x${size})`);
  }

  // Generate apple-touch-icon (180x180)
  const applePath = join(publicDir, "apple-touch-icon.png");
  await sharp(Buffer.from(createSvg(512)))
    .resize(180, 180)
    .png({ quality: 100 })
    .toFile(applePath);
  console.log(`✓ Generated ${applePath} (180x180)`);

  console.log("Icons updated successfully!");
}

run().catch((err) => {
  console.error("Error generating icons:", err);
  process.exit(1);
});
