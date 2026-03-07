const fs = require('fs');

const data = fs.readFileSync('src/lib/imap.ts', 'utf-8');

// First, add the import if it's missing
let newData = data;
if (!newData.includes("import OpenAI from 'openai';")) {
  newData = newData.replace(
    "import nodemailer from 'nodemailer';",
    "import nodemailer from 'nodemailer';\nimport OpenAI from 'openai';"
  );
}

const startIndex = newData.indexOf('                  // 2. Formatting & Sending logic');
const endIndex = newData.indexOf('            }\n          }\n\n          await client.messageFlagsAdd(');

if (startIndex !== -1 && endIndex !== -1) {
  const replacement = `                  // 2. AI Response & Sending logic
                  let aiResponseText = 'Vielen Dank für deine Nachricht. Wir kümmern uns schnellstmöglich darum.';
                  
                  if (process.env.OPENAI_API_KEY) {
                    try {
                      const openai = new OpenAI({
                        apiKey: process.env.OPENAI_API_KEY,
                        baseURL: process.env.BASE_URL || "https://llm-server.llmhub.t-systems.net/v2"
                      });
                      
                      const aiResponse = await openai.chat.completions.create({
                        model: "Llama-3.1-70B-Instruct",
                        messages: [
                          {
                            role: "system",
                            content: \`Du bist ein freundlicher, hilfreicher und professioneller Support-Mitarbeiter für Darts Masters. Beantworte die Anfrage des Kunden direkt und präzise auf Deutsch. Antworte in einer gut lesbaren Struktur (benutze Absätze). Formatiere mit HTML Tags falls du etwas hervorheben möchtest (z.B. <b>). Schreibe keine eigene Grußformel (Footer) am Ende (z.B. "Mit freundlichen Grüßen..."), da diese automatisch angehängt wird.\`
                          },
                          {
                            role: "user",
                            content: \`Kunde: \${senderName}\\nBetreff: \${subjectLine}\\nNachricht:\\n\${parsed.text || 'Kein Text'}\`
                          }
                        ],
                        max_tokens: 1024,
                        temperature: 0.5
                      });
                      aiResponseText = aiResponse.choices[0]?.message?.content || aiResponseText;
                    } catch (aiErr) {
                      console.error('AI Error:', aiErr);
                    }
                  } else if (isNewTicket) {
                     // Fallback to basic auto reply if no AI configured & it's new ticket
                     const rawTemplate = process.env.AUTO_REPLY_TEMPLATE || process.env.AUTO_REPLY_TEXT || 'Ja, wird bearbeitet.';
                     aiResponseText = rawTemplate
                       .replace(/\\{name\\}/gi, senderName)
                       .replace(/\\{email\\}/gi, fromAddr)
                       .replace(/\\{ticket\\}/gi, ticketId);
                  } else {
                     // If it's a followup user reply and no AI, just don't auto-respond with text, we let admin handle it
                     aiResponseText = '';
                  }

                  if (aiResponseText) {
                    // Ensure HTML breaks
                    const filled = aiResponseText.replace(/\\n/g, '<br/>');
                    const brandName = process.env.BRAND_NAME || "Darts Masters Support";
                    let finalHtmlContext = filled + \`<br/><br/>\\n        <div style="margin-top:30px; padding-top:20px; border-top:1px solid #ccc; font-size:14px; color:#555;">\\n          <strong>Dein \${brandName} Support-Team</strong><br/>\\n          <a href="mailto:\${supportAddr}" style="color:#3b82f6; text-decoration:none;">\${supportAddr}</a><br/>\\n          <i>Bitte belasse bei Antworten immer die Ticket-ID im Betreff.</i>\\n        </div>\`;
                    
                    const plainText = filled.replace(/<[^>]+>/g, '').replace(/<br\\s*\\/?>/gi, '\\n');
                    const htmlBody = await renderHtml(finalHtmlContext, brandName, true);
                    
                    try {
                      // Send AI reply to user
                      const sentMsg = await transporter.sendMail({
                         from: supportAddr,
                         to: fromAddr,
                         subject: \`Re: \${subjectLine.replace(/(Re:|\\s*\\[DT-[A-Z0-9]{6}\\])/gi, '').trim()} [\${ticketId}]\`,
                         text: plainText,
                         html: htmlBody
                      });

                      // Save AI reply to DB so it shows up in dashboard!
                      await prisma.supportEmail.create({
                        data: {
                          messageId: sentMsg.messageId || \`ai-reply-\${Date.now()}\`,
                          threadId: ticketId,
                          subject: \`Re: \${subjectLine}\`,
                          fromEmail: supportAddr,
                          toEmail: fromAddr,
                          bodyText: plainText,
                          bodyHtml: finalHtmlContext,
                          isRead: true, 
                          isReply: true,
                          createdAt: new Date()
                        }
                      });
                    } catch (err) {
                      console.error('Failed to send auto-reply:', err);
                    }
                  }

                  // 3. Forward to Admin (For both New and Replies)
                  try {
                    const cleanSubj = subjectLine.replace(/\\s*\\[DT-[A-Z0-9]{6}\\]/gi, '').trim();
                    let adminHtml = \`<div style="padding:10px; background:#f0f0f0; border:1px solid #ddd; margin-bottom:20px;">\\n            <b>\${isNewTicket ? 'Neues Ticket' : 'Neue Antwort'} von:</b> \${senderName} (\${fromAddr})<br>\\n            <b>Antworte auf diese E-Mail, um an den Kunden aus dem System heraus zurückzuschreiben.</b>\\n          </div>\\n          \${parsed.html || parsed.textAsHtml || parsed.text?.replace(/\\n/g, '<br/>') || ''}\`;
                    
                    if (aiResponseText) {
                      adminHtml = \`<div style="padding:10px; background:#e8f4f8; border:1px solid #b6d4fe; margin-bottom:20px; color:#0c5460;">\\n            <b>⚠️ Die KI hat bereits geantwortet:</b><br/>\\n            \${aiResponseText.replace(/\\n/g, '<br/>')}\\n          </div>\` + adminHtml;
                    }

                    await transporter.sendMail({
                      from: \`"\${senderName} (\${ticketId})" <\${supportAddr}>\`,
                      to: adminAddr,
                      replyTo: supportAddr, 
                      subject: \`[\${ticketId}] \${cleanSubj}\`,
                      text: \`\${isNewTicket ? 'Neues Ticket' : 'Neue Antwort'} von \${senderName} (\${fromAddr}):\\n\\n\${parsed.text || ''}\\n\\n---\\nKI Antwort:\\n\${aiResponseText}\`,
                      html: adminHtml
                    });
                  } catch (err) {
                    console.error('Failed to forward to admin:', err);
                  }
                }
              }
`;
  
  newData = newData.slice(0, startIndex) + replacement + newData.slice(endIndex);
  fs.writeFileSync('src/lib/imap.ts', newData);
  console.log("Success");
} else {
  console.log("Could not find boundaries");
}
