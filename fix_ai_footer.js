const fs = require('fs');

let code = fs.readFileSync('src/lib/imap.ts', 'utf8');

// 1. Update the system prompt to include a knowledge base dynamically
const oldPrompt = `6. Antworte auf Deutsch und formatiere wichtige Worte mit HTML-Tags (z.B. <b>).\``;
const newPrompt = `6. Antworte auf Deutsch und formatiere wichtige Worte mit HTML-Tags (z.B. <b>).
7. Nutze ausschließlich die folgende Wissensdatenbank zur Beantwortung von Fragen:

WISSENSDATENBANK:
\${process.env.LLM_KNOWLEDGE_BASE || 'Aktuell sind keine speziellen Fakten hinterlegt. Verweise bei Fragen an einen menschlichen Mitarbeiter.'}\``;

code = code.replace(oldPrompt, newPrompt);

// 2. Track AI usage and add footer
const oldAiText = `                  let aiResponseText = 'Vielen Dank für deine Nachricht. Wir kümmern uns schnellstmöglich darum.';`;
const newAiText = `                  let aiResponseText = 'Vielen Dank für deine Nachricht. Wir kümmern uns schnellstmöglich darum.';
                  let isAiGenerated = false;`;

code = code.replace(oldAiText, newAiText);

const oldSuccess = `aiResponseText = aiResponse.choices[0]?.message?.content || aiResponseText;`;
const newSuccess = `aiResponseText = aiResponse.choices[0]?.message?.content || aiResponseText;
                      if (aiResponse.choices[0]?.message?.content) isAiGenerated = true;`;

code = code.replace(oldSuccess, newSuccess);

const oldHtml = `let finalHtmlContext = filled + \`<br/><br/>\\n        <div style="margin-top:30px; padding-top:20px; border-top:1px solid #ccc; font-size:14px; color:#555;">\\n          <strong>Dein \${brandName} Support-Team</strong><br/>\\n          <a href="mailto:\${supportAddr}" style="color:#3b82f6; text-decoration:none;">\${supportAddr}</a><br/>\\n          <i>Bitte belasse bei Antworten immer die Ticket-ID im Betreff.</i>\\n        </div>\`;`;

const newHtml = `let aiDisclaimer = isAiGenerated 
                      ? \`<br/><br/><div style="font-size:12px; color:#888; font-style:italic;">🤖 Diese Antwort wurde automatisch von unserer Support-KI erstellt. Bei komplexen Fragen übernimmt ein menschlicher Mitarbeiter.</div>\` 
                      : '';
                    let finalHtmlContext = filled + aiDisclaimer + \`<br/><br/>\\n        <div style="margin-top:30px; padding-top:20px; border-top:1px solid #ccc; font-size:14px; color:#555;">\\n          <strong>Dein \${brandName} Support-Team</strong><br/>\\n          <a href="mailto:\${supportAddr}" style="color:#3b82f6; text-decoration:none;">\${supportAddr}</a><br/>\\n          <i>Bitte belasse bei Antworten immer die Ticket-ID im Betreff.</i>\\n        </div>\`;`;

code = code.replace(oldHtml, newHtml);

fs.writeFileSync('src/lib/imap.ts', code);
