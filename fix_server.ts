import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf-8');
content = content.replace('}\\napp.post("/api/auth/login", async (req, res) => {', '}\napp.post("/api/auth/login", async (req, res) => {');
fs.writeFileSync('server.ts', content);
