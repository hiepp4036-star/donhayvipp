/**
 * Generate Device Catalog Script
 * Parses the original HTML and extracts device catalog to JSON
 * Run: npx tsx scripts/generate-catalog.ts
 */

import { writeFileSync } from 'fs';
import { resolve } from 'path';

interface DeviceModel {
  k: string;
  n: string;
  dpi: number;
  hz: number;
  tl: number;
  pt: number;
  tier: string;
}

interface DeviceCatalog {
  key: string;
  name: string;
  os: 'iOS' | 'Android';
  models: DeviceModel[];
}

// This is a utility to extract catalog from the original index.html
// For now, we'll use the catalog already created in src/assets/data/device-catalog.json

async function generateCatalog(): Promise<void> {
  console.log('📦 Device catalog already exists at src/assets/data/device-catalog.json');
  console.log('📊 Catalog stats:');

  const catalog = await import('../src/assets/data/device-catalog.json');

  let totalModels = 0;
  let totalBrands = catalog.default.length;

  for (const brand of catalog.default) {
    console.log(`  ${brand.name} (${brand.os}): ${brand.models.length} models`);
    totalModels += brand.models.length;
  }

  console.log(`\n✅ Total: ${totalBrands} brands, ${totalModels} models`);

  // Tier distribution
  const tierCounts: Record<string, number> = {};
  for (const brand of catalog.default) {
    for (const model of brand.models) {
      tierCounts[model.tier] = (tierCounts[model.tier] || 0) + 1;
    }
  }

  console.log('\n📈 Tier distribution:');
  const tierOrder = ['FN', 'FS', 'FO', 'UM', 'MD', 'GM', 'BG', 'TP', 'TL', 'LG'];
  for (const tier of tierOrder) {
    if (tierCounts[tier]) {
      console.log(`  ${tier}: ${tierCounts[tier]} models`);
    }
  }

  // OS distribution
  const iosCount = catalog.default.filter((b: DeviceCatalog) => b.os === 'iOS').reduce((a: number, b: DeviceCatalog) => a + b.models.length, 0);
  const androidCount = totalModels - iosCount;
  console.log(`\n📱 OS: iOS ${iosCount} | Android ${androidCount}`);
}

generateCatalog().catch(console.error);