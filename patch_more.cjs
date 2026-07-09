const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Patch AML Alerts
code = code.replace(
  /app\.get\("\/api\/compliance\/aml-alerts", async \(req, res\) => \{\s*if \(useMockDb\) \{\s*res\.json\(\{ alerts: mockAmlAlerts \}\);\s*\} else \{\s*const alerts = await AmlAlert\.find\(\)\.sort\(\{ createdAt: -1 \}\)\.limit\(100\);\s*res\.json\(\{ alerts \}\);\s*\}\s*\}\);/,
  `app.get("/api/compliance/aml-alerts", async (req, res) => {
  if (useMockDb) {
    res.json({ alerts: mockAmlAlerts });
  } else {
    const alerts = await AmlAlert.find().sort({ createdAt: -1 }).limit(100);
    res.json({ alerts });
  }
});`
);

// Patch Ticket Resolve
code = code.replace(
  /app\.post\("\/api\/support\/tickets\/:ticketId\/resolve", \(req, res\) => \{\s*const ticket = mockTickets\.find\(t => t\._id === req\.params\.ticketId\);\s*if \(!ticket\) return res\.status\(404\)\.json\(\{ error: "Ticket not found" \}\);\s*ticket\.status = 'resolved';\s*res\.json\(\{ success: true \}\);\s*\}\);/,
  `app.post("/api/support/tickets/:ticketId/resolve", async (req, res) => {
  if (useMockDb) {
    const ticket = mockTickets.find(t => t._id === req.params.ticketId);
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });
    ticket.status = 'resolved';
    res.json({ success: true });
  } else {
    const ticket = await Ticket.findByIdAndUpdate(req.params.ticketId, { status: 'resolved' });
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });
    res.json({ success: true });
  }
});`
);

fs.writeFileSync('server.ts', code);
console.log("Patched more successfully!");
