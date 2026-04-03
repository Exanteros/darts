const fs = require('fs');

const data = fs.readFileSync('src/lib/imap.ts', 'utf-8');

const replacement = `            if (!existing) {
              const subjectLine = parsed.subject || 'No Subject';
              const ticketMatch = subjectLine.match(/\\[(DT-[A-Z0-9]{6})\\]/i);
              const generatedTicketId = \`DT-\${Math.random().toString(36).substring(2, 8).toUpperCase()}\`;
              const ticketId = ticketMatch ? ticketMatch[1].toUpperCase() : generatedTicketId;

              const fromAddr = parsed.from?.value[0]?.address || 'unknown@domain.com';
              const senderName = parsed.from?.value[0]?.name || fromAddr;
              const supportAddr = process.env.IMAP_USER || process.env.SMTP_USER || '';
              const adminAddr = process.env.ADMIN_EMAIL || process.env.ADMIN_MAIL_ADDRESS || 'admin@pudo-dartmasters.de';
              
              const isAdminReply = fromAddr.toLowerCase() === adminAddr.toLowerCase();
              const isSupportItself = fromAddr.toLowerCase() === supportAddr.toLowerCase();

              if (!isSupportItself) {
                if (isAdminReply) {
                  // --- FEATURE: ADMIN ANSWERING EXTERNALLY ---
                  // 1. Find to whom we should send this (original sender, not admin)
                  const originalTicketUser = await prisma.supportEmail.findFirst({
                    where: { threadId: ticketId, isReply: false, fromEmail: { not: adminAddr.toLowerCase() } },
                    orderBy: { createdAt: 'asc' }
                  });

                  const targetEmail = originalTicketUser ? originalTicketUser.fromEmail : toAddress;

                  // Create DB entry mimicking dashboard: from=support, to=user, isReply=true
                  await prisma.supportEmail.create({
                    data: {
                      messageId: parsed.messageId || \`uuid-\${Date.now()}-\${Math.random()}\`,
                      threadId: ticketId,
                      subject: subjectLine,
                      fromName: process.env.BRAND_NAME || 'Dart Masters Support',
                      fromEmail: supportAddr,
                      toEmail: targetEmail,
                      bodyText: parsed.text || null,
                      bodyHtml: typeof parsed.textAsHtml === 'string' ? parsed.textAsHtml : (typeof parsed.html === 'string' ? parsed.html : null),
                      isRead: true, // we read it
                      isReply: true, // it's a team reply
                      createdAt: parsed.date || new Date()
                    }
                  });

                  if (originalTicketUser && originalTicketUser.fromEmail !== adminAddr.toLowerCase()) {
                    const htmlContent = parsed.html || parsed.textAsHtml || parsed.text?.replace(/\\n/g, '<br/>') || '';
                    const brandName = process.env.BRAND_NAME || 'Dart Masters Support';
                    let finalHtmlContext = htmlContent + \`<br/><br/>\\n        <div style="margin-top:30px; padding-top:20px; border-top:1px solid #ccc; font-size:14px; color:#555;">\\n          <strong>Dein \${brandName} Support-Team</strong><br/>\\n          <a href="mailto:\${supportAddr}" style="color:#3b82f6; text-decoration:none;">\${supportAddr}</a><br/>\\n          <i>Bitte belasse bei Antworten immer die Ticket-ID im Betreff.</i>\\n        </div>\`;
                    const htmlBody = await renderHtml(finalHtmlContext, brandName, true);
                    try {
                      await transporter.sendMail({
                        from: supportAddr,
                        to: targetEmail,
                        subject: subjectLine,
                        text: parsed.text || '',
                        html: htmlBody
                      });
                    } catch (err) {
                      console.error('Failed to relay admin reply to user:', err);
                    }
                  }
                } else {
                  // --- FEATURE: USER OPENS TICKET OR REPLIES ---
                  
                  // Check if this thread already has messages
                  const threadMessagesCount = await prisma.supportEmail.count({
                    where: { threadId: ticketId }
                  });
                  const isNewTicket = (threadMessagesCount === 0);

                  // 1. Save incoming user message
                  await prisma.supportEmail.create({
                    data: {
                      messageId: parsed.messageId || \`uuid-\${Date.now()}-\${Math.random()}\`,
                      threadId: ticketId,
                      subject: subjectLine,
                      fromName: senderName,
                      fromEmail: fromAddr,
                      toEmail: toAddress,
                      bodyText: parsed.text || null,
                      bodyHtml: typeof parsed.textAsHtml === 'string' ? parsed.textAsHtml : (typeof parsed.html === 'string' ? parsed.html : null),
                      isRead: false,
                      isReply: false,
                      createdAt: parsed.date || new Date()
                    }
                  });

                  // 2. Formatting & Sending logic
                  if (isNewTicket) {
                     // Auto Reply (ONLY for first message, not subsequent replies)
                     const rawTemplate = process.env.AUTO_REPLY_TEMPLATE || process.env.AUTO_REPLY_TEXT || 'Ja, wird bearbeitet.';
                     const filled = rawTemplate
                       .replace(/\\{name\\}/gi, senderName)
                       .replace(/\\{email\\}/gi, fromAddr)
                       .replace(/\\{ticket\\}/gi, ticketId);
   
                     const brandName = process.env.BRAND_NAME || "Dart Masters Support";
                     let finalHtmlContext = filled + \`<br/><br/>\\n        <div style="margin-top:30px; padding-top:20px; border-top:1px solid #ccc; font-size:14px; color:#555;">\\n          <strong>Dein \${brandName} Support-Team</strong><br/>\\n          <a href="mailto:\${supportAddr}" style="color:#3b82f6; text-decoration:none;">\${supportAddr}</a><br/>\\n          <i>Bitte belasse bei Antworten immer die Ticket-ID im Betreff.</i>\\n        </div>\`;
                     
                     const plainText = filled.replace(/<[^>]+>/g, '');
                     const htmlBody = await renderHtml(finalHtmlContext, brandName, true);
                     
                     try {
                       await transporter.sendMail({
                         from: supportAddr,
                         to: fromAddr,
                         subject: \`Re: \${subjectLine.replace(/(Re:|\\s*\\[DT-[A-Z0-9]{6}\\])/gi, '').trim()} [\${ticketId}]\`,
                         text: plainText,
                         html: htmlBody
                       });
                     } catch (err) {
                       console.error('Failed to send auto-reply:', err);
                     }
                  }

                  // 3. Forward to Admin (clean subject to avoid duplicate tags)
                  try {
                    const cleanSubj = subjectLine.replace(/\\s*\\[DT-[A-Z0-9]{6}\\]/gi, '').trim();
                    await transporter.sendMail({
                      from: \`"\${senderName} (\${ticketId})" <\${supportAddr}>\`,
                      to: adminAddr,
                      replyTo: supportAddr, 
                      subject: \`[\${ticketId}] \${cleanSubj}\`,
                      text: \`\${isNewTicket ? 'Neues Ticket' : 'Neue Antwort'} von \${senderName} (\${fromAddr}):\\n\\n\${parsed.text || ''}\`,
                      html: \`<div style="padding:10px; background:#f0f0f0; border:1px solid #ddd; margin-bottom:20px;">\\n            <b>\${isNewTicket ? 'Neues Ticket' : 'Neue Antwort'} von:</b> \${senderName} (\${fromAddr})<br>\\n            <b>Antworte auf diese E-Mail, um an den Kunden aus dem System heraus zurückzuschreiben.</b>\\n          </div>\\n          \${parsed.html || parsed.textAsHtml || parsed.text?.replace(/\\n/g, '<br/>') || ''}\`
                    });
                  } catch (err) {
                    console.error('Failed to forward to admin:', err);
                  }
                }
              }
            }`;

const startIndex = data.indexOf('            if (!existing) {');
const endIndex = data.indexOf('await client.messageFlagsAdd(seq, [\'\\\\Seen\']);');

if (startIndex !== -1 && endIndex !== -1) {
  const result = data.slice(0, startIndex) + replacement + '\n          }\n\n          ' + data.slice(endIndex);
  fs.writeFileSync('src/lib/imap.ts', result);
  console.log("Success");
} else {
  console.log("Could not find boundaries");
}
