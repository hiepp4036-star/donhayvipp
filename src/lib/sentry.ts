/**
 * Sentry Error Tracking Integration
 * Works on both client and server (Vercel Edge)
 */

interface SentryEvent {
  message: string;
  level: 'error' | 'warning' | 'info' | 'debug';
  tags?: Record<string, string>;
  extra?: Record<string, any>;
  user?: {
    id?: string;
    email?: string;
    username?: string;
  };
  fingerprint?: string[];
}

let sentryDsn: string | null = null;
let sentryEnabled = false;

/**
 * Initialize Sentry with DSN
 */
export function initSentry(dsn: string): void {
  sentryDsn = dsn;
  sentryEnabled = true;
  console.log('[Sentry] Initialized');
}

/**
 * Capture exception/error
 */
export async function captureException(
  error: Error | string,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, any>;
    user?: { id?: string; email?: string };
    level?: 'error' | 'warning' | 'info';
  }
): Promise<string | null> {
  if (!sentryEnabled || !sentryDsn) {
    console.error('[Sentry] Not initialized, error:', error);
    return null;
  }

  try {
    const event: SentryEvent = {
      message: error instanceof Error ? error.message : error,
      level: context?.level || 'error',
      tags: {
        environment: process.env.NODE_ENV || 'development',
        ...context?.tags
      },
      extra: {
        stack: error instanceof Error ? error.stack : undefined,
        ...context?.extra
      },
      user: context?.user,
      fingerprint: error instanceof Error ? [error.name, error.message] : [String(error)]
    };

    // Send to Sentry (using fetch for Edge compatibility)
    const response = await fetch(`${sentryDsn.replace('https://', 'https://o')}/api/${sentryDsn.split('/').pop()}/envelope/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    });

    if (!response.ok) {
      console.warn('[Sentry] Failed to send event:', response.statusText);
    }

    return 'event-id'; // Sentry would return event ID
  } catch (err) {
    console.error('[Sentry] Capture failed:', err);
    return null;
  }
}

/**
 * Capture message
 */
export async function captureMessage(
  message: string,
  level: 'error' | 'warning' | 'info' | 'debug' = 'info',
  context?: { tags?: Record<string, string>; extra?: Record<string, any> }
): Promise<void> {
  await captureException(message, { level, tags: context?.tags, extra: context?.extra });
}

/**
 * Set user context
 */
export function setUserContext(user: { id: string; email?: string; username?: string } | null): void {
  // Store in global for subsequent events
  (globalThis as any).__sentryUser = user;
}

/**
 * Add breadcrumb
 */
export function addBreadcrumb(
  category: string,
  message: string,
  data?: Record<string, any>,
  level: 'debug' | 'info' | 'warning' | 'error' = 'info'
): void {
  // In a real implementation, this would queue breadcrumbs
  console.log(`[Sentry Breadcrumb] ${category}: ${message}`, data);
}

/**
 * Performance monitoring - start transaction
 */
export function startTransaction(name: string, op: string): { finish: (status?: string) => void } {
  const startTime = performance.now();

  return {
    finish: (status = 'ok') => {
      const duration = performance.now() - startTime;
      if (sentryEnabled) {
        // Send transaction to Sentry
        captureMessage(`Transaction: ${name}`, 'info', {
          extra: { transaction: name, op, duration, status }
        });
      }
    }
  };
}

/**
 * Wrapper for async functions with automatic error tracking
 */
export function withSentry<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  name: string
): T {
  return (async (...args: any[]) => {
    const transaction = startTransaction(name, 'function');
    try {
      const result = await fn(...args);
      transaction.finish('ok');
      return result;
    } catch (error) {
      transaction.finish('error');
      await captureException(error as Error, { tags: { function: name } });
      throw error;
    }
  }) as T;
}

/**
 * Health check for Sentry
 */
export async function checkSentryHealth(): Promise<boolean> {
  if (!sentryEnabled || !sentryDsn) return false;
  try {
    const response = await fetch(`${sentryDsn.replace('https://', 'https://o')}/api/${sentryDsn.split('/').pop()}/envelope/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'health check', level: 'debug' })
    });
    return response.ok;
  } catch {
    return false;
  }
}

// Client-side initialization (browser only)
export function initSentryBrowser(): void {
  if (typeof window === 'undefined') return;

  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || '';
  if (dsn) {
    initSentry(dsn);

    // Global error handler
    window.addEventListener('error', (event) => {
      captureException(event.error || event.message, {
        tags: { source: 'window.onerror' },
        extra: { filename: event.filename, lineno: event.lineno, colno: event.colno }
      });
    });

    // Unhandled promise rejection
    window.addEventListener('unhandledrejection', (event) => {
      captureException(event.reason, {
        tags: { source: 'unhandledrejection' }
      });
    });
  }
}