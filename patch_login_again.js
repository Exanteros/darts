const fs = require('fs');
const file = '/home/cedric/dartsturnier/src/app/login/page.tsx';
let content = fs.readFileSync(file, 'utf-8');

const search = `body: JSON.stringify({ email, response: authResp }),`;
const replacement = `body: JSON.stringify({
          credential: authResp,
          userId: optionsParams.userId,
          challenge: optionsParams.options.challenge,
        }),`;

if (content.includes(search)) {
  content = content.replace(search, replacement);
  fs.writeFileSync(file, content);
  console.log('Patched login!');
} else {
  console.log('Search string not found in login.');
}
