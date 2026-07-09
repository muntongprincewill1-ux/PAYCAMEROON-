const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  /const totalRevenue = Math\.max\(0, totalFees - totalProfitWithdrawn\);/g,
  `let totalRevenue = 0;
                if (useMockDb) {
                  const revWallet = internalWalletsData.find(w => w.name === 'Revenue Wallet');
                  totalRevenue = revWallet ? revWallet.balance : 0;
                } else {
                  const revWallet = await InternalWallet.findOne({ name: 'Revenue Wallet' });
                  totalRevenue = revWallet ? revWallet.balance : 0;
                }`
);

code = code.replace(
  /platformTreasuryBalance \-= approval\.metadata\.amount;/g,
  `if (approval.type === 'profit_withdrawal') {
                await creditPlatformProfit(-approval.metadata.amount);
            } else {
                platformTreasuryBalance -= approval.metadata.amount;
            }`
);

fs.writeFileSync('server.ts', code);
console.log("Patched profit_withdrawal");
