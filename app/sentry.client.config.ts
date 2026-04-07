import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,       // 10% de transacciones — no gasta cuota
  replaysOnErrorSampleRate: 1, // 100% de sesiones con error
  replaysSessionSampleRate: 0, // No graba sesiones normales
  integrations: [
    Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false }),
  ],
});
