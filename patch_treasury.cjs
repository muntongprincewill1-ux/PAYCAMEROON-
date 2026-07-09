const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Replace the static platformTreasuryBalance assignment with 0
code = code.replace(/let platformTreasuryBalance = 50000000;/, 'let platformTreasuryBalance = 0;');

// Make the get treasury endpoint compute real values for balance
code = code.replace(/res\.json\(\{\s*balance:\s*platformTreasuryBalance,/, 
`
      const usersBalance = Array.from(mockUsers.values()).filter(u => u.role === 'user').reduce((acc: number, u: any) => acc + (u.balance || 0), 0);
      const merchantsBalance = Array.from(mockUsers.values()).filter(u => u.role === 'merchant').reduce((acc: number, u: any) => acc + (u.balance || 0), 0);
      const agentsBalance = Array.from(mockUsers.values()).filter(u => u.role === 'agent').reduce((acc: number, u: any) => acc + (u.balance || 0), 0);
      const totalLiability = usersBalance + merchantsBalance + agentsBalance;
      
      const totalFees = mockTransactions.reduce((acc: number, t: any) => acc + (t.fee || 0), 0);
      const totalCommissions = mockTransactions.reduce((acc: number, t: any) => acc + (t.commissionRecord || 0), 0);
      const netProfit = totalFees - totalCommissions;
      const totalProfitWithdrawn = mockTransactions.filter((t: any) => t.type === 'profit_withdrawal').reduce((acc: number, t: any) => acc + (t.amount || 0), 0);
      const totalRevenue = Math.max(0, netProfit - totalProfitWithdrawn);
      const realPlatformFloat = totalLiability + totalRevenue + platformTreasuryBalance; // platformTreasuryBalance is now just manual sweeps

      res.json({ 
          balance: realPlatformFloat, `
);

// Zero out the hardcoded wallet balances
code = code.replace(/balance: 125000000/g, 'balance: 0');
code = code.replace(/balance: 45000000/g, 'balance: 0');
code = code.replace(/balance: 32000000/g, 'balance: 0');
code = code.replace(/balance: 15000000/g, 'balance: 0');
code = code.replace(/balance: 5200000/g, 'balance: 0');
code = code.replace(/balance: 2100000/g, 'balance: 0');
code = code.replace(/balance: 10000000/g, 'balance: 0');

fs.writeFileSync('server.ts', code);
console.log("Patched treasury");
