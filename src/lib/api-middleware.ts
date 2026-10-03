/**
 * API Middleware & Utilities
 * Rate limiting, CORS, CSP, Error handling
 */

import { getApiRateLimiter, getAdminRateLimiter, getLicenseRateLimiter, trackEvent } from './redis';
import { captureException, withSentry } from './sentry';

interface RateLimitHeaders {
  'X-RateLimit-Limit': string;
  'X-RateLimit-Remaining': string;
  'X-RateLimit-Reset': string;
  'Retry-After'?: string;
}

interface CorsHeaders {
  'Access-Control-Allow-Origin': string;
  'Access-Control-Allow-Methods': string;
  'Access-Control-Allow-Headers': string;
  'Access-Control-Max-Age': string;
}

export const CORS_HEADERS: CorsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400'
};

export const SECURITY_HEADERS = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://pagead2.googlesyndication.com https://fonts.googleapis.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https://pagead2.googlesyndication.com https://www.google-analytics.com",
    "frame-src 'self' https://googleads.g.doubleclick.net",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; '),
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin'
} as const;

function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfIP = request.headers.get('cf-connecting-ip');
  return cfIP || forwarded?.split(',')[0]?.trim() || realIP || 'unknown';
}

function createRateLimitHeaders(result: { total: number; remaining: number; resetAt: number }): RateLimitHeaders {
  return {
    'X-RateLimit-Limit': String(result.total),
    'X-RateLimit-Remaining': String(Math.max(0, result.remaining)),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000))
  };
}

export async function handleRateLimit(
  request: Request,
  limiterType: 'api' | 'admin' | 'license' = 'api'
): Promise<{ allowed: boolean; headers: RateLimitHeaders; response?: Response }> {
  const ip = getClientIP(request);
  const limiter = limiterType === 'admin'
    ? getAdminRateLimiter()
    : limiterType === 'license'
      ? getLicenseRateLimiter()
      : getApiRateLimiter();

  const result = await limiter.checkLimit(ip);
  const headers = createRateLimitHeaders(result);

  if (!result.allowed) {
    headers['Retry-After'] = String(Math.ceil((result.resetAt - Date.now()) / 1000));
    return {
      allowed: false,
      headers,
      response: new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          retryAfter: headers['Retry-After']
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...headers,
            ...CORS_HEADERS,
            ...SECURITY_HEADERS
          }
        }
      )
    };
  }

  return { allowed: true, headers };
}

export function handleCORS(request: Request): Response | null {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        ...CORS_HEADERS,
        ...SECURITY_HEADERS
      }
    });
  }
  return null;
}

export function applySecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    headers.set(key, value);
  });
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

export function createApiResponse(
  data: any,
  status: number = 200,
  extraHeaders: Record<string, string> = {}
): Response {
  const headers = {
    'Content-Type': 'application/json',
    ...CORS_HEADERS,
    ...SECURITY_HEADERS,
    ...extraHeaders
  };
  return new Response(JSON.stringify(data), { status, headers });
}

export function createErrorResponse(
  error: string,
  status: number = 400,
  extraHeaders: Record<string, string> = {}
): Response {
  return createApiResponse({ error }, status, extraHeaders);
}

export type ApiHandler = (request: Request, context: { ip: string; rateLimitHeaders: RateLimitHeaders }) => Promise<Response>;

export function createApiEndpoint(
  handler: ApiHandler,
  options: { limiter?: 'api' | 'admin' | 'license'; requireAuth?: boolean } = {}
): (request: Request) => Promise<Response> {
  return async (request: Request) => {
    const corsResponse = handleCORS(request);
    if (corsResponse) return corsResponse;

    const rateLimitResult = await handleRateLimit(request, options.limiter || 'api');
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!;
    }

    const context = {
      ip: getClientIP(request),
      rateLimitHeaders: rateLimitResult.headers
    };

    try {
      const response = await withSentry(
        async () => handler(request, context),
        `api:${new URL(request.url).pathname}`
      );

      const headers = new Headers(response.headers);
      Object.entries(context.rateLimitHeaders).forEach(([key, value]) => {
        headers.set(key, value);
      });

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
      });
    } catch (error) {
      await captureException(error as Error, {
        tags: { endpoint: new URL(request.url).pathname }
      });

      const errorResponse = createErrorResponse(
        error instanceof Error ? error.message : 'Internal server error',
        500,
        context.rateLimitHeaders
      );
      return errorResponse;
    }
  };
}

export async function validateBody<T>(
  request: Request,
  requiredFields: string[]
): Promise<{ data: T; error?: Response }> {
  try {
    const body = await request.json() as T;

    for (const field of requiredFields) {
      if (!(field in body) || body[field as keyof T] === undefined || body[field as keyof T] === '') {
        return {
          data: body,
          error: createErrorResponse(`Missing required field: ${field}`, 400)
        };
      }
    }

    return { data: body };
  } catch {
    return {
      data: {} as T,
      error: createErrorResponse('Invalid JSON body', 400)
    };
  }
}

export async function trackApiEvent(
  event: string,
  data: Record<string, any>
): Promise<void> {
  await trackEvent(event, data);
}

export { getClientIP };
export type { RateLimitHeaders, CorsHeaders };