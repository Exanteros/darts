const fs = require('fs');
const mailPath = '/home/cedric/dartsturnier/src/lib/mail.ts';
let mailCode = fs.readFileSync(mailPath, 'utf8');

mailCode = mailCode.replace(
  "  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {",
  "  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || process.env.SMTP_HOST === 'your_smtp_host' || process.env.SMTP_USER === 'your_email') {"
);

fs.writeFileSync(mailPath, mailCode);
