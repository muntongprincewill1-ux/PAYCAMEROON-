import fs from 'fs';

async function testAll() {
    const endpoints = [
        '/api/admin/stats',
        '/api/admin/approvals',
        '/api/admin/txlogs',
        '/api/compliance/aml-alerts',
        '/api/compliance/agent-logs',
        '/api/admin/users',
        '/api/finance/ledger'
    ];
    for (const ep of endpoints) {
        try {
            const res = await fetch('http://localhost:3000' + ep);
            const text = await res.text();
            console.log(ep, res.status, text.startsWith('<') ? "HTML" : "JSON or other");
        } catch(e) {
            console.log(ep, "Fetch error:", e.message);
        }
    }
}
testAll();
