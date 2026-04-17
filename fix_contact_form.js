const fs = require('fs');
const mailPath = '/home/cedric/dartsturnier/src/lib/mail.ts';
let mailCode = fs.readFileSync(mailPath, 'utf8');

// Update sendMail to accept replyTo
mailCode = mailCode.replace(
  "export async function sendMail({ to, subject, text, html }: { to: string, subject: string, text: string, html?: string }) {",
  "export async function sendMail({ to, subject, text, html, replyTo }: { to: string, subject: string, text: string, html?: string, replyTo?: string }) {"
);

mailCode = mailCode.replace(
  "      subject,\n      text,\n      html,\n    });",
  "      subject,\n      text,\n      html,\n      replyTo,\n    });"
);

if(!mailCode.includes('replyTo')) {
    console.error("Replacement failed for mail.ts");
}

fs.writeFileSync(mailPath, mailCode);

const routePath = '/home/cedric/dartsturnier/src/app/api/contact/submit/route.ts';
let routeCode = fs.readFileSync(routePath, 'utf8');

routeCode = routeCode.replace(
  "    const sent = await sendMail({\n      to: supportInbox,\n      subject: `[Kontaktformular] ${subject}`,\n      text: plainText,\n      html,\n    });",
  "    const sent = await sendMail({\n      to: supportInbox,\n      subject: `[Kontaktformular] ${subject}`,\n      text: plainText,\n      html,\n      replyTo: email,\n    });"
);

fs.writeFileSync(routePath, routeCode);

