const fs = require('fs');
const files = [
  'src/app/api/webauthn/authenticate/verify/route.ts',
  'src/app/api/webauthn/authenticate/route.ts',
  'src/app/api/webauthn/register/verify/route.ts',
  'src/app/api/webauthn/register/route.ts'
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf-8');
    content = content.replace(/'your-domain\.com'/g, "'pudo-dartmasters.de'");
    content = content.replace(/'https:\/\/your-domain\.com'/g, "'https://pudo-dartmasters.de'");
    fs.writeFileSync(file, content);
    console.log(`Fixed ${file}`);
  }
}
