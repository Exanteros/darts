import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;

    // Prüfe ob User authentifiziert ist
    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    const isAdmin = token.role === 'ADMIN';
    const pathname = req.nextUrl.pathname;

    // Weiterleitung von /dashboard wird jetzt von der Seite selbst gehandhabt
    // (nicht mehr automatisch zu /user für Nicht-Admins)
    if (pathname === '/dashboard') {
      // Lasse die Seite selbst die Berechtigung prüfen
      return NextResponse.next();
    }

    // Für Admin-only API-Routen zusätzliche Rolle prüfen
    if (req.nextUrl.pathname.startsWith('/api/tournament/') ||
        req.nextUrl.pathname.startsWith('/api/logs/')) {
      if (token.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Administrator-Berechtigung erforderlich' },
          { status: 403 }
        );
      }
    }

    // Erstelle Response mit Security Headers
    const response = NextResponse.next();
    
    // Security Headers
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    
    // Content-Security-Policy (angepasst für Next.js)
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js benötigt unsafe-eval
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' ws: wss:",
      "frame-ancestors 'none'"
    ].join('; ');
    response.headers.set('Content-Security-Policy', csp);

    return response;
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    '/dashboard',
    '/dashboard/:path*',
    '/user/:path*',
    '/api/tournament/:path*',
    '/api/logs/:path*',
    '/api/admin/:path*'
  ]
};
