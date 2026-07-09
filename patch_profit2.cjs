const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  /async function creditPlatformProfit\(feeAmount: number\) \{\n  if \(feeAmount <= 0\) return;/,
  `async function creditPlatformProfit(feeAmount: number) {
  if (feeAmount === 0) return;`
);

fs.writeFileSync('server.ts', code);
console.log("Patched creditPlatformProfit to accept negative amounts");
