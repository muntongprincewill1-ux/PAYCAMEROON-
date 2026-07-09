const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Patch merchant registration
code = code.replace(
  /pendingAdminApprovals\.push\(\{[\s\S]*?id: String\(Date\.now\(\)\),[\s\S]*?type: 'merchant_registration',[\s\S]*?requestedBy: (user\._id(?:\.toString\(\))?),[\s\S]*?title: `Merchant Registration: \$\{businessName\}`,[\s\S]*?desc: `Phone: \$\{phone\}`,[\s\S]*?status: 'pending',[\s\S]*?date: Date\.now\(\),[\s\S]*?metadata: \{ user \}[\s\S]*?\}\);/g,
  `if (useMockDb) {
      pendingAdminApprovals.push({
          id: String(Date.now()),
          type: 'merchant_registration',
          requestedBy: $1,
          title: \`Merchant Registration: \${businessName}\`,
          desc: \`Phone: \${phone}\`,
          status: 'pending',
          date: Date.now(),
          metadata: { user }
      });
    } else {
      await AdminApproval.create({
          type: 'merchant_registration',
          title: \`Merchant Registration: \${businessName}\`,
          desc: \`Phone: \${phone}\`,
          status: 'pending',
          metadata: { user }
      });
    }`
);

// Patch /api/finance/request-approval
code = code.replace(
  /app\.post\("\/api\/finance\/request-approval", \(req, res\) => \{[\s\S]*?const \{ type, title, desc, amount, metadata \} = req\.body;[\s\S]*?pendingAdminApprovals\.unshift\(\{[\s\S]*?id: 'app_' \+ Date\.now\(\),[\s\S]*?type, title, desc, amount: amount \|\| 0,[\s\S]*?status: 'pending', date: Date\.now\(\),[\s\S]*?metadata[\s\S]*?\}\);[\s\S]*?res\.json\(\{ success: true \}\);[\s\S]*?\}\);/,
  `app.post("/api/finance/request-approval", async (req, res) => {
    const { type, title, desc, amount, metadata } = req.body;
    if (useMockDb) {
      pendingAdminApprovals.unshift({
          id: 'app_' + Date.now(),
          type, title, desc, amount: amount || 0,
          status: 'pending', date: Date.now(),
          metadata
      });
      res.json({ success: true });
    } else {
      await AdminApproval.create({
          type, title, desc, amount: amount || 0, metadata
      });
      res.json({ success: true });
    }
});`
);

// Patch /api/admin/approvals/:id/approve
code = code.replace(
  /app\.post\("\/api\/admin\/approvals\/:id\/approve", async \(req, res\) => \{[\s\S]*?const approval = pendingAdminApprovals\.find\(a => a\.id === req\.params\.id\);/g,
  `app.post("/api/admin/approvals/:id/approve", async (req, res) => {
    let approval;
    if (useMockDb) {
        approval = pendingAdminApprovals.find(a => a.id === req.params.id);
    } else {
        approval = await AdminApproval.findById(req.params.id);
        if(approval) approval.id = approval._id.toString();
    }`
);

// Patch /api/admin/approvals/:id/reject
code = code.replace(
  /app\.post\("\/api\/admin\/approvals\/:id\/reject", async \(req, res\) => \{[\s\S]*?const approval = pendingAdminApprovals\.find\(a => a\.id === req\.params\.id\);/g,
  `app.post("/api/admin/approvals/:id/reject", async (req, res) => {
    let approval;
    if (useMockDb) {
        approval = pendingAdminApprovals.find(a => a.id === req.params.id);
    } else {
        approval = await AdminApproval.findById(req.params.id);
        if(approval) approval.id = approval._id.toString();
    }`
);

// We need to also patch the saving logic in approve/reject
code = code.replace(
  /approval\.status = 'approved';/g,
  `approval.status = 'approved';\n    if (!useMockDb && typeof approval.save === 'function') await approval.save();`
);

code = code.replace(
  /approval\.status = 'rejected';/g,
  `approval.status = 'rejected';\n    if (!useMockDb && typeof approval.save === 'function') await approval.save();`
);

fs.writeFileSync('server.ts', code);
console.log("Patched admin approvals push successfully!");
