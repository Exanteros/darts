import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Funktion zum Generieren eines zufälligen 5-stelligen Access-Codes
function generateAccessCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function main() {
  console.log('🌱 Seeding database...');

  // Erstelle einen Admin-Benutzer
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@dartsturnier.de' },
    update: {},
    create: {
      email: 'admin@dartsturnier.de',
      name: 'Administrator',
      password: hashedPassword,
      role: 'ADMIN'
    }
  });

  console.log('✅ Admin user created:', adminUser.email);

  // Erstelle leere Tournament Settings (für Onboarding)
  await prisma.tournamentSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      defaultMaxPlayers: 64,
      defaultEntryFee: 0,
      allowLateRegistration: true,
      autoStartGames: false,
      showLiveScores: true,
      enableStatistics: true,
      stripeEnabled: false,
    }
  });

  console.log('✅ Empty tournament settings created (ready for onboarding)');

  // Erstelle ein Beispiel-Turnier (optional, auskommentiert für Onboarding-Test)
  // const tournament = await prisma.tournament.upsert({
  //   where: { id: 'darts-masters-2026' },
  //   update: {},
  //   create: {
  //     id: 'darts-masters-2026',
  //     name: 'Dart Masters Puschendorf 2026',
  //     description: 'Das professionelle Darts-Turnier für 64 Spieler im Februar 2026. Single-Elimination Format mit Live-Scoring.',
  //     startDate: new Date('2026-02-15T10:00:00Z'),
  //     maxPlayers: 64,
  //     entryFee: 25.00,
  //     status: 'REGISTRATION_OPEN'
  //   }
  // });
  // console.log('✅ Tournament created:', tournament.name);

  // Erstelle Beispiel-Scheiben (auskommentiert, können über Onboarding/UI erstellt werden)
  // const boards = await Promise.all([
  //   prisma.board.upsert({
  //     where: { id: 'board-1' },
  //     update: {},
  //     create: {
  //       id: 'board-1',
  //       name: 'Scheibe 1',
  //       tournamentId: tournament.id,
  //       accessCode: generateAccessCode(),
  //       priority: 1
  //     }
  //   }),
  //   prisma.board.upsert({
  //     where: { id: 'board-2' },
  //     update: {},
  //     create: {
  //       id: 'board-2',
  //       name: 'Scheibe 2',
  //       tournamentId: tournament.id,
  //       accessCode: generateAccessCode(),
  //       priority: 2
  //     }
  //   }),
  //   prisma.board.upsert({
  //     where: { id: 'board-3' },
  //     update: {},
  //     create: {
  //       id: 'board-3',
  //       name: 'Scheibe 3',
  //       tournamentId: tournament.id,
  //       accessCode: generateAccessCode(),
  //       priority: 3
  //     }
  //   })
  // ]);
  // console.log('✅ Boards created:', boards.length);

  // Erstelle Demo-Spieler (auskommentiert für sauberen Start mit Onboarding)
  /*
  const demoPlayers = [
    { name: 'Michael van Gerwen', email: 'mvg@demo.com' },
    { name: 'Phil Taylor', email: 'phil@demo.com' },
    { name: 'Gary Anderson', email: 'gary@demo.com' },
    { name: 'Adrian Lewis', email: 'adrian@demo.com' },
    { name: 'James Wade', email: 'james@demo.com' },
    { name: 'Raymond van Barneveld', email: 'raymond@demo.com' },
    { name: 'Dimitri Van den Bergh', email: 'dimitri@demo.com' },
    { name: 'Gerwyn Price', email: 'gerwyn@demo.com' },
    { name: 'Peter Wright', email: 'peter@demo.com' },
    { name: 'Michael Smith', email: 'smith@demo.com' },
    { name: 'Jose de Sousa', email: 'jose@demo.com' },
    { name: 'Danny Noppert', email: 'danny@demo.com' },
    { name: 'Luke Humphries', email: 'luke@demo.com' },
    { name: 'Dave Chisnall', email: 'dave@demo.com' },
    { name: 'Stephen Bunting', email: 'stephen@demo.com' },
    { name: 'Mensur Suljović', email: 'mensur@demo.com' },
    { name: 'Ian White', email: 'ian@demo.com' },
    { name: 'Simon Whitlock', email: 'simon@demo.com' },
    { name: 'Alan Norris', email: 'alan@demo.com' },
    { name: 'Steve Beaton', email: 'steve@demo.com' },
    { name: 'John Henderson', email: 'john@demo.com' },
    { name: 'Jamie Lewis', email: 'jamie@demo.com' },
    { name: 'Darren Webster', email: 'darren@demo.com' },
    { name: 'Ronnie Baxter', email: 'ronnie@demo.com' },
    { name: 'Mark Webster', email: 'mark@demo.com' },
    { name: 'Terry Jenkins', email: 'terry@demo.com' },
    { name: 'Andy Hamilton', email: 'andy@demo.com' },
    { name: 'Kevin Painter', email: 'kevin@demo.com' },
    { name: 'Wayne Jones', email: 'wayne@demo.com' },
    { name: 'Andrew Gilding', email: 'andrew@demo.com' },
    { name: 'Steve West', email: 'stevew@demo.com' },
    { name: 'Mervyn King', email: 'mervyn@demo.com' },
    { name: 'Joe Cullen', email: 'joe@demo.com' },
    { name: 'Brendan Dolan', email: 'brendan@demo.com' },
    { name: 'Robert Thornton', email: 'robert@demo.com' },
    { name: 'Kim Huybrechts', email: 'kim@demo.com' },
    { name: 'Vincent van der Voort', email: 'vincent@demo.com' },
    { name: 'Jelle Klaasen', email: 'jelle@demo.com' },
    { name: 'Christian Kist', email: 'christian@demo.com' },
    { name: 'Co Stompé', email: 'co@demo.com' },
    { name: 'Remco van Eijden', email: 'remco@demo.com' },
    { name: 'Marlon Manbarr', email: 'marlon@demo.com' },
    { name: 'Haruki Muramatsu', email: 'haruki@demo.com' },
    { name: 'Seigo Asada', email: 'seigo@demo.com' },
    { name: 'Paul Nicholson', email: 'paul@demo.com' },
    { name: 'Andy Jenkins', email: 'andyj@demo.com' },
    { name: 'Dennis Priestley', email: 'dennis@demo.com' },
    { name: 'Colin Lloyd', email: 'colin@demo.com' },
    { name: 'Nigel Heydon', email: 'nigel@demo.com' },
    { name: 'Tony Eccles', email: 'tony@demo.com' },
    { name: 'Mark Dudbridge', email: 'markd@demo.com' },
    { name: 'Jamie Caven', email: 'jamiec@demo.com' },
    { name: 'Alex Roy', email: 'alex@demo.com' },
    { name: 'Ricky Evans', email: 'ricky@demo.com' },
    { name: 'Ross Smith', email: 'ross@demo.com' },
    { name: 'Keegan Brown', email: 'keegan@demo.com' },
    { name: 'Callan Rydz', email: 'callan@demo.com' },
    { name: 'Ryan Searle', email: 'ryan@demo.com' },
    { name: 'Gabriel Clemens', email: 'gabriel@demo.com' },
    { name: 'Max Hopp', email: 'max@demo.com' },
    { name: 'Martin Schindler', email: 'martin@demo.com' },
    { name: 'Nico Kurz', email: 'nico@demo.com' },
    { name: 'Ricardo Pietreczko', email: 'ricardo@demo.com' },
    { name: 'Dragutin Horvat', email: 'dragutin@demo.com' },
    { name: 'Rowby-John Rodriguez', email: 'rowby@demo.com' },
    { name: 'Darius Labanauskas', email: 'darius@demo.com' },
    { name: 'Madars Razma', email: 'madars@demo.com' },
    { name: 'Jan Dekker', email: 'jan@demo.com' },
    { name: 'Jeffrey de Zwaan', email: 'jeffrey@demo.com' },
    { name: 'Danny van Trijp', email: 'dannyv@demo.com' },
    { name: 'Mike de Decker', email: 'mike@demo.com' },
    { name: 'Willem Mandigers', email: 'willem@demo.com' },
    { name: 'Jimmy Hendriks', email: 'jimmy@demo.com' }
  ];

  // Erstelle Demo-Benutzer und Spieler
  const createdPlayers = [];
  for (const playerData of demoPlayers) {
    // Erstelle Benutzer-Account
    const demoPassword = await bcrypt.hash('demo123', 10);
    const user = await prisma.user.upsert({
      where: { email: playerData.email },
      update: {},
      create: {
        email: playerData.email,
        name: playerData.name,
        password: demoPassword,
        role: 'USER'
      }
    });

    // Erstelle Turnier-Spieler
    const player = await prisma.tournamentPlayer.upsert({
      where: {
        tournamentId_userId: {
          tournamentId: tournament.id,
          userId: user.id
        }
      },
      update: {},
      create: {
        tournamentId: tournament.id,
        userId: user.id,
        playerName: playerData.name,
        status: 'ACTIVE',
        paid: true
      }
    });

    createdPlayers.push(player);
  }

  console.log('✅ Demo players created:', createdPlayers.length);
  */

  // Seed email templates
  const templates = [
    {
      id: 'registration',
      name: 'Registrierungs-Bestätigung',
      subject: 'Willkommen beim Darts Turnier! 🎯',
      content: '# Willkommen {name}!\n\nVielen Dank für deine **Registrierung** beim Darts Turnier.\n\nWir freuen uns sehr, dich dabei zu haben!\n\n## Nächste Schritte:\n- Prüfe deine E-Mail-Adresse\n- Halte dich über Updates auf dem Laufenden\n- Bereite dich auf spannende Matches vor\n\nBis bald am Board! 🎯\n\n**Dein Turnier-Team**',
      description: 'Wird automatisch nach der Registrierung versendet.'
    },
    {
      id: 'login',
      name: 'Login Link / Magic Link',
      subject: 'Dein Login Link für das Darts Turnier 🔐',
      content: '# Hallo {name}!\n\nHier ist dein persönlicher **Login-Link**:\n\n[Jetzt einloggen]({link})\n\n⏰ Dieser Link ist **24 Stunden** gültig.\n\nWenn du diesen Link nicht angefordert hast, ignoriere diese E-Mail einfach.\n\nViele Grüße,\n**Dein Turnier-Team**',
      description: 'Enthält den Magic Link für den Login.'
    },
    {
      id: 'tournament-start',
      name: 'Turnier-Start Benachrichtigung',
      subject: 'Das Turnier beginnt JETZT! 🚀',
      content: '# 🎯 Hallo Darts-Freunde!\n\n## Das Turnier **{tournamentName}** startet in Kürze!\n\nBitte findet euch **rechtzeitig am Board** ein.\n\n### Wichtige Infos:\n- **Start:** {startTime}\n- **Dein Board:** {boardName}\n- **Gegner:** {opponentName}\n\n**Gut Darts!** 🎯\n\n*Die Turnierleitung*',
      description: 'Erinnerung kurz vor Turnierbeginn.'
    },
    {
      id: 'round-notification',
      name: 'Runden-Benachrichtigung',
      subject: 'Dein nächstes Match steht an! 🎯',
      content: '# Hallo {name}!\n\n## Dein Match in Runde {round} beginnt bald:\n\n**Gegner:** {opponentName}\n\n**Board:** {boardName}\n\n**Voraussichtliche Zeit:** {estimatedTime}\n\n---\n\nBitte halte dich bereit und erscheine rechtzeitig am Board.\n\n**Viel Erfolg!** 🍀\n\n*Dein Turnier-Team*',
      description: 'Benachrichtigt Spieler über anstehende Matches.'
    },
    {
      id: 'victory',
      name: 'Sieg-Glückwunsch',
      subject: 'Glückwunsch zum Sieg! 🏆',
      content: '# 🎉 Herzlichen Glückwunsch {name}!\n\nDu hast dein Match in **Runde {round}** gewonnen!\n\n## Match-Ergebnis:\n- **Du:** {yourScore}\n- **{opponentName}:** {opponentScore}\n\n---\n\n### Nächste Schritte:\nDein **nächstes Match** ist in Runde {nextRound}. Wir informieren dich rechtzeitig.\n\n**Weiter so!** 💪🎯\n\n*Dein Turnier-Team*',
      description: 'Wird nach einem Sieg versendet.'
    },
    {
      id: 'defeat',
      name: 'Spiel verloren',
      subject: 'Danke für deine Teilnahme 🎯',
      content: '# Hallo {name},\n\nleider hast du dein Match in **Runde {round}** verloren.\n\n## Match-Ergebnis:\n- **Du:** {yourScore}\n- **{opponentName}:** {opponentScore}\n\n---\n\nDanke für deine **großartige Teilnahme**! Du warst ein würdiger Gegner.\n\nWir hoffen, dich beim **nächsten Turnier** wieder zu sehen! 🎯\n\n*Dein Turnier-Team*',
      description: 'Wird nach einer Niederlage versendet.'
    },
    {
      id: 'payment-reminder',
      name: 'Zahlungserinnerung',
      subject: 'Erinnerung: Startgebühr noch offen ⚠️',
      content: '# Hallo {name},\n\n⚠️ Deine **Startgebühr** für das Turnier **{tournamentName}** ist noch ausstehend.\n\n## Details:\n- **Betrag:** {amount} €\n- **Fällig bis:** {dueDate}\n\n[Jetzt bezahlen]({paymentLink})\n\n---\n\n💡 **Wichtig:** Ohne rechtzeitige Zahlung kann deine Teilnahme leider nicht garantiert werden.\n\nBei Fragen melde dich gerne!\n\n*Dein Turnier-Team*',
      description: 'Erinnerung an ausstehende Zahlungen.'
    },
    {
      id: 'payment-confirmed',
      name: 'Zahlungsbestätigung',
      subject: 'Zahlung erhalten - Du bist dabei! ✅',
      content: '# Perfekt {name}!\n\n✅ Deine **Zahlung** wurde erfolgreich verbucht.\n\n## Bestätigung:\n- **Turnier:** {tournamentName}\n- **Betrag:** {amount} €\n- **Datum:** {paymentDate}\n\n---\n\nDu bist **offiziell registriert**! Wir freuen uns auf dich.\n\n🎯 **Viel Erfolg beim Turnier!**\n\n*Dein Turnier-Team*',
      description: 'Bestätigt den Zahlungseingang.'
    },
    {
      id: 'tournament-cancelled',
      name: 'Turnier abgesagt',
      subject: 'Turnier abgesagt ❌',
      content: '# Wichtige Mitteilung\n\nLeider müssen wir das Turnier **{tournamentName}** am **{date}** absagen.\n\n## Grund:\n{reason}\n\n---\n\n### Was passiert jetzt?\n- Bereits gezahlte Startgebühren werden **vollständig erstattet**\n- Wir informieren dich über **Ersatztermine**\n\nWir entschuldigen uns für die Unannehmlichkeiten! 🙏\n\n*Dein Turnier-Team*',
      description: 'Informiert über Turnier-Absagen.'
    },
    {
      id: 'final-winner',
      name: 'Turnier-Sieg',
      subject: 'CHAMPION! 🏆👑',
      content: '# 🏆 HERZLICHEN GLÜCKWUNSCH {name}! 🏆\n\n## Du bist der **CHAMPION** des Turniers **{tournamentName}**!\n\n### Deine Leistung:\n- **Siege:** {wins}\n- **Gespielte Runden:** {rounds}\n- **Finale:** {finalScore}\n\n---\n\n🎉 **Du bist eine Legende!** 🎉\n\nDeine Leistung war **herausragend**. Wir sind stolz, dich als Champion zu feiern!\n\n📸 Fotos und Highlights folgen in Kürze.\n\n**Bis zum nächsten Turnier!** 🎯👑\n\n*Dein Turnier-Team*',
      description: 'Glückwunsch an den Turniersieger.'
    }
  ];

  for (const t of templates) {
    await prisma.emailTemplate.upsert({
      where: { id: t.id },
      update: {},
      create: {
        id: t.id,
        name: t.name,
        subject: t.subject,
        content: t.content,
        description: t.description
      }
    });
  }

  console.log('✅ Email templates seeded');

  console.log('🎉 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
