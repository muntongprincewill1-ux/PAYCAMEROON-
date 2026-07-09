const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  /if \(merchant\.commissionBalance < amount\) return res\.status\(400\)\.json\(\{ error: "Insufficient commission balance" \}\);\n\n    merchant\.commissionBalance -= amount;/,
  `if (merchant.commissionBalance < amount) return res.status(400).json({ error: "Insufficient commission balance" });

    // Handle Mobile Money via Campay
    if (method === 'mtn' || method === 'orange') {
      try {
         await campayWithdraw(amount, destination, "paycam-comm-" + Date.now());
      } catch (e: any) {
         return res.status(400).json({ error: "Mobile Money withdrawal failed: " + e.message });
      }
    }

    merchant.commissionBalance -= amount;`
);

fs.writeFileSync('server.ts', code);
console.log("Patched merchant commission");
