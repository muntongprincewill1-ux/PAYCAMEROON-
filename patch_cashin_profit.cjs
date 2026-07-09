const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  /notifyUser\(agent\._id, 'Processed Deposit', `You processed a deposit of \$\{numAmount\.toLocaleString\(\)\} XAF for \$\{user\.name \|\| user\.phone\}\.`\);\n\n    if \(useMockDb\) \{/g,
  "notifyUser(agent._id, 'Processed Deposit', `You processed a deposit of ${numAmount.toLocaleString()} XAF for ${user.name || user.phone}.`);\n    await creditPlatformProfit(-commission);\n\n    if (useMockDb) {"
);

fs.writeFileSync('server.ts', code);
console.log("Patched cashin profit");
