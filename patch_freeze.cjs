const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  /app\.post\("\/api\/compliance\/users\/:id\/freeze", \(req, res\) => \{[\s\S]*?res\.json\(\{ success: true, user \}\);\s*\}\);/,
  `app.post("/api/compliance/users/:id/freeze", async (req, res) => {
  const { officerId, reason } = req.body;
  if (useMockDb) {
    const user = mockUsers.get(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.role === 'admin') return res.status(403).json({ error: "Action not permitted on admin accounts" });
    user.status = 'blocked (frozen)';
    logAudit(officerId, 'Froze User Account', user._id, \`Reason: \${reason}\`);
    notifyUser(user._id, 'Account Frozen', \`Your account has been frozen by compliance. Reason: \${reason}\`);
    res.json({ success: true, user });
  } else {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.role === 'admin') return res.status(403).json({ error: "Action not permitted on admin accounts" });
    user.status = 'blocked (frozen)';
    await user.save();
    logAudit(officerId, 'Froze User Account', user._id, \`Reason: \${reason}\`);
    notifyUser(user._id, 'Account Frozen', \`Your account has been frozen by compliance. Reason: \${reason}\`);
    res.json({ success: true, user });
  }
});`
);

code = code.replace(
  /app\.post\("\/api\/compliance\/users\/:id\/unfreeze", \(req, res\) => \{[\s\S]*?res\.json\(\{ success: true, user \}\);\s*\}\);/,
  `app.post("/api/compliance/users/:id/unfreeze", async (req, res) => {
  const { officerId, reason } = req.body;
  if (useMockDb) {
    const user = mockUsers.get(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.role === 'admin') return res.status(403).json({ error: "Action not permitted on admin accounts" });
    user.status = 'active';
    logAudit(officerId, 'Unfroze User Account', user._id, \`Reason: \${reason}\`);
    notifyUser(user._id, 'Account Unfrozen', \`Your account has been unfrozen. Reason: \${reason}\`);
    res.json({ success: true, user });
  } else {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.role === 'admin') return res.status(403).json({ error: "Action not permitted on admin accounts" });
    user.status = 'active';
    await user.save();
    logAudit(officerId, 'Unfroze User Account', user._id, \`Reason: \${reason}\`);
    notifyUser(user._id, 'Account Unfrozen', \`Your account has been unfrozen. Reason: \${reason}\`);
    res.json({ success: true, user });
  }
});`
);

code = code.replace(
  /app\.post\("\/api\/compliance\/transactions\/:id\/resolve", \(req, res\) => \{[\s\S]*?\}\s*\}\);\s*\}\);/,
  `app.post("/api/compliance/transactions/:id/resolve", async (req, res) => {
  const { action } = req.body;
  if (useMockDb) {
    const tx = mockTransactions.find(t => t._id === req.params.id);
    if (!tx) return res.status(404).json({ error: "Transaction not found" });
    tx.status = action === 'approve' ? 'completed' : 'rejected';
    res.json({ success: true });
  } else {
    const tx = await Transaction.findById(req.params.id);
    if (!tx) return res.status(404).json({ error: "Transaction not found" });
    tx.status = action === 'approve' ? 'completed' : 'rejected';
    await tx.save();
    res.json({ success: true });
  }
});`
);

fs.writeFileSync('server.ts', code);
console.log("Patched freeze/unfreeze/txresolve");
