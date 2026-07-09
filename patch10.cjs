const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const newEndpoint = `
app.get("/api/finance/user-history/:paycamId", async (req, res) => {
  const { paycamId } = req.params;
  try {
    let targetUser;
    if (useMockDb) {
      targetUser = Array.from(mockUsers.values()).find((u) => u.paycamId === paycamId);
    } else {
      targetUser = await User.findOne({ paycamId });
    }

    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    let userTransactions = [];
    if (useMockDb) {
      userTransactions = mockTransactions.filter(
        (t) => String(t.userId) === String(targetUser._id) || String(t.recipient) === String(targetUser.phone) || String(t.merchantId) === String(targetUser._id)
      ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      userTransactions = await Transaction.find({
        $or: [
          { userId: targetUser._id },
          { recipient: targetUser.phone },
          { merchantId: targetUser._id }
        ]
      }).sort({ createdAt: -1 });
    }
    res.json({ transactions: userTransactions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user history' });
  }
});
`;

content = content.replace(
  'app.get("/api/finance/ledger", async (req, res) => {',
  newEndpoint + '\napp.get("/api/finance/ledger", async (req, res) => {'
);
fs.writeFileSync('server.ts', content);
console.log("Done");
