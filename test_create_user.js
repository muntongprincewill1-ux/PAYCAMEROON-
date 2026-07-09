import fs from 'fs';

async function test() {
    try {
        const res = await fetch('http://localhost:3000/api/admin/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Test User', phone: '123456789', pin: '12345', role: 'user' })
        });
        const text = await res.text();
        console.log("Status:", res.status);
        console.log("Body:", text.substring(0, 500));
    } catch(e) {
        console.log("Fetch error:", e);
    }
}
test();
