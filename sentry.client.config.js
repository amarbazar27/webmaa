/**
 * Sentry Client-Side Configuration
 * Activates automatically when NEXT_PUBLIC_SENTRY_DSN is set.
 */

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  import('@sentry/nextjs').then((Sentry) => {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: process.env.NODE_ENV,

      // Performance Monitoring
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

      // Session Replay (captures 1% of sessions, 100% of error sessions)
      replaysSessionSampleRate: 0.01,
      replaysOnErrorSampleRate: 1.0,

      // Filter noise
      ignoreErrors: [
        'ResizeObserver loop',
        'Non-Error exception captured',
        'Network request failed',
        'Load failed',
        'ChunkLoadError',
        'Loading chunk',
      ],

      // Breadcrumbs
      beforeBreadcrumb(breadcrumb) {
        // Don't log console.log breadcrumbs in production
        if (breadcrumb.category === 'console' && breadcrumb.level === 'log') {
          return null;
        }
        return breadcrumb;
      },
    });
  });
}
