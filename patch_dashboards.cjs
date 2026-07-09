const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf8');

// 1. Add missing schemas
const schemasToAdd = `
const ticketSchema = new mongoose.Schema({
  userId: String,
  subject: String,
  description: String,
  status: { type: String, default: 'open' },
  requiredLevel: Number,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
const Ticket = mongoose.model("Ticket", ticketSchema);

const auditLogSchema = new mongoose.Schema({
  officerId: String,
  action: String,
  targetId: String,
  details: String,
  createdAt: { type: Date, default: Date.now }
});
const AuditLog = mongoose.model("AuditLog", auditLogSchema);

const agentLogSchema = new mongoose.Schema({
  agentId: String,
  action: String,
  location: String,
  status: String,
  createdAt: { type: Date, default: Date.now }
});
const AgentLog = mongoose.model("AgentLog", agentLogSchema);

const bankAccountSchema = new mongoose.Schema({
  name: String,
  type: String,
  accountNumber: String,
  balance: { type: Number, default: 0 },
  status: { type: String, default: 'Active' },
  updatedAt: { type: Date, default: Date.now }
});
const BankAccount = mongoose.model("BankAccount", bankAccountSchema);

const internalWalletSchema = new mongoose.Schema({
  name: String,
  balance: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now }
});
const InternalWallet = mongoose.model("InternalWallet", internalWalletSchema);

const treasuryTxSchema = new mongoose.Schema({
  type: String,
  amount: Number,
  bank: String,
  accountId: String,
  status: String,
  createdAt: { type: Date, default: Date.now }
});
const TreasuryTx = mongoose.model("TreasuryTx", treasuryTxSchema);
`;

if (!code.includes('const Ticket = mongoose.model("Ticket", ticketSchema);')) {
  code = code.replace(/const Settings = mongoose.model\("Settings", settingsSchema\);/, 'const Settings = mongoose.model("Settings", settingsSchema);\n' + schemasToAdd);
}

// 2. Patch Finance Treasury
code = code.replace(
  /app\.get\("\/api\/finance\/treasury", \(req, res\) => \{\s*res\.json\(\{ \s*balance: platformTreasuryBalance, \s*transactions: treasuryTx,\s*bankAccounts: bankAccountsData,\s*internalWallets: internalWalletsData\s*\}\);\s*\}\);/,
  `app.get("/api/finance/treasury", async (req, res) => {
  try {
    if (useMockDb) {
      res.json({ 
          balance: platformTreasuryBalance, 
          transactions: treasuryTx,
          bankAccounts: bankAccountsData,
          internalWallets: internalWalletsData
      });
    } else {
      const bankAccounts = await BankAccount.find();
      const internalWallets = await InternalWallet.find();
      const transactions = await TreasuryTx.find().sort({ createdAt: -1 }).limit(100);
      const balance = internalWallets.reduce((acc, w) => acc + (w.balance || 0), 0);
      res.json({ balance, transactions, bankAccounts, internalWallets });
    }
  } catch(error) { res.status(500).json({error: "Failed to load treasury"}); }
});`
);

// 3. Patch Compliance flagged transactions
code = code.replace(
  /app\.get\("\/api\/compliance\/transactions\/flagged", \(req, res\) => \{\s*res\.json\(\{ transactions: mockTransactions\.filter\(t => t\.status === 'flagged'\) \}\);\s*\}\);/,
  `app.get("/api/compliance/transactions/flagged", async (req, res) => {
  if (useMockDb) {
    res.json({ transactions: mockTransactions.filter(t => t.status === 'flagged') });
  } else {
    const transactions = await Transaction.find({ status: 'flagged' });
    res.json({ transactions });
  }
});`
);

// 4. Patch Compliance Audit Logs
code = code.replace(
  /app\.get\("\/api\/compliance\/audit-logs", \(req, res\) => \{\s*res\.json\(\{ logs: mockAuditLogs \}\);\s*\}\);/,
  `app.get("/api/compliance/audit-logs", async (req, res) => {
  if (useMockDb) {
    res.json({ logs: mockAuditLogs });
  } else {
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(100);
    res.json({ logs });
  }
});`
);

