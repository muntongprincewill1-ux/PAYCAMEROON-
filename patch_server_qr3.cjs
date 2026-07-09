const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(
  /smdp\.plus\.com\$\{provider\.toUpperCase\(\)\}/g,
  'smdp.plus.com$${provider.toUpperCase()}'
);

fs.writeFileSync('server.ts', content);
