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

    // Weiterleitung von /dashboard basierend auf Rolle
    if (pathname === '/dashboard') {
      if (isAdmin) {
        // Admin bleibt auf /dashboard
        return NextResponse.next();
      } else {
        // Normaler Benutzer wird zu /user weitergeleitet
        return NextResponse.redirect(new URL('/user', req.url));
      }
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

    return NextResponse.next();
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
