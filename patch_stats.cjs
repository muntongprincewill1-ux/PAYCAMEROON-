const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Patch /api/admin/stats
code = code.replace(
  /const totalRevenue = Math\.max\(0, netProfit - totalProfitWithdrawn\);/g,
  `let totalRevenue = 0;
    if (useMockDb) {
      const revWallet = internalWalletsData.find(w => w.name === 'Revenue Wallet');
      totalRevenue = revWallet ? revWallet.balance : 0;
    } else {
      const revWallet = await InternalWallet.findOne({ name: 'Revenue Wallet' });
      totalRevenue = revWallet ? revWallet.balance : 0;
    }`
);

fs.writeFileSync('server.ts', code);
console.log("Patched stats to read from Revenue Wallet");
