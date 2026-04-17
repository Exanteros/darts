import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, context: any) {
  const params = await context.params;
  const tournamentId = params.tournamentId;

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (session.user.role !== 'SUPERADMIN' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const t = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        players: true,
      },
    });

    if (!t) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }


    const stats = t.players.reduce((acc, player) => {
      // Höchster Average
      if (!acc.highestAverage || (player.average && player.average > acc.highestAverage.value)) {
        acc.highestAverage = { name: player.playerName, value: player.average || 0 };
      }
      
      // Höchstes Checkout
      if (!acc.highestCheckout || (player.highFinish && player.highFinish > acc.highestCheckout.value)) {
        acc.highestCheckout = { name: player.playerName, value: player.highFinish || 0 };
      }

      // Meisten 180er
      if (!acc.most180s || (player.oneEighties && player.oneEighties > acc.most180s.value)) {
        acc.most180s = { name: player.playerName, value: player.oneEighties || 0 };
      }

      // Checkout Rate (best)
      if (!acc.bestCheckoutRate || (player.checkoutRate && player.checkoutRate > acc.bestCheckoutRate.value)) {
        acc.bestCheckoutRate = { name: player.playerName, value: player.checkoutRate || 0 };
      }

      return acc;
    }, {
      highestAverage: null,
      highestCheckout: null,
      most180s: null,
      bestCheckoutRate: null,
    } as any);

    return NextResponse.json({
      tournamentName: t.name,
      stats: {
        highestAverage: stats.highestAverage?.value ? stats.highestAverage : null,
        highestCheckout: stats.highestCheckout?.value ? stats.highestCheckout : null,
        most180s: stats.most180s?.value ? stats.most180s : null,
        bestCheckoutRate: stats.bestCheckoutRate?.value ? stats.bestCheckoutRate : null,
      }
    });

  } catch (error) {
    console.error('Error fetching tournament highlight stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
