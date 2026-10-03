/**
 * Library Module Exports
 * Utility libraries for production features
 */

// Redis & Rate Limiting
export {
  createRedisClient,
  getRedis,
  getApiRateLimiter,
  getAdminRateLimiter,
  getLicenseRateLimiter,
  FixedWindowRateLimiter,
  SlidingWindowRateLimiter,
  trackEvent,
  getAnalyticsSummary,
  type RedisClient,
  type RateLimitResult,
  type AnalyticsSummary
} from './redis';

// Sentry Error Tracking
export {
  initSentry,
  captureException,
  captureMessage,
  setUserContext,
  addBreadcrumb,
  startTransaction,
  withSentry,
  checkSentryHealth,
  initSentryBrowser
} from './sentry';

// API Middleware
export {
  createApiEndpoint,
  validateBody,
  trackApiEvent,
  handleRateLimit,
  handleCORS,
  applySecurityHeaders,
  createApiResponse,
  createErrorResponse,
  getClientIP,
  CORS_HEADERS,
  SECURITY_HEADERS,
  type RateLimitHeaders,
  type CorsHeaders,
  type ApiHandler
} from './api-middleware';