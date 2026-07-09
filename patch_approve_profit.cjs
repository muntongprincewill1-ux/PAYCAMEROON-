const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  /await creditPlatformProfit\(t\.fee\);/g,
  `await creditPlatformProfit(t.fee - commission);`
);

fs.writeFileSync('server.ts', code);
console.log("Patched approve profit");
