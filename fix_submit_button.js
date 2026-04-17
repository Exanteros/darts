const fs = require('fs');
const path = '/home/cedric/dartsturnier/src/app/contact/page.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  "disabled={isSubmitting || !isValid}",
  "disabled={isSubmitting}"
);

fs.writeFileSync(path, code);
