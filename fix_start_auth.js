const fs = require('fs');
const path = '/home/cedric/dartsturnier/src/app/login/page.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  "const authResp = await startAuthentication(optionsParams.options, true);",
  "const authResp = await startAuthentication({ optionsJSON: optionsParams.options, useBrowserAutofill: true });"
);

code = code.replace(
  "const authResp = await startAuthentication(optionsParams.options);",
  "const authResp = await startAuthentication({ optionsJSON: optionsParams.options });"
);

fs.writeFileSync(path, code);
