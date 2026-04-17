const fs = require('fs');
const file = '/home/cedric/dartsturnier/src/app/api/webauthn/register/verify/route.ts';
let content = fs.readFileSync(file, 'utf-8');

const search = `credentialId: Buffer.from(registrationInfo.credential.id).toString('base64url'),`;
const replacement = `credentialId: registrationInfo.credential.id,`;

if (content.includes(search)) {
  content = content.replace(search, replacement);
  fs.writeFileSync(file, content);
  console.log('Patched register verify!');
} else {
  console.log('Search string not found in register verify.');
}
