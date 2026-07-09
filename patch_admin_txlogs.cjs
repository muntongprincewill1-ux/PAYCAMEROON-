const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const txLogSchemaStr = `
const adminTransactionLogSchema = new mongoose.Schema({
  title: String,
  desc: String,
  amount: Number,
  type: String,
  createdAt: { type: Date, default: Date.now }
});
const AdminTransactionLog = mongoose.model("AdminTransactionLog", adminTransactionLogSchema);
`;

if (!code.includes('const AdminTransactionLog = mongoose.model("AdminTransactionLog"')) {
  code = code.replace(/const AdminApproval = mongoose\.model\("AdminApproval", adminApprovalSchema\);/, 'const AdminApproval = mongoose.model("AdminApproval", adminApprovalSchema);\n' + txLogSchemaStr);
}

// GET txlogs
code = code.replace(
  /app\.get\("\/api\/admin\/txlogs", \(req, res\) => \{\s*res\.json\(\{ logs: transactionLogs \}\);\s*\}\);/,
  `app.get("/api/admin/txlogs", async (req, res) => {
  if (useMockDb) {
    res.json({ logs: transactionLogs });
  } else {
    const logs = await AdminTransactionLog.find().sort({ createdAt: -1 }).limit(100);
    // map _id to id and createdAt to date
    const mappedLogs = logs.map(l => ({ ...l.toObject(), id: l._id, date: l.createdAt }));
    res.json({ logs: mappedLogs });
  }
});`
);

// POST push log
code = code.replace(
  /transactionLogs\.unshift\(\{[\s\S]*?id: 'LOG_' \+ Date\.now\(\),[\s\S]*?date: new Date\(\),[\s\S]*?title: approval\.title \|\| 'Merchant Registration',[\s\S]*?desc: approval\.desc \|\| 'Merchant account approved',[\s\S]*?amount: approval\.amount \|\| 0,[\s\S]*?type: approval\.type[\s\S]*?\}\);/,
  `if (useMockDb) {
      transactionLogs.unshift({
        id: 'LOG_' + Date.now(),
        date: new Date(),
        title: approval.title || 'Merchant Registration',
        desc: approval.desc || 'Merchant account approved',
        amount: approval.amount || 0,
        type: approval.type
      });
    } else {
      await AdminTransactionLog.create({
        title: approval.title || 'Merchant Registration',
        desc: approval.desc || 'Merchant account approved',
        amount: approval.amount || 0,
        type: approval.type
      });
    }`
);

fs.writeFileSync('server.ts', code);
console.log("Patched admin txlogs successfully!");
