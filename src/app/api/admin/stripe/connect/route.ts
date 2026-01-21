import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const clientId = process.env.STRIPE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(new URL('/dashboard/tournament?error=stripe_no_client_id', request.url));
  }

  // Redirect to Stripe OAuth
  // NEXTAUTH_URL should be set in .env, e.g. https://example.com or http://localhost:3000
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const redirectUri = `${baseUrl}/api/admin/stripe/callback`;
  const state = Math.random().toString(36).substring(7); // Simple state
  
  const url = `https://connect.stripe.com/oauth/authorize?response_type=code&client_id=${clientId}&scope=read_write&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;

  return NextResponse.redirect(url);
}
