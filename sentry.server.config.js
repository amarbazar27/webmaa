/**
 * Sentry Server-Side Configuration
 * Activates automatically when SENTRY_DSN is set.
 */

const SENTRY_DSN = process.env.SENTRY_DSN;

if (SENTRY_DSN) {
  import('@sentry/nextjs').then((Sentry) => {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: process.env.NODE_ENV,

      // Performance Monitoring
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 1.0,

      // Filter noise
      ignoreErrors: [
        'ECONNRESET',
        'ETIMEDOUT',
        'socket hang up',
        'DEADLINE_EXCEEDED',
      ],
    });
  });
}
