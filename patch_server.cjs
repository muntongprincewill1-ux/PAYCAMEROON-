const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

// Buy eSIM
content = content.replace(
  `      mockTransactions.push(transaction);\n      return res.json({ success: true, transaction, newBalance: user.balance, qrCode: "simulated_qr_data_buy" });`,
  `      mockTransactions.push(transaction);\n      const prefix = provider.toLowerCase() === 'mtn' ? (Math.random() > 0.5 ? '67' : '68') : (Math.random() > 0.5 ? '69' : '65');\n      const newNumber = \`\${prefix}\${Math.floor(1000000 + Math.random() * 9000000)}\`;\n      return res.json({ success: true, transaction, newBalance: user.balance, qrCode: "simulated_qr_data_buy", newNumber });`
);

content = content.replace(
  `    await transaction.save();\n    \n    res.json({ success: true, transaction, newBalance: user.balance, qrCode: "simulated_qr_data_buy" });`,
  `    await transaction.save();\n    \n    const prefix = provider.toLowerCase() === 'mtn' ? (Math.random() > 0.5 ? '67' : '68') : (Math.random() > 0.5 ? '69' : '65');\n    const newNumber = \`\${prefix}\${Math.floor(1000000 + Math.random() * 9000000)}\`;\n    res.json({ success: true, transaction, newBalance: user.balance, qrCode: "simulated_qr_data_buy", newNumber });`
);

// Swap eSIM
content = content.replace(
  `        userId, type: 'swap_sim', amount: cost, agency: provider, recipient: \`Swap \${phoneNumber} to ESIM\`, fee: 0, status: 'completed', createdAt: new Date()\n      };\n      mockTransactions.push(transaction);\n      return res.json({ success: true, transaction, newBalance: user.balance, qrCode: "simulated_qr_data_swap" });`,
  `        userId, type: 'swap_sim', amount: cost, agency: provider, recipient: \`Swap \${phoneNumber} to ESIM (Pending)\`, fee: 0, status: 'pending', createdAt: new Date()\n      };\n      mockTransactions.push(transaction);\n      pendingAdminApprovals.push({\n          id: 'app_' + Date.now(),\n          type: 'esim_swap',\n          title: \`eSIM Swap Request: \${phoneNumber}\`,\n          desc: \`User \${user.name} requesting swap to \${provider} eSIM.\`,\n          status: 'pending',\n          date: Date.now(),\n          metadata: { userId, phoneNumber, provider, transactionId: transaction._id },\n          amount: cost\n      });\n      return res.json({ success: true, transaction, newBalance: user.balance, pendingApproval: true });`
);

content = content.replace(
  `    const transaction = new Transaction({\n      userId, type: 'swap_sim', amount: cost, agency: provider, recipient: \`Swap \${phoneNumber} to ESIM\`, fee: 0\n    });\n    await transaction.save();\n    \n    res.json({ success: true, transaction, newBalance: user.balance, qrCode: "simulated_qr_data_swap" });`,
  `    const transaction = new Transaction({\n      userId, type: 'swap_sim', amount: cost, agency: provider, recipient: \`Swap \${phoneNumber} to ESIM (Pending)\`, fee: 0, status: 'pending'\n    });\n    await transaction.save();\n    \n    await AdminApproval.create({\n        type: 'esim_swap',\n        title: \`eSIM Swap Request: \${phoneNumber}\`,\n        desc: \`User \${user.name} requesting swap to \${provider} eSIM.\`,\n        amount: cost,\n        metadata: { userId, phoneNumber, provider, transactionId: transaction._id }\n    });\n\n    res.json({ success: true, transaction, newBalance: user.balance, pendingApproval: true });`
);

fs.writeFileSync('server.ts', content);
