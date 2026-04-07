import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {};

export default withSentryConfig(nextConfig, {
  org:     'cinme',
  project: 'javascript-nextjs',
  silent:  true,             // No spam en el build log
  widenClientFileUpload: true,
  disableLogger: true,
  automaticVercelMonitors: true,
});
