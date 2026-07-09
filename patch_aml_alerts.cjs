const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const amlAlertSchemaStr = `const amlAlertSchema = new mongoose.Schema({
  userId: String,
  ruleTriggered: String,
  severity: String,
  description: String,
  status: { type: String, default: 'open' },
  notes: String,
  createdAt: { type: Date, default: Date.now }
});
const AmlAlert = mongoose.model("AmlAlert", amlAlertSchema);
`;

if (!content.includes('const amlAlertSchema')) {
  content = content.replace('const floatRequestSchema =', amlAlertSchemaStr + '\nconst floatRequestSchema =');
}

// Replace mockAmlAlerts.unshift with dual logic
content = content.replace(/mockAmlAlerts\.unshift\(\{\s*_id:\s*[^,]+,\s*(.*?)\}\);/gs, (match, inner) => {
  return `if (useMockDb) {
    ${match}
  } else {
    AmlAlert.create({ ${inner} }).catch(console.error);
  }`;
});

const oldGetAml = `app.get("/api/compliance/aml-alerts", (req, res) => {
  res.json({ alerts: mockAmlAlerts });
});`;

const newGetAml = `app.get("/api/compliance/aml-alerts", async (req, res) => {
  if (useMockDb) {
    res.json({ alerts: mockAmlAlerts });
  } else {
    const alerts = await AmlAlert.find().sort({ createdAt: -1 }).limit(100);
    res.json({ alerts });
  }
});`;

content = content.replace(oldGetAml, newGetAml);

const oldResolveAml = `app.post("/api/compliance/aml-alerts/:id/resolve", (req, res) => {
  const { action, note, officerId } = req.body;
  const alert = mockAmlAlerts.find(a => a._id === req.params.id);
  if (!alert) return res.status(404).json({ error: "Alert not found" });`;

const newResolveAml = `app.post("/api/compliance/aml-alerts/:id/resolve", async (req, res) => {
  const { action, note, officerId } = req.body;
  
  let alert;
  if (useMockDb) {
    alert = mockAmlAlerts.find(a => a._id === req.params.id);
  } else {
    alert = await AmlAlert.findById(req.params.id);
  }
  
  if (!alert) return res.status(404).json({ error: "Alert not found" });`;

content = content.replace(oldResolveAml, newResolveAml);

const oldResolveLogic = `  if (action === 'reject') {
    const user = mockUsers.get(alert.userId);
    if (user) {
      user.status = 'blocked (frozen)';
      logAudit(officerId, 'Froze User Account', user._id, \`Reason: AML Alert Escalation\`);
      notifyUser(user._id, 'Account Frozen', \`Your account has been frozen due to suspicious activity (AML Alert).\`);
    }
  }`;

const newResolveLogic = `  if (action === 'reject') {
    let user;
    if (useMockDb) {
      user = mockUsers.get(alert.userId);
      if (user) user.status = 'blocked (frozen)';
    } else {
      user = await User.findById(alert.userId);
      if (user) {
        user.status = 'blocked (frozen)';
        await user.save();
      }
    }
    
    if (user) {
      logAudit(officerId, 'Froze User Account', user._id, \`Reason: AML Alert Escalation\`);
      notifyUser(user._id, 'Account Frozen', \`Your account has been frozen due to suspicious activity (AML Alert).\`);
    }
  }
  
  if (!useMockDb && alert.save) {
    await alert.save();
  }`;

content = content.replace(oldResolveLogic, newResolveLogic);


fs.writeFileSync('server.ts', content);
