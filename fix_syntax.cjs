const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  /res\.json\(\{ success: true \}\);\n\s*\}\n\}\);\n\s*\}\n\}\);/,
  `res.json({ success: true });\n    }\n});`
);

fs.writeFileSync('server.ts', code);
