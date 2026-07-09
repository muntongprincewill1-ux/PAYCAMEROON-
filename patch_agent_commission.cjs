const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const newEndpoint = `
app.post("/api/agent/withdraw-commission", async (req, res) => {
  const { agentId, amount, method, destination } = req.body;
  try {
    let agent = useMockDb ? mockUsers.get(agentId) : await User.findById(agentId).catch(() => null);
    
    // Demo fallback
    if (!agent && agentId === 'agent1') {
      agent = { _id: 'agent1', paycamId: 'AG11111111', name: 'Demo Agent', phone: '111111111', role: 'agent', balance: 500000, commissionBalance: 0 };
      if (useMockDb) mockUsers.set('agent1', agent);
    }
    
    if (!agent || agent.role !== 'agent') return res.status(401).json({ error: "Unauthorized" });

    if (agent.commissionBalance < amount) return res.status(400).json({ error: "Insufficient commission balance" });

    // Handle Mobile Money via Campay
    if (method === 'mtn' || method === 'orange') {
      try {
         await campayWithdraw(amount, destination, "paycam-comm-" + Date.now());
      } catch (e: any) {
         return res.status(400).json({ error: "Mobile Money withdrawal failed: " + e.message });
      }
    }

    agent.commissionBalance -= amount;
    
    if (method === 'paycam_balance') {
      agent.balance = (agent.balance || 0) + amount;
      notifyUser(agent._id.toString(), 'Commission Transfer', \`You transferred \${amount.toLocaleString()} XAF from commissions to your main balance.\`);
    } else {
      notifyUser(agent._id.toString(), 'Commission Withdrawal', \`You withdrew \${amount.toLocaleString()} XAF from commissions to \${method} (\${destination}).\`);
    }

    if (useMockDb || agentId === 'agent1') {
      mockTransactions.push({
        _id: String(mockIdCounter++), userId: agent._id, type: 'commission_withdrawal', amount, agency: method, recipient: destination || 'Self Balance', fee: 0, status: 'completed', createdAt: new Date()
      });
      return res.json({ success: true, newCommissionBalance: agent.commissionBalance, newBalance: agent.balance });
    }

    await agent.save();

    await Transaction.create({
      userId: agent._id, type: 'commission_withdrawal', amount, agency: method, recipient: destination || 'Self Balance', fee: 0
    });

    res.json({ success: true, newCommissionBalance: agent.commissionBalance, newBalance: agent.balance });
  } catch (error) {
    res.status(500).json({ error: "Commission withdrawal failed" });
  }
});
`;

if (!code.includes('app.post("/api/agent/withdraw-commission"')) {
  code = code.replace(/app\.get\("\/api\/agent\/stats"\,/, newEndpoint + '\napp.get("/api/agent/stats",');
  fs.writeFileSync('server.ts', code);
  console.log("Patched server.ts with /api/agent/withdraw-commission");
} else {
  console.log("Already patched");
}
