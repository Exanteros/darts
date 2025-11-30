import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { sendWelcomeEmail, sendTournamentRegistrationEmail } from '@/lib/mail';
import { createSession, getSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const { tournamentId, playerName, email, paymentIntentId } = await request.json();

    if (!tournamentId || !playerName || !email) {
      return NextResponse.json({
        success: false,
        message: 'Turnier-ID, Spielername und E-Mail-Adresse sind erforderlich'
      }, { status: 400 });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({
        success: false,
        message: 'Bitte geben Sie eine gültige E-Mail-Adresse ein'
      }, { status: 400 });
    }

    // Überprüfe, ob das Turnier existiert und Anmeldungen offen sind
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        _count: {
          select: { players: true }
        }
      }
    });

    if (!tournament) {
      return NextResponse.json({
        success: false,
        message: 'Turnier nicht gefunden'
      }, { status: 404 });
    }

    if (tournament.status !== 'REGISTRATION_OPEN') {
      return NextResponse.json({
        success: false,
        message: 'Anmeldung ist nicht mehr möglich'
      }, { status: 400 });
    }

    if (tournament._count.players >= tournament.maxPlayers) {
      return NextResponse.json({
        success: false,
        message: 'Das Turnier ist bereits voll'
      }, { status: 400 });
    }

    // Überprüfe, ob bereits ein Benutzer mit dieser E-Mail existiert
    let user = await prisma.user.findUnique({
      where: { email }
    });

    let isNewUser = false;

    // Wenn kein Benutzer existiert, erstelle einen neuen
    if (!user) {
      isNewUser = true;
      // Generiere ein zufälliges Passwort für den neuen Benutzer
      const randomPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);
      const hashedPassword = await bcrypt.hash(randomPassword, 12);

      user = await prisma.user.create({
        data: {
          email,
          name: playerName, // Verwende den Spielernamen als Anzeigenamen
          password: hashedPassword,
        }
      });

      // Sende Willkommens-E-Mail an neuen Benutzer
      await sendWelcomeEmail(email, playerName);
    }

    // Überprüfe, ob der Benutzer bereits für dieses Turnier angemeldet ist
    const existingRegistration = await prisma.tournamentPlayer.findFirst({
      where: {
        tournamentId,
        userId: user.id
      }
    });

    if (existingRegistration) {
      return NextResponse.json({
        success: false,
        message: 'Sie sind bereits für dieses Turnier angemeldet'
      }, { status: 400 });
    }

    // Erstelle die Turnier-Anmeldung
    const registration = await prisma.tournamentPlayer.create({
      data: {
        tournamentId,
        userId: user.id,
        playerName: playerName.trim(),
        status: 'CONFIRMED',
        paid: paymentIntentId ? true : false
      },
      include: {
        tournament: true,
        user: true
      }
    });

    // Versende Bestätigungs-E-Mail an den Spieler (wenn möglich)
    try {
      await sendTournamentRegistrationEmail(user.email, registration.playerName, tournament.name);
    } catch (mailError) {
      console.error('Fehler beim Senden der Bestätigungs-E-Mail:', mailError);
      // Wir lassen die Registrierung trotzdem erfolgreich durchlaufen,
      // Mail-Fehler sollten den Registrierungs-Flow nicht blockieren.
    }

    // Auto-Login für neue Benutzer oder wenn keine Session existiert
    const session = await getSession();
    if (!session && isNewUser) {
      await createSession({
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      });
    }

    return NextResponse.json({
      success: true,
      message: `Erfolgreich für "${tournament.name}" angemeldet! Sie erhalten eine Bestätigungs-E-Mail.`,
      registration: {
        id: registration.id,
        playerName: registration.playerName,
        status: registration.status,
        paid: registration.paid,
        registeredAt: registration.registeredAt.toISOString()
      }
    });

  } catch (error) {
    console.error('Error registering for tournament:', error);
    return NextResponse.json({
      success: false,
      message: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.'
    }, { status: 500 });
  }
}
