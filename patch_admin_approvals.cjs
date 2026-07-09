const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const approvalSchemaStr = `
const adminApprovalSchema = new mongoose.Schema({
  type: String,
  title: String,
  desc: String,
  amount: Number,
  metadata: mongoose.Schema.Types.Mixed,
  status: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  approvedAt: Date,
  approvedBy: String
});
const AdminApproval = mongoose.model("AdminApproval", adminApprovalSchema);
`;

if (!code.includes('const AdminApproval = mongoose.model("AdminApproval"')) {
  code = code.replace(/const Ticket = mongoose.model\("Ticket", ticketSchema\);/, 'const Ticket = mongoose.model("Ticket", ticketSchema);\n' + approvalSchemaStr);
}

// GET approvals
code = code.replace(
  /app\.get\("\/api\/admin\/approvals", \(req, res\) => \{\s*res\.json\(\{ approvals: pendingAdminApprovals\.filter\(a => a\.status === 'pending'\) \}\);\s*\}\);/,
  `app.get("/api/admin/approvals", async (req, res) => {
  if (useMockDb) {
    res.json({ approvals: pendingAdminApprovals.filter(a => a.status === 'pending') });
  } else {
    const approvals = await AdminApproval.find({ status: 'pending' }).sort({ createdAt: -1 });
    // Map _id to id for frontend compatibility
    const mappedApprovals = approvals.map(a => ({ ...a.toObject(), id: a._id }));
    res.json({ approvals: mappedApprovals });
  }
});`
);

// POST request approval (generic helper or endpoints)
code = code.replace(
  /pendingAdminApprovals\.push\(\{/g,
  `if(useMockDb) { pendingAdminApprovals.push({`
);
// This is too risky with regex, I'll write a better one.
