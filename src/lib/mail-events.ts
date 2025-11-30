import { prisma } from '@/lib/prisma';
import { sendMail, renderHtml } from '@/lib/mail';

interface EmailTemplateContext {
  name?: string;
  tournamentName?: string;
  boardName?: string;
  opponentName?: string;
  startTime?: string;
  estimatedTime?: string;
  round?: string | number;
  yourScore?: string | number;
  opponentScore?: string | number;
  nextRound?: string | number;
  wins?: number;
  rounds?: number;
  finalScore?: string;
  amount?: string;
  dueDate?: string;
  paymentDate?: string;
  paymentLink?: string;
  date?: string;
  reason?: string;
  link?: string;
}

export async function sendTemplateEmail(
  to: string,
  templateId: string,
  context: EmailTemplateContext = {}
) {
  try {
    // Lade Template aus DB
    const template = await prisma.emailTemplate.findUnique({
      where: { id: templateId }
    });

    if (!template) {
      console.error(`Email template '${templateId}' not found`);
      return false;
    }

    // Hole User-Daten für Default-Context
    const user = await prisma.user.findUnique({
      where: { email: to }
    });

    const fullContext = {
      name: user?.name || 'Spieler',
      ...context
    };

    // Ersetze alle Platzhalter
    let subject = template.subject;
    let content = template.content;

    Object.entries(fullContext).forEach(([key, value]) => {
      const regex = new RegExp(`{${key}}`, 'g');
      subject = subject.replace(regex, String(value || ''));
      content = content.replace(regex, String(value || ''));
    });

    const html = await renderHtml(content, fullContext.tournamentName);
    const text = content
      .replace(/\*\*/g, '')
      .replace(/[#*]/g, '')
      .replace(/<br\/>/g, '\n');

    return await sendMail({ to, subject, text, html });
  } catch (error) {
    console.error(`Error sending template email '${templateId}':`, error);
    return false;
  }
}

// Spezifische Email-Funktionen

export async function sendRoundNotificationEmail(
  email: string,
  round: number,
  opponentName: string,
  boardName: string,
  estimatedTime?: string
) {
  return sendTemplateEmail(email, 'round-notification', {
    round,
    opponentName,
    boardName,
    estimatedTime: estimatedTime || 'in Kürze'
  });
}

export async function sendVictoryEmail(
  email: string,
  round: number,
  yourScore: number,
  opponentName: string,
  opponentScore: number,
  nextRound?: number
) {
  return sendTemplateEmail(email, 'victory', {
    round,
    yourScore,
    opponentName,
    opponentScore,
    nextRound: nextRound || 'Finale'
  });
}

export async function sendDefeatEmail(
  email: string,
  round: number,
  yourScore: number,
  opponentName: string,
  opponentScore: number
) {
  return sendTemplateEmail(email, 'defeat', {
    round,
    yourScore,
    opponentName,
    opponentScore
  });
}

export async function sendTournamentStartEmail(
  email: string,
  tournamentName: string,
  startTime: string,
  boardName?: string,
  opponentName?: string
) {
  return sendTemplateEmail(email, 'tournament-start', {
    tournamentName,
    startTime,
    boardName: boardName || 'wird noch bekanntgegeben',
    opponentName: opponentName || 'wird noch bekanntgegeben'
  });
}

export async function sendFinalWinnerEmail(
  email: string,
  tournamentName: string,
  wins: number,
  rounds: number,
  finalScore: string
) {
  return sendTemplateEmail(email, 'final-winner', {
    tournamentName,
    wins,
    rounds,
    finalScore
  });
}

export async function sendPaymentReminderEmail(
  email: string,
  tournamentName: string,
  amount: string,
  dueDate: string,
  paymentLink?: string
) {
  return sendTemplateEmail(email, 'payment-reminder', {
    tournamentName,
    amount,
    dueDate,
    paymentLink: paymentLink || '#'
  });
}

export async function sendPaymentConfirmedEmail(
  email: string,
  tournamentName: string,
  amount: string,
  paymentDate: string
) {
  return sendTemplateEmail(email, 'payment-confirmed', {
    tournamentName,
    amount,
    paymentDate
  });
}

export async function sendTournamentCancelledEmail(
  email: string,
  tournamentName: string,
  date: string,
  reason: string
) {
  return sendTemplateEmail(email, 'tournament-cancelled', {
    tournamentName,
    date,
    reason
  });
}
