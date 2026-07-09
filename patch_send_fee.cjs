const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// For mockDb send
code = code.replace(
  /notifyUser\(recipientUser\._id, 'Payment Received', `You received \$\{amount\.toLocaleString\(\)\} XAF from \$\{sender\.name \|\| sender\.phone\}\.`\);/,
  "notifyUser(recipientUser._id, 'Payment Received', `You received ${amount.toLocaleString()} XAF from ${sender.name || sender.phone}.`);\n        await creditPlatformProfit(fee);"
);

// For realDb send
code = code.replace(
  /notifyUser\(recipientUser\._id, 'Payment Received', `You received \$\{amount\.toLocaleString\(\)\} XAF from \$\{sender\.name \|\| sender\.phone\}\.`\);\n\n        const transactionOut = new Transaction\(\{/g,
  "notifyUser(recipientUser._id, 'Payment Received', `You received ${amount.toLocaleString()} XAF from ${sender.name || sender.phone}.`);\n        await creditPlatformProfit(fee);\n\n        const transactionOut = new Transaction({"
);

fs.writeFileSync('server.ts', code);
console.log("Patched send fee");
