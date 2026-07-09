import fs from 'fs';

const code = fs.readFileSync('src/pages/Settings.tsx', 'utf-8');

// I need to add state for oldPin, newPin, and a function to handle the update.
// Find the imports to add `useState` if it's missing (it usually isn't, but let's check).
let newCode = code;

if (!newCode.includes('useState')) {
    newCode = newCode.replace('import React from', 'import React, { useState } from');
} else if (!newCode.match(/import\s+.*?useState.*?\s+from/)) {
    newCode = newCode.replace("import React,", "import React, { useState },");
}

// Add state variables inside the component
const stateVars = `
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [pinMessage, setPinMessage] = useState({ type: "", text: "" });

  const handleUpdatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinMessage({ type: "", text: "" });
    if (!oldPin || !newPin) {
      setPinMessage({ type: "error", text: "Please enter both old and new PIN." });
      return;
    }
    if (!/^\d{5}$/.test(newPin)) {
      setPinMessage({ type: "error", text: "New PIN must be exactly 5 digits." });
      return;
    }
    
    try {
      const res = await fetch(\`/api/user/\${user._id}/update-pin\`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPin, newPin })
      });
      const data = await res.json();
      if (res.ok) {
        setPinMessage({ type: "success", text: "PIN updated successfully." });
        setOldPin("");
        setNewPin("");
      } else {
        setPinMessage({ type: "error", text: data.error || "Failed to update PIN." });
      }
    } catch (err) {
      setPinMessage({ type: "error", text: "Network error." });
    }
  };
`;

// Insert after `const { t, i18n } = useTranslation();`
newCode = newCode.replace('const { t, i18n } = useTranslation();', 'const { t, i18n } = useTranslation();\n' + stateVars);

// Add the UI section before `<div className="space-y-2">\n          <h3 className="text-sm font-bold text-gray-500` for Theme.
const pinUI = `
        {user && ['user', 'merchant', 'agent'].includes(user.role) && (
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2">
              {t("Security")}
            </h3>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
              <h4 className="font-bold text-gray-900 dark:text-white mb-2">Change PIN</h4>
              <form onSubmit={handleUpdatePin} className="space-y-3">
                {pinMessage.text && (
                  <div className={\`p-2 text-sm rounded-lg \${pinMessage.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}\`}>
                    {pinMessage.text}
                  </div>
                )}
                <div>
                  <input
                    type="password"
                    placeholder="Old PIN"
                    value={oldPin}
                    onChange={(e) => setOldPin(e.target.value)}
                    maxLength={5}
                    className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <input
                    type="password"
                    placeholder="New PIN (5 digits)"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    maxLength={5}
                    className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-primary text-white font-bold rounded-xl px-4 py-3 hover:bg-primary-dark transition-colors"
                >
                  Update PIN
                </button>
              </form>
            </div>
          </div>
        )}
`;

newCode = newCode.replace('<div className="space-y-2">\n          <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2">\n            {t("Theme")}', pinUI + '\n        <div className="space-y-2">\n          <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2">\n            {t("Theme")}');

fs.writeFileSync('src/pages/Settings.tsx', newCode);
console.log("Settings.tsx patched.");
