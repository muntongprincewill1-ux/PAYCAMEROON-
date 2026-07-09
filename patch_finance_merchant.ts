import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf-8');

const merchantWithdrawEndpoint = `
app.post("/api/finance/merchant/withdraw", async (req, res) => {
  const { paycamId, amount } = req.body;
  if (!paycamId || amount <= 0) return res.status(400).json({ error: "Invalid data" });
  
  const searchPaycam = String(paycamId).trim().toUpperCase();
  const merchant = useMockDb ? Array.from(mockUsers.values()).find(u => u.paycamId === searchPaycam && u.role === 'merchant') : await User.findOne({ paycamId: searchPaycam, role: 'merchant' });
  
  if (!merchant) return res.status(404).json({ error: "Merchant not found" });
  if (merchant.balance < amount) return res.status(400).json({ error: "Insufficient merchant balance" });

  merchant.balance -= amount;
  
  if (useMockDb) {
      mockTransactions.unshift({
        _id: \`tx_\${Date.now()}_\${mockIdCounter++}\`,
        userId: merchant._id,
        type: 'merchant_finance_withdrawal',
        amount: amount,
        agency: 'Finance',
        recipient: 'Finance System',
        fee: 0,
        status: 'completed',
        createdAt: new Date()
      });
  } else {
      await merchant.save();
      const tx = new Transaction({
        userId: merchant._id,
        type: 'merchant_finance_withdrawal',
        amount: amount,
        agency: 'Finance',
        recipient: 'Finance System',
        fee: 0,
        status: 'completed'
      });
      await tx.save();
  }
  
  res.json({ success: true, message: "Withdrew from merchant successfully" });
});
`;

content = content.replace(
  'app.post("/api/finance/float/send", async (req, res) => {',
  merchantWithdrawEndpoint + '\napp.post("/api/finance/float/send", async (req, res) => {'
);

fs.writeFileSync('server.ts', content);
console.log('Finance merchant withdraw endpoint added.');
