import fs from 'fs';

const code = fs.readFileSync('src/pages/SupportDashboard.tsx', 'utf-8');

// Add resetPinModal state
let newCode = code.replace(
  "const [unblockModalOpen, setUnblockModalOpen] = useState(false);",
  "const [unblockModalOpen, setUnblockModalOpen] = useState(false);\n  const [resetPinModal, setResetPinModal] = useState({ isOpen: false, newPin: '' });"
);

// Add reset PIN handler
const resetPinHandler = `
  const handleResetPin = async () => {
    if (!searchedUser) return;
    if (!/^\\d{5}$/.test(resetPinModal.newPin)) {
      alert("PIN must be exactly 5 digits.");
      return;
    }
    
    try {
      const res = await fetch(\`/api/support/users/\${searchedUser._id}/pin\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: resetPinModal.newPin })
      });
      if (res.ok) {
        alert("PIN successfully reset.");
        setResetPinModal({ isOpen: false, newPin: '' });
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to reset PIN');
      }
    } catch (e) {
      alert('Network error');
    }
  };
`;

newCode = newCode.replace(
  "const handleUnblockUser = () => {",
  resetPinHandler + "\n\n  const handleUnblockUser = () => {"
);

// Add the Reset PIN button in the UI (only for Level 2 or 3 support)
const resetPinButton = `
                               {JSON.parse(localStorage.getItem('user') || '{}').level >= 2 && (
                                   <button onClick={() => setResetPinModal({ isOpen: true, newPin: '' })} className="text-[10px] flex-1 py-1.5 bg-blue-50 text-blue-600 font-bold uppercase rounded hover:bg-blue-100 transition-colors">
                                     Reset PIN
                                   </button>
                               )}
`;

newCode = newCode.replace(
  "{JSON.parse(localStorage.getItem('user') || '{}').level >= 3 && (",
  resetPinButton + "\n                               {JSON.parse(localStorage.getItem('user') || '{}').level >= 3 && ("
);

// Add the Reset PIN modal
const resetPinModalUI = `
      {resetPinModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-2">Reset PIN</h3>
            <p className="text-sm text-gray-500 mb-4">Enter a new 5-digit PIN for {searchedUser?.name}</p>
            <input
               type="text"
               maxLength={5}
               value={resetPinModal.newPin}
               onChange={(e) => setResetPinModal({...resetPinModal, newPin: e.target.value})}
               placeholder="12345"
               className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 mb-4 focus:ring-2 focus:ring-primary"
            />
            <div className="flex gap-2">
              <button onClick={() => setResetPinModal({ isOpen: false, newPin: '' })} className="flex-1 py-2 bg-gray-100 rounded-xl font-bold">Cancel</button>
              <button onClick={handleResetPin} className="flex-1 py-2 bg-blue-600 text-white rounded-xl font-bold">Reset</button>
            </div>
          </div>
        </div>
      )}
`;

newCode = newCode.replace(
  "{unblockModalOpen && (",
  resetPinModalUI + "\n\n      {unblockModalOpen && ("
);

fs.writeFileSync('src/pages/SupportDashboard.tsx', newCode);
console.log("SupportDashboard.tsx patched.");
