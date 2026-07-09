const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/if \(useMockDb\) \{(\s*)mockTransactions\.push\(\s*\{ _id: String\(mockIdCounter\+\+\), userId: user\._id, type: 'pending_withdrawal', amount, agency: 'Agent', recipient: agent\.name, fee: totalFee, status: 'pending', merchantId: agent\._id, createdAt: new Date\(\) \}\s*\);\s*return res\.json\(\{ success: true, pending: true, message: "Withdrawal request created, awaiting your approval when cash is received\." \}\);\s*\}/g,
`if (useMockDb || user._id === 'user1' || agent._id === 'agent1') {
      mockTransactions.push(
        { _id: String(mockIdCounter++), userId: user._id, type: 'pending_withdrawal', amount, agency: 'Agent', recipient: agent.name, fee: totalFee, status: 'pending', merchantId: agent._id, createdAt: new Date() }
      );
      return res.json({ success: true, pending: true, message: "Withdrawal request created, awaiting your approval when cash is received." });
    }`);

fs.writeFileSync('server.ts', code);
