import fs from 'fs';

const code = fs.readFileSync('server.ts', 'utf-8');

const newRoute = `
app.post("/api/user/:id/update-pin", async (req, res) => {
    let { oldPin, newPin } = req.body;
    if(oldPin) oldPin = String(oldPin).trim();
    if(newPin) newPin = String(newPin).trim();
    
    if (!newPin || newPin.length !== 5 || !/^\\d{5}$/.test(newPin)) {
        return res.status(400).json({ error: "New PIN must be 5 digits" });
    }
    
    try {
        if (useMockDb) {
            const user = mockUsers.get(req.params.id);
            if (!user) return res.status(404).json({ error: "User not found" });
            if (user.pin !== oldPin) return res.status(400).json({ error: "Incorrect old PIN" });
            user.pin = newPin;
            res.json({ success: true });
        } else {
            const user = await User.findById(req.params.id);
            if (!user) return res.status(404).json({ error: "User not found" });
            if (user.pin !== oldPin) return res.status(400).json({ error: "Incorrect old PIN" });
            user.pin = newPin;
            await user.save();
            res.json({ success: true });
        }
    } catch (err) {
        res.status(500).json({ error: "Failed to update PIN" });
    }
});

app.post("/api/support/users/:id/pin", async (req, res) => {
    let { pin } = req.body;
    if(pin) pin = String(pin).trim();
    if (!pin || pin.length !== 5 || !/^\\d{5}$/.test(pin)) {
        return res.status(400).json({ error: "PIN must be 5 digits" });
    }
    try {
        if (useMockDb) {
            const user = mockUsers.get(req.params.id);
            if (!user) return res.status(404).json({ error: "User not found" });
            user.pin = pin;
            res.json({ success: true });
        } else {
            const user = await User.findById(req.params.id);
            if (!user) return res.status(404).json({ error: "User not found" });
            user.pin = pin;
            await user.save();
            res.json({ success: true });
        }
    } catch (err) {
        res.status(500).json({ error: "Failed to reset PIN" });
    }
});
`;

const insertIndex = code.indexOf('app.post("/api/admin/users/:id/pin"');
if (insertIndex === -1) {
    console.error("Could not find insertion point");
    process.exit(1);
}

const updatedCode = code.slice(0, insertIndex) + newRoute + "\n" + code.slice(insertIndex);
fs.writeFileSync('server.ts', updatedCode);
console.log("Patch applied.");
