const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const targetStats = `app.get("/api/compliance/stats", (req, res) => {
  const pendingKycCount = mockKycs.filter(k => k.status === 'pending').length;
  const flaggedTxCount = mockTransactions.filter(t => t.status === 'flagged').length;
  const blockedUserCount = Array.from(mockUsers.values()).filter(u => u.status?.startsWith('blocked')).length;
  res.json({ pendingKycCount, flaggedTxCount, blockedUserCount });
});`;

const replacementStats = `app.get("/api/compliance/stats", async (req, res) => {
  try {
    let pendingKycCount, flaggedTxCount, blockedUserCount;
    if (useMockDb) {
      pendingKycCount = mockKycs.filter(k => k.status === 'pending').length;
      flaggedTxCount = mockTransactions.filter(t => t.status === 'flagged').length;
      blockedUserCount = Array.from(mockUsers.values()).filter(u => u.status?.startsWith('blocked')).length;
    } else {
      pendingKycCount = await Kyc.countDocuments({ status: 'pending' });
      flaggedTxCount = await Transaction.countDocuments({ status: 'flagged' });
      blockedUserCount = await User.countDocuments({ status: { $regex: '^blocked' } });
    }
    res.json({ pendingKycCount, flaggedTxCount, blockedUserCount });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});`;

content = content.replace(targetStats, replacementStats);

fs.writeFileSync('server.ts', content);
