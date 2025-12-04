import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get tournament settings
    const settings = await prisma.tournamentSettings.findUnique({
      where: { id: 'default' },
    });

    const cookieStore = await cookies();
    const activeTournamentId = cookieStore.get('activeTournamentId')?.value;

    let activeTournament;
    
    if (activeTournamentId) {
      activeTournament = await prisma.tournament.findUnique({
        where: { id: activeTournamentId }
      });
    }

    if (!activeTournament) {
      // Get the active tournament (or the first one if multiple exist)
      activeTournament = await prisma.tournament.findFirst({
        orderBy: {
          createdAt: 'desc'
        }
      });
    }

    if (!settings) {
      // Create default settings if not exist
      const defaultSettings = await (prisma as any).tournamentSettings.create({
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

      // Transform to match UI expectations
      const transformedSettings = {
        id: defaultSettings.id,
        name: activeTournament?.name || '',
        description: activeTournament?.description || '',
        startDate: activeTournament?.startDate ? new Date(activeTournament.startDate).toISOString().split('T')[0] : undefined,
        endDate: activeTournament?.endDate ? new Date(activeTournament.endDate).toISOString().split('T')[0] : undefined,
        status: activeTournament?.status || 'UPCOMING',
        maxPlayers: activeTournament?.maxPlayers || (defaultSettings as any).defaultMaxPlayers,
        entryFee: activeTournament?.entryFee || (defaultSettings as any).defaultEntryFee,
        location: (activeTournament as any)?.location || '',
        street: (activeTournament as any)?.street || '',
        legSettings: {
          round1to3: 2,
          semifinalsAndFinal: 3
        },
        allowLateRegistration: (defaultSettings as any).allowLateRegistration,
        autoStartGames: (defaultSettings as any).autoStartGames,
        showLiveScores: (defaultSettings as any).showLiveScores,
        enableStatistics: (defaultSettings as any).enableStatistics,
        stripeEnabled: (defaultSettings as any).stripeEnabled || false,
        stripePublishableKey: (defaultSettings as any).stripePublishableKey || '',
        stripeSecretKey: (defaultSettings as any).stripeSecretKey || '',
        stripeWebhookSecret: (defaultSettings as any).stripeWebhookSecret || '',
        mainLogo: (defaultSettings as any).mainLogo || '',
        sponsorLogos: (defaultSettings as any).sponsorLogos && typeof (defaultSettings as any).sponsorLogos === 'string' ? JSON.parse((defaultSettings as any).sponsorLogos) : [],
        backgroundImage: (defaultSettings as any).backgroundImage || '',
        createdAt: defaultSettings.createdAt,
        updatedAt: defaultSettings.updatedAt,
      };

      return NextResponse.json(transformedSettings);
    }

    // Transform to match UI expectations
    const transformedSettings = {
      id: settings.id,
      name: activeTournament?.name || '',
      description: activeTournament?.description || '',
      startDate: activeTournament?.startDate ? new Date(activeTournament.startDate).toISOString().split('T')[0] : undefined,
      endDate: activeTournament?.endDate ? new Date(activeTournament.endDate).toISOString().split('T')[0] : undefined,
      status: activeTournament?.status || 'UPCOMING',
      maxPlayers: activeTournament?.maxPlayers || (settings as any).defaultMaxPlayers,
      entryFee: activeTournament?.entryFee || (settings as any).defaultEntryFee,
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
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt,
    };

    console.log('Returning settings:', transformedSettings); // Debug log
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
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    console.log('Received data for update:', data); // Debug log

    const settings = await (prisma as any).tournamentSettings.upsert({
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

    // Update or create tournament if name is provided
    let tournament = null;
    if (data.name && data.name.trim()) {
      // Find existing tournament or create new one
      const existingTournament = await prisma.tournament.findFirst({
        orderBy: {
          createdAt: 'desc'
        }
      });

      if (existingTournament) {
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
            location: data.location || existingTournament.location,
            street: data.street || existingTournament.street,
            updatedAt: new Date(),
          },
        });
      } else {
        // Create new tournament
        tournament = await prisma.tournament.create({
          data: {
            name: data.name,
            description: data.description || '',
            startDate: data.startDate ? new Date(data.startDate) : new Date(),
            endDate: data.endDate ? new Date(data.endDate) : null,
            status: data.status || 'UPCOMING',
            maxPlayers: data.maxPlayers || 64,
            entryFee: data.entryFee || 0,
            location: data.location || '',
            street: data.street || '',
          },
        });
      }
    } else {
      // If no name provided, try to get existing tournament
      tournament = await prisma.tournament.findFirst({
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
      location: (tournament as any)?.location || data.location || '',
      street: (tournament as any)?.street || data.street || '',
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
