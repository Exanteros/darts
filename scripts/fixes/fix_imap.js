const fs = require('fs');

const path = 'src/lib/imap.ts';
let code = fs.readFileSync(path, 'utf8');

// replace nodemailer default import with star import
code = code.replace("import nodemailer from 'nodemailer';", "import * as nodemailer from 'nodemailer';");

fs.writeFileSync(path, code);