// 5. Patch Compliance Agent Logs
code = code.replace(
  /app\.get\("\/api\/compliance\/agent-logs", \(req, res\) => \{\s*res\.json\(\{ logs: mockAgentLogs \}\);\s*\}\);/,
  `app.get("/api/compliance/agent-logs", async (req, res) => {
  if (useMockDb) {
    res.json({ logs: mockAgentLogs });
  } else {
    const logs = await AgentLog.find().sort({ createdAt: -1 }).limit(100);
    res.json({ logs });
  }
});`
);

// 6. Patch Compliance Users
code = code.replace(
  /app\.get\("\/api\/compliance\/users", \(req, res\) => \{\s*const users = Array\.from\(mockUsers\.values\(\)\)\.filter\(\(u: any\) => u\.role !== 'admin'\);\s*res\.json\(\{ users \}\);\s*\}\);/,
  `app.get("/api/compliance/users", async (req, res) => {
  if (useMockDb) {
    const users = Array.from(mockUsers.values()).filter((u: any) => u.role !== 'admin');
    res.json({ users });
  } else {
    const users = await User.find({ role: { $ne: 'admin' } });
    res.json({ users });
  }
});`
);

// 7. Patch Support Tickets GET
code = code.replace(
  /app\.get\("\/api\/support\/tickets", \(req, res\) => \{\s*const \{ userLevel \} = req\.query;\s*let tickets = mockTickets;\s*if \(userLevel\) \{\s*tickets = mockTickets\.filter\(t => t\.requiredLevel === Number\(userLevel\)\);\s*\}\s*res\.json\(\{ tickets \}\);\s*\}\);/,
  `app.get("/api/support/tickets", async (req, res) => {
  const { userLevel } = req.query;
  if (useMockDb) {
    let tickets = mockTickets;
    if (userLevel) {
      tickets = mockTickets.filter(t => t.requiredLevel === Number(userLevel));
    }
    res.json({ tickets });
  } else {
    let query = {};
    if (userLevel) query = { requiredLevel: Number(userLevel) };
    const tickets = await Ticket.find(query).sort({ createdAt: -1 });
    res.json({ tickets });
  }
});`
);

// 8. Support Tickets POST create
code = code.replace(
  /app\.post\("\/api\/support\/tickets", async \(req, res\) => \{\s*try \{\s*const \{ userId, subject, description, priority \} = req\.body;\s*const ticket = \{\s*_id: String\(mockTicketIdCounter\+\+\),\s*userId,\s*subject,\s*description,\s*priority,\s*status: 'open',\s*requiredLevel: 1,\s*createdAt: new Date\(\)\s*\};\s*mockTickets\.push\(ticket\);\s*res\.json\(\{ success: true, ticket \}\);\s*\} catch \(error\) \{\s*res\.status\(500\)\.json\(\{ error: "Failed to create ticket" \}\);\s*\}\s*\}\);/,
  `app.post("/api/support/tickets", async (req, res) => {
  try {
    const { userId, subject, description, priority } = req.body;
    if (useMockDb) {
      const ticket = {
        _id: String(mockTicketIdCounter++),
        userId,
        subject,
        description,
        priority,
        status: 'open',
        requiredLevel: 1,
        createdAt: new Date()
      };
      mockTickets.push(ticket);
      res.json({ success: true, ticket });
    } else {
      const ticket = await Ticket.create({
        userId, subject, description, priority, status: 'open', requiredLevel: 1
      });
      res.json({ success: true, ticket });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to create ticket" });
  }
});`
);

// 9. Support Tickets GET user tickets
code = code.replace(
  /app\.get\("\/api\/support\/tickets\/user\/:userId", \(req, res\) => \{\s*res\.json\(\{ tickets: mockTickets\.filter\(t => t\.userId === req\.params\.userId\) \}\);\s*\}\);/,
  `app.get("/api/support/tickets/user/:userId", async (req, res) => {
  if (useMockDb) {
    res.json({ tickets: mockTickets.filter(t => t.userId === req.params.userId) });
  } else {
    const tickets = await Ticket.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json({ tickets });
  }
});`
);

fs.writeFileSync('server.ts', code);
console.log("Patched endpoints successfully!");
