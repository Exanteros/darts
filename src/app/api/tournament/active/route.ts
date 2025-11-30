import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const activeTournamentId = cookieStore.get('activeTournamentId')?.value;
  
  return NextResponse.json({ activeTournamentId });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tournamentId } = body;
    
    if (!tournamentId) {
      return NextResponse.json({ error: 'Tournament ID required' }, { status: 400 });
    }

    const cookieStore = await cookies();
    // Set cookie for 30 days
    cookieStore.set('activeTournamentId', tournamentId, { 
      path: '/',
      maxAge: 60 * 60 * 24 * 30 
    });
    
    return NextResponse.json({ success: true, tournamentId });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
