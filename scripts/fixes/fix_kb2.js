const fs = require('fs');
let code = fs.readFileSync('src/lib/imap.ts','utf8');

// we need to update dynamic KB code block to also fetch any tournament if none upcoming
const search = "let knowledgeBase = process.env.LLM_KNOWLEDGE_BASE || '';";
if(code.includes(search)){
  const replacement = `let knowledgeBase = process.env.LLM_KNOWLEDGE_BASE || '';
                        // fallback: if no upcoming/active, insert most recent tournament name
                        try {
                          const fallback = await prisma.tournament.findFirst({
                            orderBy: { startDate: 'desc' },
                          });
                          if (fallback && !knowledgeBase.includes('Aktuelles Turnier')) {
                            knowledgeBase += `\nAktuelles Turnier:\n- Name: ${fallback.name}\n`;
                          }
                        } catch(e) {
                          // ignore
                        }`;
  code = code.replace(search,replacement);
}
fs.writeFileSync('src/lib/imap.ts',code);
