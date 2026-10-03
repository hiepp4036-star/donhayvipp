/**
 * Deployment Verification Script
 * Checks if all required configurations are in place
 * Run: npx tsx scripts/verify-deploy.ts
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

interface CheckResult {
  name: string;
  passed: boolean;
  message: string;
  required: boolean;
}

const checks: CheckResult[] = [];

function check(name: string, condition: boolean, message: string, required = true): void {
  checks.push({ name, passed: condition, message, required });
  const icon = condition ? '✅' : (required ? '❌' : '⚠️');
  console.log(`${icon} ${name}: ${message}`);
}

async function runChecks(): Promise<void> {
  console.log('\n🔍 Verifying deployment configuration...\n');

  // 1. Package.json exists and valid
  const pkgPath = resolve(__dirname, '../package.json');
  check(
    'package.json',
    existsSync(pkgPath),
    existsSync(pkgPath) ? 'Found' : 'Missing',
    true
  );

  if (existsSync(pkgPath)) {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    check('package.json - name', !!pkg.name, pkg.name || 'Missing name');
    check('package.json - version', !!pkg.version, pkg.version || 'Missing version');
    check('package.json - build script', !!pkg.scripts?.build, pkg.scripts?.build || 'Missing build script');
    check('package.json - dev script', !!pkg.scripts?.dev, pkg.scripts?.dev || 'Missing dev script');
  }

  // 2. TypeScript config
  check('tsconfig.json', existsSync(resolve(__dirname, '../tsconfig.json')), 'Found', true);

  // 3. Vite config
  check('vite.config.ts', existsSync(resolve(__dirname, '../vite.config.ts')), 'Found', true);

  // 4. Vercel config
  check('vercel.json', existsSync(resolve(__dirname, '../vercel.json')), 'Found', true);

  // 5. Source files
  const requiredFiles = [
    'src/main.ts',
    'src/admin.ts',
    'index.html',
    'admin.html',
    'src/core/algorithm.ts',
    'src/core/constants.ts',
    'src/core/crypto.ts',
    'src/core/storage.ts',
    'src/core/i18n.ts',
    'src/components/DeviceSelector.ts',
    'src/components/SensitivityForm.ts',
    'src/components/ResultPanel.ts',
    'src/components/LicenseGate.ts',
    'src/components/AdminKeygen.ts',
    'src/components/AdminDashboard.ts',
    'src/components/MatrixRain.ts',
    'src/components/SoundEngine.ts',
    'src/lib/redis.ts',
    'src/lib/sentry.ts',
    'src/lib/api-middleware.ts',
    'src/api/validate-key.ts',
    'src/api/generate-keys.ts',
    'src/api/admin-metrics.ts',
    'src/api/admin-metrics-stream.ts',
    'src/api/health.ts',
    'src/assets/data/device-catalog.json',
    'src/assets/styles/main.css',
    'public/manifest.json',
    'public/sw.js'
  ];

  for (const file of requiredFiles) {
    check(`Source: ${file}`, existsSync(resolve(__dirname, `../${file}`)), 'Found', true);
  }

  // 6. Environment variables
  console.log('\n📋 Environment Variables:');
  const requiredEnv = [
    'LICENSE_SECRET_KEY',
    'ADMIN_PASSWORD_HASH'
  ];

  const optionalEnv = [
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
    'SENTRY_DSN',
    'NEXT_PUBLIC_SENTRY_DSN'
  ];

  for (const env of requiredEnv) {
    const value = process.env[env];
    check(`ENV: ${env}`, !!value, value ? 'Set' : 'NOT SET (required)', true);
  }

  for (const env of optionalEnv) {
    const value = process.env[env];
    check(`ENV: ${env}`, !!value, value ? 'Set' : 'Not set (optional)', false);
  }

  // 7. .env.local exists
  check('.env.local', existsSync(resolve(__dirname, '../.env.local')), 'Found (copy from .env.example)', false);

  // 7. GitHub Actions workflow
  check('GitHub Actions', existsSync(resolve(__dirname, '../.github/workflows/deploy.yml')), 'Found', false);

  // 8. README
  check('README.md', existsSync(resolve(__dirname, '../README.md')), 'Found', false);

  // 9. LICENSE
  check('LICENSE', existsSync(resolve(__dirname, '../LICENSE')), 'Found', false);

  // Summary
  console.log('\n📊 Summary:');
  const passed = checks.filter(c => c.passed).length;
  const failed = checks.filter(c => !c.passed && c.required).length;
  const warnings = checks.filter(c => !c.passed && !c.required).length;
  const total = checks.length;

  console.log(`  Total checks: ${total}`);
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed (required): ${failed}`);
  console.log(`  Warnings (optional): ${warnings}`);

  if (failed > 0) {
    console.log('\n❌ Deployment NOT ready - fix required checks above');
    process.exit(1);
  } else if (warnings > 0) {
    console.log('\n⚠️ Deployment ready with warnings - consider optional items');
    process.exit(0);
  } else {
    console.log('\n✅ All checks passed - ready to deploy!');
    process.exit(0);
  }
}

runChecks().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});