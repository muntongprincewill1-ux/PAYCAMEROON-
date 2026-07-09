const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const getEndpoint = `app.get("/api/admin/users", async (req, res) => {
    try {
        let usersList = [];
        if (useMockDb) {
            usersList = Array.from(mockUsers.values());
        } else {
            usersList = await User.find().select('-pin');
        }
        res.json({ users: usersList });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch users" });
    }
});\n\n`;

code = code.replace(
  `app.post("/api/admin/users", async (req, res) => {`,
  getEndpoint + `app.post("/api/admin/users", async (req, res) => {`
);

fs.writeFileSync('server.ts', code);
console.log("Patched admin users GET endpoint");
