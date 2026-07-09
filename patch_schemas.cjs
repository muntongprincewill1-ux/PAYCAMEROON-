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

const adminTransactionLogSchema = new mongoose.Schema({
  title: String,
  desc: String,
  amount: Number,
  type: String,
  createdAt: { type: Date, default: Date.now }
});
const AdminTransactionLog = mongoose.model("AdminTransactionLog", adminTransactionLogSchema);
`;

code = code.replace('const Ticket = mongoose.model("Ticket", ticketSchema);', 'const Ticket = mongoose.model("Ticket", ticketSchema);\n' + approvalSchemaStr);

// Fix the Object ID string errors at line 3531 and 3553 (logAudit and notifyUser parameters)
code = code.replace(/logAudit\(officerId, 'Froze User Account', user\._id, \`Reason: \$\{reason\}\`\);/g, "logAudit(officerId, 'Froze User Account', user._id.toString(), `Reason: ${reason}`);");
code = code.replace(/notifyUser\(user\._id, 'Account Frozen'/g, "notifyUser(user._id.toString(), 'Account Frozen'");

code = code.replace(/logAudit\(officerId, 'Unfroze User Account', user\._id, \`Reason: \$\{reason\}\`\);/g, "logAudit(officerId, 'Unfroze User Account', user._id.toString(), `Reason: ${reason}`);");
code = code.replace(/notifyUser\(user\._id, 'Account Unfrozen'/g, "notifyUser(user._id.toString(), 'Account Unfrozen'");

fs.writeFileSync('server.ts', code);
