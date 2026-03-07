const fs = require('fs');
let data = fs.readFileSync('src/lib/imap.ts', 'utf-8');

const regex = /              \/\/ send quick acknowledgement if the sender is not the support account itself([^]*?)catch \(err\) \{\n                console\.error\('Failed to send auto-reply:', err\);\n              \}\n            \}/g;

const replacement = `              const fromAddr = parsed.from?.value[0]?.address || 'unknown';
              const supportAddr = process.env.IMAP_USER || process.env.SMTP_USER || '';
              const adminAddr = process.env.ADMIN_EMAIL || 'admin@pudo-dartmasters.de';
              
              const isAdminReply = fromAddr.toLowerCase() === adminAddr.toLowerCase();

              if (fromAddr && supportAddr && fromAddr.toLowerCase() !== supportAddr.toLowerCase()) {
                if (isAdminReply) {
                  // --- FEATURE: ADMIN ANSWERING EXTERNALLY ---
                  const originalTicketUser = await prisma.supportEmail.findFirst({
                    where: { threadId: ticketId, isReply: false },
                    orderBy: { createdAt: 'asc' }
                  });

                  if (originalTicketUser && originalTicketUser.fromEmail !== adminAddr.toLowerCase()) {
                    const htmlContent = parsed.html || parsed.textAsHtml || parsed.text?.replace(/\\n/g, '<br/>') || '';
                    const brandName = process.env.BRAND_NAME || 'Dart Masters Support';
                    let finalHtmlContext = htmlContent + \`<br/><br/>\\n        <div style="margin-top:30px; padding-top:20px; border-top:1px solid #ccc; font-size:14px; color:#555;">\\n          <strong>Dein \${brandName} Support-Team</strong><br/>\\n          <a href="mailto:\${supportAddr}" style="color:#3b82f6; text-decoration:none;">\${supportAddr}</a><br/>\\n          <i>Bitte belasse bei Antworten immer die Ticket-ID im Betreff.</i>\\n        </div>\`;
                    
                    const htmlBody = await renderHtml(finalHtmlContext, brandName, true);
                    
                    try {
                      await transporter.sendMail({
                        from: supportAddr,
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

                  const brandName = process.env.BRAND_NAME || "Dart Masters Support";
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
                      from: \`"\${senderName} (Support Ticket)" <\${supportAddr}>\`,
                      to: adminAddr,
                      replyTo: supportAddr, 
                      subject: \`[\${ticketId}] \${subjectLine}\`,
                      text: \`Neues Ticket von \${senderName} (\${fromAddr}):\\n\\n\${parsed.text || ''}\`,
                      html: \`<div style="padding:10px; background:#f0f0f0; border:1px solid #ddd; margin-bottom:20px;">\\n            <b>Neues Ticket von:</b> \${senderName} (\${fromAddr})<br>\\n            <b>Antworte auf diese E-Mail, um an den Kunden über das System zurückzuschreiben. Dein Text wird als offizielle Support-Antwort verschickt.</b>\\n          </div>\\n          \${parsed.html || parsed.textAsHtml || parsed.text?.replace(/\\n/g, '<br/>') || ''}\`
                    });
                  } catch (err) {
                    console.error('Failed to forward to admin:', err);
                  }
                }
              }`;

if (regex.test(data)) {
    data = data.replace(regex, replacement);
    fs.writeFileSync('src/lib/imap.ts', data);
    console.log("Success");
} else {
    console.log("Failed to match Regex");
}
