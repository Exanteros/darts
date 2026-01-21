import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  if(!code) {
    return NextResponse.redirect(new URL('/dashboard/tournament?error=no_code', request.url));
  }
  
  try {
     // Use the Platform's Secret Key
     const stripeRaw = process.env.STRIPE_SECRET_KEY;
     if(!stripeRaw) throw new Error("Missing System Stripe Key");
     
     const stripe = new Stripe(stripeRaw, { apiVersion: '2024-12-18.acacia' }); // using latest or existing version
     
     const response = await stripe.oauth.token({
       grant_type: 'authorization_code',
       code,
     });

     const connectedAccountId = response.stripe_user_id;

     // Update System Settings
     await prisma.systemSettings.upsert({
       where: { id: 'default' },
       create: {
         id: 'default',
         stripeAccountId: connectedAccountId,
         stripeConnected: true,
         stripeEnabled: true
       },
       update: {
         stripeAccountId: connectedAccountId,
         stripeConnected: true,
         stripeEnabled: true
       }
     });

     return NextResponse.redirect(new URL('/dashboard/tournament?success=stripe_connected', request.url));

  } catch(e) {
     console.error("Stripe Connect Error:", e);
     return NextResponse.redirect(new URL('/dashboard/tournament?error=stripe_connect_failed', request.url));
  }
}
