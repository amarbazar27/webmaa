/**
 * Sentry Edge Runtime Configuration
 * For middleware and edge-rendered routes.
 */

const SENTRY_DSN = process.env.SENTRY_DSN;

if (SENTRY_DSN) {
  import('@sentry/nextjs').then((Sentry) => {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 1.0,
    });
  });
}
