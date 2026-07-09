const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  /const totalRevenue = Math\.max\(0, \(totalFees \|\| 0\) - \(totalCommissions \|\| 0\) - \(totalProfitWithdrawn \|\| 0\)\);/g,
  `const totalRevenue = Math.max(0, (totalFees || 0) - (totalCommissions || 0));`
);

fs.writeFileSync('server.ts', code);
console.log("Patched cumulative revenue");
