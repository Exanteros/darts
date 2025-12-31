import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = session.role === 'ADMIN';
    let allowedTournamentIds: string[] = [];

    if (!isAdmin) {
      const access = await prisma.tournamentAccess.findMany({
        where: { userId: session.userId },
        select: { tournamentId: true }
      });

      if (access.length === 0) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
      allowedTournamentIds = access.map(a => a.tournamentId);
    }

    // Get tournament settings (global defaults)
    let settings = await prisma.tournamentSettings.findUnique({
      where: { id: 'default' },
    });

    if (!settings) {
      // Create default settings if not exist
      settings = await (prisma as any).tournamentSettings.create({
        data: {
          id: 'default',
          defaultMaxPlayers: 64,
          defaultEntryFee: 0,
          allowLateRegistration: true,
          autoStartGames: false,
          showLiveScores: true,
          enableStatistics: true,
        },
      });
    }

    const cookieStore = await cookies();
    const activeTournamentId = cookieStore.get('activeTournamentId')?.value;

    let activeTournament = null;
    
    // 1. Try to get from cookie
    if (activeTournamentId) {
      // Verify access if not global admin
      if (isAdmin || allowedTournamentIds.includes(activeTournamentId)) {
        activeTournament = await prisma.tournament.findUnique({
          where: { id: activeTournamentId }
        });
      }
    }

    // 2. If not found, try to get the most recent one
    if (!activeTournament) {
      // Get the active tournament (or the first one if multiple exist)
      // Filter by access if not global admin
      activeTournament = await prisma.tournament.findFirst({
        where: isAdmin ? {} : { id: { in: allowedTournamentIds } },
        orderBy: {
          createdAt: 'desc'
        }
      });
    }

    // Transform to match UI expectations
    const transformedSettings = {
      id: activeTournament?.id || settings!.id, // Use tournament ID if available, else default settings ID
      name: activeTournament?.name || '',
      description: activeTournament?.description || '',
      startDate: activeTournament?.startDate ? new Date(activeTournament.startDate).toISOString().split('T')[0] : undefined,
      endDate: activeTournament?.endDate ? new Date(activeTournament.endDate).toISOString().split('T')[0] : undefined,
      status: activeTournament?.status || 'UPCOMING',
      maxPlayers: activeTournament?.maxPlayers || (settings as any).defaultMaxPlayers,
      entryFee: activeTournament?.entryFee || (settings as any).defaultEntryFee,
      gameMode: (activeTournament as any)?.gameMode || '501',
      checkoutMode: (activeTournament as any)?.checkoutMode || 'DOUBLE_OUT',
      location: (activeTournament as any)?.location || '',
      street: (activeTournament as any)?.street || '',
      legSettings: {
        round1to3: 2,
        semifinalsAndFinal: 3
      },
      allowLateRegistration: (settings as any).allowLateRegistration,
      autoStartGames: (settings as any).autoStartGames,
      showLiveScores: (settings as any).showLiveScores,
      enableStatistics: (settings as any).enableStatistics,
      stripeEnabled: (settings as any).stripeEnabled || false,
      stripePublishableKey: (settings as any).stripePublishableKey || '',
      stripeSecretKey: (settings as any).stripeSecretKey || '',
      stripeWebhookSecret: (settings as any).stripeWebhookSecret || '',
      mainLogo: (settings as any).mainLogo || '',
      sponsorLogos: (settings as any).sponsorLogos && typeof (settings as any).sponsorLogos === 'string' ? JSON.parse((settings as any).sponsorLogos) : [],
      backgroundImage: (settings as any).backgroundImage || '',
      createdAt: settings!.createdAt,
      updatedAt: settings!.updatedAt,
    };

    console.log('Returning settings for user:', session.email);
    console.log('Active Tournament:', activeTournament ? activeTournament.name : 'None');
    
    return NextResponse.json(transformedSettings);
  } catch (error) {
    console.error('Error fetching tournament settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = session.role === 'ADMIN';
    let allowedTournamentIds: string[] = [];

    if (!isAdmin) {
      const access = await prisma.tournamentAccess.findMany({
        where: { userId: session.userId },
        select: { tournamentId: true }
      });

      if (access.length === 0) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
      allowedTournamentIds = access.map(a => a.tournamentId);
    }

    const data = await request.json();
    console.log('Received data for update:', data); // Debug log

    let settings;

    if (isAdmin) {
      settings = await (prisma as any).tournamentSettings.upsert({
        where: { id: 'default' },
        update: {
          defaultMaxPlayers: data.maxPlayers || 64,
          defaultEntryFee: data.entryFee || 0,
          allowLateRegistration: data.allowLateRegistration ?? true,
          autoStartGames: data.autoStartGames ?? false,
          showLiveScores: data.showLiveScores ?? true,
          enableStatistics: data.enableStatistics ?? true,
          stripeEnabled: data.stripeEnabled ?? false,
          stripePublishableKey: data.stripePublishableKey || null,
          stripeSecretKey: data.stripeSecretKey || null,
          stripeWebhookSecret: data.stripeWebhookSecret || null,
          mainLogo: data.mainLogo || null,
          sponsorLogos: data.sponsorLogos ? JSON.stringify(data.sponsorLogos) : null,
          backgroundImage: data.backgroundImage || null,
          updatedAt: new Date(),
        },
        create: {
          id: 'default',
          defaultMaxPlayers: data.maxPlayers || 64,
          defaultEntryFee: data.entryFee || 0,
          allowLateRegistration: data.allowLateRegistration ?? true,
          autoStartGames: data.autoStartGames ?? false,
          showLiveScores: data.showLiveScores ?? true,
          enableStatistics: data.enableStatistics ?? true,
          stripeEnabled: data.stripeEnabled ?? false,
          stripePublishableKey: data.stripePublishableKey || null,
          stripeSecretKey: data.stripeSecretKey || null,
          stripeWebhookSecret: data.stripeWebhookSecret || null,
          mainLogo: data.mainLogo || null,
          sponsorLogos: data.sponsorLogos ? JSON.stringify(data.sponsorLogos) : null,
          backgroundImage: data.backgroundImage || null,
        },
      });
    } else {
      // Non-admins cannot update global settings, just fetch them
      settings = await prisma.tournamentSettings.findUnique({
        where: { id: 'default' }
      });
      
      if (!settings) {
         // Should not happen if system is initialized, but handle gracefully
         settings = {
             id: 'default',
             defaultMaxPlayers: 64,
             defaultEntryFee: 0,
             allowLateRegistration: true,
             autoStartGames: false,
             showLiveScores: true,
             enableStatistics: true,
             stripeEnabled: false,
             createdAt: new Date(),
             updatedAt: new Date()
         };
      }
    }

    // Update or create tournament if name is provided
    let tournament = null;
    if (data.name && data.name.trim()) {
      // Find existing tournament or create new one
      // Use activeTournamentId from cookie if available to be more precise
      const cookieStore = await cookies();
      const activeTournamentId = cookieStore.get('activeTournamentId')?.value;

      let existingTournament = null;
      
      // Priority 1: ID from request body (if not 'default')
      if (data.id && data.id !== 'default') {
         existingTournament = await prisma.tournament.findUnique({ where: { id: data.id } });
      }

      // Priority 2: ID from cookie
      if (!existingTournament && activeTournamentId) {
         existingTournament = await prisma.tournament.findUnique({ where: { id: activeTournamentId } });
      }
      
      // Priority 3: Fallback to most recent allowed
      if (!existingTournament) {
        existingTournament = await prisma.tournament.findFirst({
          where: isAdmin ? {} : { id: { in: allowedTournamentIds } },
          orderBy: {
            createdAt: 'desc'
          }
        });
      }

      if (existingTournament) {
        // Check access
        if (!isAdmin && !allowedTournamentIds.includes(existingTournament.id)) {
             return NextResponse.json({ error: 'Unauthorized for this tournament' }, { status: 403 });
        }

        // Update existing tournament
        tournament = await prisma.tournament.update({
          where: { id: existingTournament.id },
          data: {
            name: data.name,
            description: data.description || '',
            startDate: data.startDate ? new Date(data.startDate) : existingTournament.startDate,
            endDate: data.endDate ? new Date(data.endDate) : existingTournament.endDate,
            status: data.status || existingTournament.status,
            maxPlayers: data.maxPlayers || existingTournament.maxPlayers,
            entryFee: data.entryFee || existingTournament.entryFee,
            // gameMode: data.gameMode || existingTournament.gameMode,
            checkoutMode: data.checkoutMode || existingTournament.checkoutMode,
            location: data.location || existingTournament.location,
            street: data.street || existingTournament.street,
            updatedAt: new Date(),
          },
        });
      } else {
        // Create new tournament - Only allowed for Global Admin for now to avoid spam/confusion
        if (!isAdmin) {
             return NextResponse.json({ error: 'Only administrators can create new tournaments' }, { status: 403 });
        }

        tournament = await prisma.tournament.create({
          data: {
            name: data.name,
            description: data.description || '',
            startDate: data.startDate ? new Date(data.startDate) : new Date(),
            endDate: data.endDate ? new Date(data.endDate) : null,
            status: data.status || 'UPCOMING',
            maxPlayers: data.maxPlayers || 64,
            entryFee: data.entryFee || 0,
            // gameMode: data.gameMode || '501',
            checkoutMode: data.checkoutMode || 'DOUBLE_OUT',
            location: data.location || '',
            street: data.street || '',
          },
        });
      }
    } else {
      // If no name provided, try to get existing tournament
      tournament = await prisma.tournament.findFirst({
        where: isAdmin ? {} : { id: { in: allowedTournamentIds } },
        orderBy: {
          createdAt: 'desc'
        }
      });
    }

    // Transform to match UI expectations
    const transformedSettings = {
      id: settings.id,
      name: tournament?.name || data.name || '',
      description: tournament?.description || data.description || '',
      startDate: tournament?.startDate ? new Date(tournament.startDate).toISOString().split('T')[0] : data.startDate,
      endDate: tournament?.endDate ? new Date(tournament.endDate).toISOString().split('T')[0] : data.endDate,
      status: tournament?.status || data.status || 'UPCOMING',
      maxPlayers: tournament?.maxPlayers || (settings as any).defaultMaxPlayers,
      entryFee: tournament?.entryFee || (settings as any).defaultEntryFee,
      gameMode: (tournament as any)?.gameMode || data.gameMode || '501',
      checkoutMode: tournament?.checkoutMode || data.checkoutMode || 'DOUBLE_OUT',
      location: tournament?.location || data.location || '',
      street: tournament?.street || data.street || '',
      legSettings: data.legSettings || {
        round1to3: 2,
        semifinalsAndFinal: 3
      },
      allowLateRegistration: (settings as any).allowLateRegistration,
      autoStartGames: (settings as any).autoStartGames,
      showLiveScores: (settings as any).showLiveScores,
      enableStatistics: (settings as any).enableStatistics,
      stripeEnabled: (settings as any).stripeEnabled,
      stripePublishableKey: (settings as any).stripePublishableKey || '',
      stripeSecretKey: (settings as any).stripeSecretKey || '',
      stripeWebhookSecret: (settings as any).stripeWebhookSecret || '',
      mainLogo: (settings as any).mainLogo || '',
      sponsorLogos: (settings as any).sponsorLogos && typeof (settings as any).sponsorLogos === 'string' ? JSON.parse((settings as any).sponsorLogos) : [],
      backgroundImage: (settings as any).backgroundImage || '',
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt,
    };

    return NextResponse.json(transformedSettings);
  } catch (error) {
    console.error('Error updating tournament settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  return PUT(request);
}
