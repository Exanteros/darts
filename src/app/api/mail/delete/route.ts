import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { deleteEmailFromImap } from '@/lib/imap-delete';

export async function DELETE(req: Request) {
  try {
    const { id, threadId } = await req.json();

    if (id) {
      // 1. Hole Nachricht aus lokaler DB, um an die orginale Message-ID zu kommen
      const msg = await prisma.supportEmail.findUnique({ where: { id } });
      
      // Lösche spezifische E-Mail lokal
      await prisma.supportEmail.delete({
        where: { id }
      });
      
      // 2. Lösche vom externen IMAP Server
      if (msg && msg.messageId && !msg.isReply) {
         await deleteEmailFromImap(msg.messageId).catch(console.error);
      }

      return NextResponse.json({ success: true });
    } else if (threadId) {
      // 1. Hole alle Nachrichten des Threads
      const msgs = await prisma.supportEmail.findMany({ where: { threadId } });
      
      // Lösche ganze Konversation/Ticket lokal
      await prisma.supportEmail.deleteMany({
        where: { threadId }
      });
      
      // 2. Lösche vom externen IMAP Server
      for (const m of msgs) {
        if (m.messageId && !m.isReply) {
           await deleteEmailFromImap(m.messageId).catch(console.error);
        }
      }

      return NextResponse.json({ success: true });
    }

    return new NextResponse('Bad Request', { status: 400 });
  } catch (error) {
    console.error('Error deleting email(s):', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
