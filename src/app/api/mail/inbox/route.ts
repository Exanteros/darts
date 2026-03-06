import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { syncEmails } from '@/lib/imap';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Optionally trigger a sync, but don't block for long
    // If it fails, we still return the DB results
    await syncEmails().catch(e => console.error(e));

    const emails = await prisma.supportEmail.findMany({
      orderBy: {
        createdAt: 'asc' // Fetch in chronological order so threads make sense
      },
      take: 200,
    });
    
    // Return in descending order (newest first)
    return NextResponse.json(emails.reverse());
  } catch (error) {
    console.error('Error fetching inbox:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
