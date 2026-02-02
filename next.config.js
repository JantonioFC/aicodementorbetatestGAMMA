// next.config.cjs
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Performance: Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },

  // Performance: Enable compression
  compress: true,

  env: {
    // Se preserva tu configuración existente para la API Key.
    GEMINI_API_KEY: process.env.GEMINI_API_KEY
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
        ],
      },
      // Performance: Cache static assets aggressively
      {
        source: '/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },

  // AÑADIMOS la nueva directiva para Webpack aquí.
  webpack: (config, { isServer }) => {
    // Esta lógica se ejecuta durante la compilación.
    // La variable 'isServer' nos dice si estamos compilando para el servidor o para el cliente (navegador).

    // Si NO estamos compilando para el servidor (es decir, es para el cliente)...
    if (!isServer) {
      // ...le decimos a Webpack que cuando encuentre una importación de 'better-sqlite3',
      // la ignore y la reemplace con 'false', evitando el error.
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'better-sqlite3': false,
      };
    }

    // Devolvemos la configuración modificada para que Next.js la utilice.
    return config;
  },
};

// Inyectado por integración Sentry
const { withSentryConfig } = require('@sentry/nextjs');

module.exports = withSentryConfig(
  withBundleAnalyzer(nextConfig),
  {
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options

    // Suppresses all logs
    silent: true,
    org: "ai-code-mentor",
    project: "javascript-nextjs",
  },
  {
    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Transpiles SDK to be compatible with IE11 (increases bundle size)
    transpileClientSDK: true,

    // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
    // This can increase your server load as well as your hosting bill.
    // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
    // side errors will fail.
    tunnelRoute: "/monitoring",

    // Hides source maps from generated client bundles
    hideSourceMaps: true,

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,

    // Enables automatic instrumentation of Vercel Cron Monitors.
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,
  }
);
