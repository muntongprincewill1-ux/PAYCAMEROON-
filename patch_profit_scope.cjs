const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  /await InternalWallet\.findOne\(\{ name: 'Revenue Wallet' \}\);/g,
  `await mongoose.models.InternalWallet.findOne({ name: 'Revenue Wallet' });`
);
code = code.replace(
  /new InternalWallet\(\{ name: 'Revenue Wallet', balance: 0 \}\);/g,
  `new mongoose.models.InternalWallet({ name: 'Revenue Wallet', balance: 0 });`
);

fs.writeFileSync('server.ts', code);
console.log("Patched profit scope");
