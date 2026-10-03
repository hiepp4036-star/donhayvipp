/**
 * Generate PWA Icons Script
 * Creates icons in multiple sizes from a source SVG
 * Run: npx tsx scripts/generate-pwa-icons.ts
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve } from 'path';

const ICON_SIZES = [16, 32, 72, 96, 128, 144, 152, 192, 384, 512];
const OUTPUT_DIR = resolve(__dirname, '../public/icons');

// Source SVG - Rainbow "B" logo
const SOURCE_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b0d10"/>
      <stop offset="100%" stop-color="#13161c"/>
    </linearGradient>
    <linearGradient id="rainbowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ff3333"/>
      <stop offset="16%" stop-color="#ff8c1a"/>
      <stop offset="33%" stop-color="#ffd700"/>
      <stop offset="50%" stop-color="#00e64d"/>
      <stop offset="66%" stop-color="#1a8cff"/>
      <stop offset="83%" stop-color="#6666ff"/>
      <stop offset="100%" stop-color="#cc33ff"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="80" fill="url(#bgGrad)"/>
  <rect x="4" y="4" width="504" height="504" rx="76" fill="none" stroke="url(#rainbowGrad)" stroke-width="8" opacity="0.3"/>
  <text x="256" y="340" font-family="Arial Black, sans-serif" font-size="280" font-weight="900"
        text-anchor="middle" fill="url(#rainbowGrad)" stroke="#0b0d10" stroke-width="4" paint-order="stroke fill">
    B
  </text>
  <text x="256" y="420" font-family="Arial, sans-serif" font-size="48" font-weight="700"
        text-anchor="middle" fill="#8a8d97">
    OB54
  </text>
</svg>
`;

// Maskable icon (with safe zone)
const MASKABLE_SVG = (size: number) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b0d10"/>
      <stop offset="100%" stop-color="#13161c"/>
    </linearGradient>
    <linearGradient id="rainbowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ff3333"/>
      <stop offset="16%" stop-color="#ff8c1a"/>
      <stop offset="33%" stop-color="#ffd700"/>
      <stop offset="50%" stop-color="#00e64d"/>
      <stop offset="66%" stop-color="#1a8cff"/>
      <stop offset="83%" stop-color="#6666ff"/>
      <stop offset="100%" stop-color="#cc33ff"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.156}" fill="url(#bgGrad)"/>
  <rect x="4" y="4" width="${size - 8}" height="${size - 8}" rx="${size * 0.15}" fill="none" stroke="url(#rainbowGrad)" stroke-width="${size * 0.016}" opacity="0.3"/>
  <text x="${size / 2}" y="${size * 0.66}" font-family="Arial Black, sans-serif" font-size="${size * 0.55}" font-weight="900"
        text-anchor="middle" fill="url(#rainbowGrad)" stroke="#0b0d10" stroke-width="${size * 0.008}" paint-order="stroke fill">
    B
  </text>
</svg>
`;

async function generateIcons(): Promise<void> {
  console.log('🎨 Generating PWA icons...');

  // Create output directory
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // For now, we'll create placeholder PNG files
  // In production, use sharp or similar to convert SVG to PNG
  for (const size of ICON_SIZES) {
    const svgContent = MASKABLE_SVG(size);
    const filename = `icon-${size}.svg`;
    const filepath = resolve(OUTPUT_DIR, filename);
    writeFileSync(filepath, svgContent);
    console.log(`  ✅ ${filename} (${size}x${size})`);
  }

  // Create maskable versions
  for (const size of [192, 512]) {
    const svgContent = MASKABLE_SVG(size);
    const filename = `icon-${size}-maskable.svg`;
    const filepath = resolve(OUTPUT_DIR, filename);
    writeFileSync(filepath, svgContent);
    console.log(`  ✅ ${filename} (maskable)`);
  }

  // Create favicon
  const faviconSvg = MASKABLE_SVG(32);
  writeFileSync(resolve(OUTPUT_DIR, 'favicon.svg'), faviconSvg);
  console.log(`  ✅ favicon.svg`);

  // Create apple-touch-icon
  const appleSvg = MASKABLE_SVG(180);
  writeFileSync(resolve(OUTPUT_DIR, 'apple-touch-icon.svg'), appleSvg);
  console.log(`  ✅ apple-touch-icon.svg`);

  console.log('\n📝 Note: These are SVG placeholders.');
  console.log('   For production, convert to PNG using sharp or similar:');
  console.log('   npx sharp -i public/icons/icon-512.svg -o public/icons/icon-512.png');
  console.log('   Or use online converter: https://svg2png.com/');
  console.log('\n🎉 Done!');
}

generateIcons().catch(console.error);