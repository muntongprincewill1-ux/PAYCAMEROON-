import fs from 'fs';

async function testAll() {
    const endpoints = [
        '/api/admin/stats',
        '/api/admin/approvals',
        '/api/admin/users',
        '/api/admin/logs',
        '/api/admin/ledger'
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
