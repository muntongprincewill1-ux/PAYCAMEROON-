const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const helper = `
async function creditPlatformProfit(feeAmount: number) {
  if (feeAmount <= 0) return;
  if (useMockDb) {
    const revenueWallet = internalWalletsData.find(w => w.name === 'Revenue Wallet');
    if (revenueWallet) {
      revenueWallet.balance += feeAmount;
    }
  } else {
    try {
      let revenueWallet = await InternalWallet.findOne({ name: 'Revenue Wallet' });
      if (!revenueWallet) {
        revenueWallet = new InternalWallet({ name: 'Revenue Wallet', balance: 0 });
      }
      revenueWallet.balance += feeAmount;
      await revenueWallet.save();
    } catch (e) {
      console.error("Failed to credit platform profit", e);
    }
  }
}
`;

if (!code.includes("async function creditPlatformProfit")) {
  code = code.replace(/function notifyUser/, helper + '\nfunction notifyUser');
  fs.writeFileSync('server.ts', code);
  console.log("Added creditPlatformProfit helper");
} else {
  console.log("Helper already exists");
}
