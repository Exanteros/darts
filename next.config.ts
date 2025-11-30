import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker/Standalone Output für optimierte Production Builds
  output: 'standalone',
  
  eslint: {
    // Während des Builds werden ESLint-Warnungen ignoriert
    ignoreDuringBuilds: true,
  },
  async headers() {
    // WebSocket-URLs für verschiedene Umgebungen
    const wsUrls = process.env.NODE_ENV === 'production'
      ? 'ws://localhost:3001 wss://localhost:3001' // In Produktion: Passe dies an deine Domain an
      : 'ws://localhost:3001 ws://127.0.0.1:3001';
    
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js benötigt unsafe-eval für HMR
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              `connect-src 'self' ${wsUrls}`, // WebSocket für Echtzeit-Updates
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
