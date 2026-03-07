const fs = require('fs');

const data = fs.readFileSync('src/lib/imap.ts', 'utf-8');

const replacement = `            if (!existing) {
              const subjectLine = parsed.subject || 'No Subject';
              const ticketMatch = subjectLine.match(/\\[(DT-[A-Z0-9]{6})\\]/i);
              const generatedTicketId = \`DT-\${Math.random().toString(36).substring(2, 8).toUpperCase()}\`;
              const ticketId = ticketMatch ? ticketMatch[1].toUpperCase() : generatedTicketId;
              const fromAddr = parsed.from?.value[0]?.address || 'unknown@domain.com';
              const supportAddr = process.env.IMAP_USER || process.env.SMTP_USER || '';
              const adminAddr = process.env.ADMIN_EMAIL || process.env.ADMIN_MAIL_ADDRESS || 'admin@pudo-dartmasters.de'; // The external admin email
              
              const isAdminReply = fromAddr.toLowerCase() === adminAddr.toLowerCase();

              await prisma.supportEmail.create({
                data: {
                  messageId: parsed.messageId || \`uuid-\${Date.now()}-\${Math.random()}\`,
                  threadId: ticketId,
                  subject: subjectLine,
                  fromName: parsed.from?.value[0]?.name || null,
                  fromEmail: fromAddr,
                  toEmail: toAddress,
                  bodyText: parsed.text || null,
                  bodyHtml: typeof parsed.textAsHtml === 'string' ? parsed.textAsHtml : (typeof parsed.html === 'string' ? parsed.html : null),
                  isRead: isAdminReply, // Don't show admin replies as unread user tickets
                  isReply: isAdminReply,
                  createdAt: parsed.date || new Date()
                }
              });

              if (fromAddr && supportAddr && fromAddr.toLowerCase() !== supportAddr.toLowerCase()) {
                if (isAdminReply) {
                  // --- FEATURE: ADMIN ANSWERING EXTERNALLY ---
                  // Find who the original sender was by checking the thread ticketId
                  const originalTicketUser = await prisma.supportEmail.findFirst({
                    where: { threadId: ticketId, isReply: false },
                    orderBy: { createdAt: 'asc' }
                  });

                  if (originalTicketUser && originalTicketUser.fromEmail !== adminAddr.toLowerCase()) {
                    const htmlContent = parsed.html || parsed.textAsHtml || parsed.text?.replace(/\\n/g, '<br/>') || '';
                    const brandName = process.env.BRAND_NAME || 'Darts Masters Support';
                    let finalHtmlContext = htmlContent;
                    
                    finalHtmlContext += \`<br/><br/>\\n        <div style="margin-top:30px; padding-top:20px; border-top:1px solid #ccc; font-size:14px; color:#555;">\\n          <strong>Dein \${brandName} Support-Team</strong><br/>\\n          <a href="mailto:\${supportAddr}" style="color:#3b82f6; text-decoration:none;">\${supportAddr}</a><br/>\\n          <i>Bitte belasse bei Antworten immer die Ticket-ID im Betreff.</i>\\n        </div>\`;
                    
                    const htmlBody = await renderHtml(finalHtmlContext, brandName, true);
                    
                    try {
                      await transporter.sendMail({
                        from: supportAddr, // Send as support system
                        to: originalTicketUser.fromEmail,
                        subject: subjectLine,
                        text: parsed.text || '',
                        html: htmlBody
                      });
                    } catch (err) {
                      console.error('Failed to relay admin reply to user:', err);
                    }
                  }
                } else {
                  // --- FEATURE: USER OPENS TICKET ---
                  const rawTemplate = process.env.AUTO_REPLY_TEMPLATE || process.env.AUTO_REPLY_TEXT || 'Ja, wird bearbeitet.';
                  const senderName = parsed.from?.value[0]?.name || parsed.from?.value[0]?.address || '';
                  const filled = rawTemplate
                    .replace(/\\{name\\}/gi, senderName)
                    .replace(/\\{email\\}/gi, fromAddr)
                    .replace(/\\{ticket\\}/gi, ticketId);

                  const brandName = process.env.BRAND_NAME || "Darts Masters Support";
                  let finalHtmlContext = filled + \`<br/><br/>\\n        <div style="margin-top:30px; padding-top:20px; border-top:1px solid #ccc; font-size:14px; color:#555;">\\n          <strong>Dein \${brandName} Support-Team</strong><br/>\\n          <a href="mailto:\${supportAddr}" style="color:#3b82f6; text-decoration:none;">\${supportAddr}</a><br/>\\n          <i>Bitte belasse bei Antworten immer die Ticket-ID im Betreff.</i>\\n        </div>\`;
                  
                  const plainText = filled.replace(/<[^>]+>/g, '');
                  const htmlBody = await renderHtml(finalHtmlContext, brandName, true);
                  
                  // 1. Auto Reply to User
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

                  // 2. Forward to Admin
                  try {
                    await transporter.sendMail({
                      from: supportAddr,
                      to: adminAddr,
                      replyTo: supportAddr, // Admin replies to Support System to loop it back
                      subject: \`[\${ticketId}] \${subjectLine}\`,
                      text: \`Neues Ticket von \${senderName} (\${fromAddr}):\\n\\n\${parsed.text || ''}\`,
                      html: \`<div style="padding:10px; background:#f0f0f0; border:1px solid #ddd; margin-bottom:20px;">\\n            <b>Neues Ticket von:</b> \${senderName} (\${fromAddr})<br>\\n            <b>Antworte auf diese E-Mail, um an den Kunden über das System zurückzuschreiben. Das System schleift deine Antwort durch!</b>\\n          </div>\\n          \${parsed.html || parsed.textAsHtml || parsed.text?.replace(/\\n/g, '<br/>') || ''}\`
                    });
                  } catch (err) {
                    console.error('Failed to forward to admin:', err);
                  }
                }
              }
            }`;

// We will replace from "if (!existing) {" down to "console.error('Failed to send auto-reply:', err);\n              }\n            }"
const startIndex = data.indexOf('if (!existing) {');
const endIndex = data.indexOf('await client.messageFlagsAdd(seq, [\'\\\\Seen\']);');

if (startIndex !== -1 && endIndex !== -1) {
  const result = data.slice(0, startIndex) + replacement + '\n          }\n\n          ' + data.slice(endIndex);
  fs.writeFileSync('src/lib/imap.ts', result);
  console.log("Success");
} else {
  console.log("Could not find boundaries");
}
