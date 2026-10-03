/**
 * Vercel Serverless Function - Admin Metrics
 * GET /api/admin-metrics
 */

import { getAnalyticsSummary } from '../lib/redis';
import { createApiEndpoint } from '../lib/api-middleware';

export default createApiEndpoint(
  async (request) => {
    const url = new URL(request.url);
    const hours = parseInt(url.searchParams.get('hours') || '24', 10);
    const clampHours = Math.min(Math.max(hours, 1), 168);

    const summary = await getAnalyticsSummary(clampHours);

    return new Response(JSON.stringify({
      success: true,
      data: {
        ...summary,
        period: `${clampHours}h`,
        timestamp: Date.now()
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  },
  { limiter: 'admin' }
);