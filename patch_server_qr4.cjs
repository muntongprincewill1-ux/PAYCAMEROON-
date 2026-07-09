const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(
  'qrCode: `LPA:1$smdp.plus.com${provider.toUpperCase()}-${newNumber}`',
  'qrCode: `LPA:1$smdp.plus.com$$${provider.toUpperCase()}-${newNumber}`'
);
content = content.replace(
  'qrCode: `LPA:1$smdp.plus.com${provider.toUpperCase()}-${newNumber}`',
  'qrCode: `LPA:1$smdp.plus.com$$${provider.toUpperCase()}-${newNumber}`'
);

fs.writeFileSync('server.ts', content);
