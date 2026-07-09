const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  /const totalFees = transactionsList\.reduce\(\(acc: number, t: any\) => acc \+ \(t\.fee \|\| 0\), 0\);\s*const totalProfitWithdrawn/g,
  `const totalFees = transactionsList.reduce((acc: number, t: any) => acc + (t.fee || 0), 0);\n                const totalCommissions = transactionsList.reduce((acc: number, t: any) => acc + (t.commissionRecord || 0), 0);\n                const totalProfitWithdrawn`
);

fs.writeFileSync('server.ts', code);
console.log("Patched totalCommissions definition");
