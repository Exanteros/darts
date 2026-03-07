const fs = require('fs');

const path = 'src/lib/mail.ts';
let code = fs.readFileSync(path, 'utf8');

// replace @/lib/prisma to generic relative if it exists, to match others
code = code.replace("import { prisma } from '@/lib/prisma';", "import { prisma } from './prisma';");

fs.writeFileSync(path, code);
