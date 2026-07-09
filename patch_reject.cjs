const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const rejectEndpoint = `app.post("/api/user/reject-withdrawal", async (req, res) => {
  const { userId, transactionId } = req.body;
  try {
    let t = null;
    let isMockTx = false;

    if (useMockDb) {
      t = mockTransactions.find(tx => String(tx._id) === String(transactionId) && String(tx.userId) === String(userId));
      isMockTx = true;
    } else {
      t = await Transaction.findOne({ _id: transactionId, userId });
      if (!t) {
        t = mockTransactions.find(tx => String(tx._id) === String(transactionId) && String(tx.userId) === String(userId));
        if (t) isMockTx = true;
      }
    }

    if (!t || t.status !== 'pending' || t.type !== 'pending_withdrawal') {
      return res.status(404).json({ error: "Pending transaction not found" });
    }

    if (isMockTx) {
      t.status = 'rejected';
      return res.json({ success: true });
    }
    
    t.status = 'rejected';
    await t.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Rejection failed" });
  }
});`;

content = content.replace(
  `// User approves pending withdrawal`,
  rejectEndpoint + `\n\n// User approves pending withdrawal`
);

fs.writeFileSync('server.ts', content);
