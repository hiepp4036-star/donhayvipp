/**
 * Vercel Serverless Function - License Key Validation
 * POST /api/validate-key
 */

import { hmacSha256 } from '../../core/crypto';
import { createApiEndpoint, validateBody, trackApiEvent, createErrorResponse } from '../lib/api-middleware';

const SECRET_KEY = process.env.LICENSE_SECRET_KEY || 'ff-ob54-benz-secret-key-2026';

interface ValidateKeyRequest {
  key: string;
  brandKey: string;
  modelKey: string;
  fingerprint?: string;
}

export default createApiEndpoint(
  async (request, context) => {
    const validation = await validateBody<ValidateKeyRequest>(request, ['key', 'brandKey', 'modelKey']);
    if (validation.error) return validation.error;

    const { key, brandKey, modelKey, fingerprint } = validation.data;

    const parts = key.split('-');
    if (parts.length !== 8 || parts[0] !== 'BZ' || parts[1] !== 'OB54') {
      await trackApiEvent('license_validated', { valid: false, reason: 'invalid_format', brandKey, modelKey });
      return createErrorResponse('Định dạng key không hợp lệ', 400);
    }

    const [, , keyBrand, keyModel, , expiryStr, maxUsesStr, hmacProvided] = parts;
    const expiryTs = parseInt(expiryStr, 10);
    const maxUses = parseInt(maxUsesStr, 10);

    if (keyBrand.toLowerCase() !== brandKey.toLowerCase()) {
      await trackApiEvent('license_validated', { valid: false, reason: 'brand_mismatch', brandKey, modelKey });
      return createErrorResponse('Key không dành cho hãng máy này', 400);
    }

    if (keyModel.toLowerCase() !== modelKey.toLowerCase()) {
      await trackApiEvent('license_validated', { valid: false, reason: 'model_mismatch', brandKey, modelKey });
      return createErrorResponse('Key không dành cho dòng máy này', 400);
    }

    const payload = parts.slice(0, 7).join('-');
    const hmacExpected = (await hmacSha256(SECRET_KEY, payload)).substring(0, 16).toUpperCase();

    if (hmacProvided !== hmacExpected) {
      await trackApiEvent('license_validated', { valid: false, reason: 'invalid_hmac', brandKey, modelKey });
      return createErrorResponse('Key không hợp lệ (chữ ký sai)', 400);
    }

    if (expiryTs > 0 && Date.now() > expiryTs) {
      await trackApiEvent('license_validated', { valid: false, reason: 'expired', brandKey, modelKey });
      return createErrorResponse('Key đã hết hạn', 400);
    }

    if (fingerprint) {
      console.log('[API] Fingerprint:', fingerprint);
    }

    const daysLeft = expiryTs > 0 ? Math.ceil((expiryTs - Date.now()) / 86400000) : 0;
    const isLifetime = expiryTs === 0;

    await trackApiEvent('license_validated', {
      valid: true,
      brandKey,
      modelKey,
      daysLeft,
      isLifetime,
      maxUses
    });

    return new Response(JSON.stringify({
      valid: true,
      data: {
        brandKey: keyBrand.toLowerCase(),
        modelKey: keyModel.toLowerCase(),
        expiryDays: daysLeft,
        maxUses,
        remainingUses: maxUses > 0 ? maxUses : null,
        remainingDays: daysLeft,
        isLifetime
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  },
  { limiter: 'license' }
);