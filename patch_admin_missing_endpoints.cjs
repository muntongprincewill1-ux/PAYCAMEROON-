const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const missingEndpoints = `
app.get("/api/admin/approvals", async (req, res) => {
    try {
        let approvalsList = [];
        if (useMockDb) {
            approvalsList = mockApprovals;
        } else {
            approvalsList = await Approval.find({ status: 'pending' });
        }
        res.json({ approvals: approvalsList });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch approvals" });
    }
});

let supportCategories = [
    { id: '1', name: 'App Usage', description: 'Questions about using the app features', active: true },
    { id: '2', name: 'Transaction Issues', description: 'Missing deposits, failed withdrawals, incorrect amounts', active: true },
    { id: '3', name: 'Account Security', description: 'Suspicious activity, lost phone, locked account', active: true },
    { id: '4', name: 'KYC/Limits', description: 'Document verification, limit upgrades', active: true }
];

app.get("/api/admin/support/categories", (req, res) => {
    res.json({ categories: supportCategories });
});

app.post("/api/admin/support/categories", (req, res) => {
    const { categories } = req.body;
    if (categories) {
        supportCategories = categories;
    }
    res.json({ success: true, categories: supportCategories });
});

`;

code = code.replace(
  `app.get("/api/admin/txlogs", async (req, res) => {`,
  missingEndpoints + `app.get("/api/admin/txlogs", async (req, res) => {`
);

fs.writeFileSync('server.ts', code);
console.log("Patched missing admin endpoints");
