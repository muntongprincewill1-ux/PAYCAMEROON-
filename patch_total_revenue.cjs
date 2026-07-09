const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  /let totalRevenue = 0;\s*if \(useMockDb\) \{\s*const revWallet = internalWalletsData\.find\(w => w\.name === 'Revenue Wallet'\);\s*totalRevenue = revWallet \? revWallet\.balance : 0;\s*\} else \{\s*const revWallet = await mongoose\.models\.InternalWallet\.findOne\(\{ name: 'Revenue Wallet' \}\);\s*totalRevenue = revWallet \? revWallet\.balance : 0;\s*\}/g,
  `const totalRevenue = Math.max(0, (totalFees || 0) - (totalCommissions || 0) - (totalProfitWithdrawn || 0));`
);

fs.writeFileSync('server.ts', code);
console.log("Patched totalRevenue calculation to dynamic computation");
