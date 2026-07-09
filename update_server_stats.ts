import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf-8');

// Admin Stats
content = content.replace(
  `    const totalFees = transactionsList.reduce((acc: number, t: any) => acc + (t.fee || 0), 0);\n    const totalProfitWithdrawn = transactionsList.filter((t: any) => t.type === 'profit_withdrawal').reduce((acc: number, t: any) => acc + (t.amount || 0), 0);\n    const totalRevenue = Math.max(0, totalFees - totalProfitWithdrawn);`,
  `    const totalFees = transactionsList.reduce((acc: number, t: any) => acc + (t.fee || 0), 0);\n    const totalCommissions = transactionsList.reduce((acc: number, t: any) => acc + (t.commissionRecord || 0), 0);\n    const netProfit = totalFees - totalCommissions;\n    const totalProfitWithdrawn = transactionsList.filter((t: any) => t.type === 'profit_withdrawal').reduce((acc: number, t: any) => acc + (t.amount || 0), 0);\n    const totalRevenue = Math.max(0, netProfit - totalProfitWithdrawn);`
);

content = content.replace(
  `        revenue: dayTx.reduce((acc: number, t: any) => acc + ((t.fee || 0) * 0.7), 0)`,
  `        revenue: dayTx.reduce((acc: number, t: any) => acc + ((t.fee || 0) - (t.commissionRecord || 0)), 0)`
);

// Finance Stats
content = content.replace(
  `    const totalFees = transactionsList.reduce((acc: number, t: any) => acc + (t.fee || 0), 0);\n    const totalProfitWithdrawn = transactionsList.filter((t: any) => t.type === 'profit_withdrawal').reduce((acc: number, t: any) => acc + (t.amount || 0), 0);\n    const totalRevenue = Math.max(0, totalFees - totalProfitWithdrawn);`,
  `    const totalFees = transactionsList.reduce((acc: number, t: any) => acc + (t.fee || 0), 0);\n    const totalCommissions = transactionsList.reduce((acc: number, t: any) => acc + (t.commissionRecord || 0), 0);\n    const netProfit = totalFees - totalCommissions;\n    const totalProfitWithdrawn = transactionsList.filter((t: any) => t.type === 'profit_withdrawal').reduce((acc: number, t: any) => acc + (t.amount || 0), 0);\n    const totalRevenue = Math.max(0, netProfit - totalProfitWithdrawn);`
);

content = content.replace(
  `        revenue: dayTx.reduce((acc: number, t: any) => acc + ((t.fee || 0) * 0.8), 0)`,
  `        revenue: dayTx.reduce((acc: number, t: any) => acc + ((t.fee || 0) - (t.commissionRecord || 0)), 0)`
);

fs.writeFileSync('server.ts', content);
console.log('Server stats updated.');
