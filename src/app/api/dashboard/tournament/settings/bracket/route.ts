import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper to ensure BracketConfig exists
async function getBracketConfig() {
  let config = await prisma.bracketConfig.findFirst({
    where: { id: 1 }
  });

  if (!config) {
    config = await prisma.bracketConfig.create({
      data: {
        id: 1,
        legsPerRound: JSON.stringify({
            round1: 3,
            round2: 3,
            round3: 3,
            round4: 3,
            round5: 5,
            round6: 7
        })
      }
    });
  }
  return config;
}

// Helper to ensure SystemSettings exists
async function getSystemSettings() {
  let settings = await prisma.systemSettings.findUnique({
    where: { id: 'default' }
  });

  if (!settings) {
    settings = await prisma.systemSettings.create({
      data: {
        id: 'default'
      }
    });
  }
  return settings;
}

export async function GET() {
  try {
    const config = await getBracketConfig();
    const systemSettings = await getSystemSettings();

    let legsPerRound = {};
    try {
      legsPerRound = JSON.parse(config.legsPerRound);
    } catch (e) {
      console.error('Error parsing legsPerRound JSON', e);
      legsPerRound = {
          round1: 3,
          round2: 3,
          round3: 3,
          round4: 3,
          round5: 5,
          round6: 7
      };
    }

    return NextResponse.json({
      bracketFormat: config.bracketFormat,
      seedingAlgorithm: config.seedingAlgorithm,
      autoAssignBoards: config.autoAssignBoards,
      mainBoardPriority: config.mainBoardPriority,
      distributeEvenly: config.distributeEvenly,
      mainBoardPriorityLevel: config.mainBoardPriorityLevel,
      maxConcurrentGames: systemSettings.maxConcurrentGames,
      legsPerRound: legsPerRound
    });
  } catch (error) {
    console.error('Error fetching bracket settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      bracketFormat,
      seedingAlgorithm,
      autoAssignBoards,
      mainBoardPriority,
      distributeEvenly,
      mainBoardPriorityLevel,
      maxConcurrentGames,
      legsPerRound
    } = body;

    // Update BracketConfig
    await prisma.bracketConfig.upsert({
      where: { id: 1 },
      update: {
        bracketFormat,
        seedingAlgorithm,
        autoAssignBoards,
        mainBoardPriority,
        distributeEvenly,
        mainBoardPriorityLevel,
        legsPerRound: JSON.stringify(legsPerRound)
      },
      create: {
        id: 1,
        bracketFormat,
        seedingAlgorithm,
        autoAssignBoards,
        mainBoardPriority,
        distributeEvenly,
        mainBoardPriorityLevel,
        legsPerRound: JSON.stringify(legsPerRound)
      }
    });

    // Update SystemSettings
    await prisma.systemSettings.upsert({
        where: { id: 'default' },
        update: {
            maxConcurrentGames: parseInt(String(maxConcurrentGames)) || 8
        },
        create: {
            id: 'default',
            maxConcurrentGames: parseInt(String(maxConcurrentGames)) || 8
        }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving bracket settings:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}
