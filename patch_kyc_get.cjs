const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const targetGet = `app.get("/api/compliance/kyc", (req, res) => {
  res.json({ kycs: mockKycs });
});`;

const replacementGet = `app.get("/api/compliance/kyc", async (req, res) => {
  try {
    let kycs = [];
    if (useMockDb) {
      kycs = mockKycs;
    } else {
      kycs = await Kyc.find().sort({ submittedAt: -1 }).lean();
    }
    res.json({ kycs });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch KYC records" });
  }
});`;

content = content.replace(targetGet, replacementGet);

const targetResolve = `app.post("/api/compliance/kyc/:id/resolve", (req, res) => {
  const { status } = req.body;
  const kyc = mockKycs.find(k => k._id === req.params.id);
  if (!kyc) return res.status(404).json({ error: "KYC not found" });
  kyc.status = status;
  kyc.reviewedAt = new Date();
  
  if (status === 'approved') {
    const user = mockUsers.get(kyc.userId);
    if (user) user.kycStatus = 'approved';
    notifyUser(kyc.userId, 'KYC Approved', 'Your KYC documentation has been approved.');
  } else {
    notifyUser(kyc.userId, 'KYC Rejected', 'Your KYC documentation was rejected. Please re-submit.');
  }
  
  logAudit(req.body.officerId || 'system', 'Resolved KYC Form', kyc._id, \`Status: \${status}\`);
  res.json({ success: true, kyc });
});`;

const replacementResolve = `app.post("/api/compliance/kyc/:id/resolve", async (req, res) => {
  try {
    const { status } = req.body;
    let kyc;
    
    if (useMockDb) {
      kyc = mockKycs.find(k => k._id === req.params.id);
      if (!kyc) return res.status(404).json({ error: "KYC not found" });
      kyc.status = status;
      kyc.reviewedAt = new Date();
      
      const user = mockUsers.get(kyc.userId);
      if (user) user.kycVerified = (status === 'approved');
      
    } else {
      kyc = await Kyc.findById(req.params.id);
      if (!kyc) return res.status(404).json({ error: "KYC not found" });
      kyc.status = status;
      kyc.reviewedAt = new Date();
      await kyc.save();
      
      const user = await User.findById(kyc.userId);
      if (user) {
        user.kycVerified = (status === 'approved');
        await user.save();
      }
    }
    
    if (status === 'approved') {
      notifyUser(kyc.userId, 'KYC Approved', 'Your KYC documentation has been approved.');
    } else {
      notifyUser(kyc.userId, 'KYC Rejected', 'Your KYC documentation was rejected. Please re-submit.');
    }
    
    logAudit(req.body.officerId || 'system', 'Resolved KYC Form', kyc._id, \`Status: \${status}\`);
    res.json({ success: true, kyc });
  } catch (error) {
    res.status(500).json({ error: "Failed to resolve KYC" });
  }
});`;

content = content.replace(targetResolve, replacementResolve);

fs.writeFileSync('server.ts', content);
