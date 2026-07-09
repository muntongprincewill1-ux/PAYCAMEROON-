const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  /notifyUser\(merchant\._id, 'Processed Withdrawal', `You processed a withdrawal of \$\{t\.amount\.toLocaleString\(\)\} XAF for \$\{user\.name \|\| user\.phone\}\.`\);\n\n    if \(isMockTx\) \{/g,
  "notifyUser(merchant._id, 'Processed Withdrawal', `You processed a withdrawal of ${t.amount.toLocaleString()} XAF for ${user.name || user.phone}.`);\n    await creditPlatformProfit(t.fee);\n\n    if (isMockTx) {"
);

fs.writeFileSync('server.ts', code);
console.log("Patched approve fee");
