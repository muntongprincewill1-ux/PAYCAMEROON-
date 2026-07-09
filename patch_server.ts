import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf-8');

const forgotPinCode = `
app.post("/api/auth/forgot-pin", async (req, res) => {
    let { phone, name, newPin } = req.body;
    
    if (!phone || !name || !newPin) {
        return res.status(400).json({ error: "Phone, name, and new PIN are required" });
    }
    
    if (newPin.length !== 5 || !/^\\d{5}$/.test(newPin)) {
        return res.status(400).json({ error: "PIN must be exactly 5 digits" });
    }
    
    try {
        let user;
        if (useMockDb) {
            // Find user by phone
            for (let [id, u] of mockUsers.entries()) {
                if (u.phone === phone) {
                    user = u;
                    break;
                }
            }
        } else {
            user = await User.findOne({ phone });
        }
        
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        
        // Check legal details (name)
        if (!user.name || user.name.toLowerCase() !== name.toLowerCase()) {
            return res.status(400).json({ error: "Details do not match our records" });
        }
        
        // Check balance
        if (user.balance > 25000) {
            return res.status(400).json({ error: "Your balance is above 25,000 XAF. For security reasons, please contact Support or Admin to reset your PIN." });
        }
        
        // Reset PIN
        if (useMockDb) {
            user.pin = newPin;
        } else {
            user.pin = newPin;
            await user.save();
        }
        
        res.json({ success: true, message: "PIN reset successfully" });
        
    } catch (err) {
        res.status(500).json({ error: "Failed to reset PIN" });
    }
});
`;

if (!content.includes('/api/auth/forgot-pin')) {
    const insertPoint = 'app.post("/api/auth/login", async (req, res) => {';
    content = content.replace(insertPoint, forgotPinCode + "\\n" + insertPoint);
    fs.writeFileSync('server.ts', content);
    console.log("server.ts patched");
} else {
    console.log("server.ts already patched");
}
