/**
 * Vercel Serverless Function - Admin Key Generation
 * POST /api/generate-keys
 */

import { generateLicenseKey, verifyPassword } from '../../core/crypto';
import { createApiEndpoint, validateBody, trackApiEvent, createErrorResponse } from '../lib/api-middleware';

const SECRET_KEY = process.env.LICENSE_SECRET_KEY || 'ff-ob54-benz-secret-key-2026';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';

interface GenerateKeyRequest {
  brandKey: string;
  modelKey: string;
  expiryDays: number;
  maxUses: number;
  count: number;
  adminPassword: string;
}

interface GeneratedKey {
  brandKey: string;
  modelKey: string;
  expiryDays: number;
  maxUses: number;
  createdAt: number;
  key: string;
}

export default createApiEndpoint(
  async (request, context) => {
    const validation = await validateBody<GenerateKeyRequest>(request, ['brandKey', 'modelKey', 'adminPassword']);
    if (validation.error) return validation.error;

    const { brandKey, modelKey, expiryDays, maxUses, count, adminPassword } = validation.data;

    const isValidPassword = await verifyPassword(adminPassword, ADMIN_PASSWORD_HASH);
    if (!isValidPassword) {
      await trackApiEvent('admin_generate_keys', { success: false, reason: 'invalid_password' });
      return createErrorResponse('Mật khẩu admin không đúng', 401);
    }

    const expiry = Math.max(0, parseInt(String(expiryDays)) || 0);
    const uses = Math.max(0, parseInt(String(maxUses)) || 0);
    const keyCount = Math.min(Math.max(1, parseInt(String(count)) || 1), 1000);

    const keys: GeneratedKey[] = [];
    for (let i = 0; i < keyCount; i++) {
      const key = await generateLicenseKey(brandKey, modelKey, expiry, uses, SECRET_KEY);
      keys.push({
        brandKey,
        modelKey,
        expiryDays: expiry,
        maxUses: uses,
        createdAt: Date.now(),
        key
      });
    }

    await trackApiEvent('admin_generate_keys', {
      success: true,
      count: keys.length,
      brandKey,
      modelKey,
      expiryDays: expiry,
      maxUses: uses
    });

    return new Response(JSON.stringify({
      success: true,
      keys,
      count: keys.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  },
  { limiter: 'admin' }
);