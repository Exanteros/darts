const p = require('./prisma.config');
p.default.supportEmail.findMany().then(m => {
  console.log(JSON.stringify(m.map(x => ({id: x.id, msgId: x.messageId, subject: x.subject})), null, 2));
  process.exit();
}).catch(console.error);
