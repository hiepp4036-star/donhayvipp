/**
 * Vercel Edge Function - Admin Metrics Stream (SSE)
 * GET /api/admin-metrics/stream
 */

import { getAnalyticsSummary } from '../lib/redis';
import { createApiEndpoint } from '../lib/api-middleware';

export default createApiEndpoint(
  async (request) => {
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        const send = (data: any) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        const sendEvent = (event: string, data: any) => {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        };

        sendEvent('connected', { timestamp: Date.now() });

        try {
          const initial = await getAnalyticsSummary(24);
          send(initial);
        } catch (err) {
          sendEvent('error', { message: 'Failed to fetch initial data' });
        }

        const interval = setInterval(async () => {
          try {
            const data = await getAnalyticsSummary(24);
            send(data);
          } catch (err) {
            sendEvent('error', { message: 'Failed to fetch update' });
          }
        }, 30000);

        const heartbeat = setInterval(() => {
          sendEvent('heartbeat', { timestamp: Date.now() });
        }, 15000);

        request.signal.addEventListener('abort', () => {
          clearInterval(interval);
          clearInterval(heartbeat);
          controller.close();
        });
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
        'X-Accel-Buffering': 'no'
      }
    });
  },
  { limiter: 'admin' }
);

export const config = {
  runtime: 'edge',
  regions: ['iad1', 'sfo1']
};