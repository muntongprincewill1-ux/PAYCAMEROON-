const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(
  'qrCode: "simulated_qr_data_buy", newNumber',
  'qrCode: `LPA:1$smdp.plus.com$${provider.toUpperCase()}-${newNumber}`, newNumber'
);
content = content.replace(
  'qrCode: "simulated_qr_data_buy", newNumber', // In case there are two
  'qrCode: `LPA:1$smdp.plus.com$${provider.toUpperCase()}-${newNumber}`, newNumber'
);

fs.writeFileSync('server.ts', content);
