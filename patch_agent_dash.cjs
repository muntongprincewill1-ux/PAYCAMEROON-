const fs = require('fs');
let code = fs.readFileSync('src/pages/AgentDashboard.tsx', 'utf8');

// 1. Add withdraw method state
code = code.replace(
  /const \[recipientName, setRecipientName\] = useState\(''\);/,
  `const [recipientName, setRecipientName] = useState('');\n  const [withdrawMethod, setWithdrawMethod] = useState('paycam_balance');`
);

// 2. Expand activeTab type
code = code.replace(
  /useState<'cash_in' \| 'cash_out' \| 'manage_float' \| 'history' \| 'analytics'>/,
  `useState<'cash_in' | 'cash_out' | 'manage_float' | 'history' | 'analytics' | 'request_float' | 'withdraw_commission'>`
);

// 3. Add handleWithdrawCommission function
const funcCode = `
  const handleWithdrawCommission = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    try {
      let dest = '';
      if (withdrawMethod !== 'paycam_balance') {
         dest = paycamId; // Reusing paycamId state for phone number input
         if (!dest) { setError("Please enter mobile money number"); return; }
      }
      const res = await fetch('/api/agent/withdraw-commission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: user._id,
          amount: Number(amount),
          method: withdrawMethod,
          destination: dest
        })
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setSuccessMsg(\`Commission successfully withdrawn via \${withdrawMethod === 'paycam_balance' ? 'PayCam Balance' : withdrawMethod.toUpperCase()}.\`);
        setUser({ ...user, balance: data.newBalance, commissionBalance: data.newCommissionBalance });
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({ ...userData, balance: data.newBalance, commissionBalance: data.newCommissionBalance }));
        setAmount('');
        setPaycamId(''); // Clear phone number input
      }
    } catch (err) {
      setError('Failed to withdraw commission');
    }
  };
`;

code = code.replace(
  /const fetchStats = async \(userId: string\) => \{/,
  funcCode + '\n  const fetchStats = async (userId: string) => {'
);

// 4. Add Withdraw button next to commission
code = code.replace(
  /<h2 className="text-white text-2xl font-bold tracking-tight text-green-400">[\s\S]*?<\/h2>/,
  `$&
              <button 
                onClick={() => setActiveTab('withdraw_commission')}
                className="mt-2 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold py-1.5 px-3 rounded-full transition-colors"
              >
                Withdraw
              </button>`
);

// 5. Add the form for withdraw_commission (just below request_float or where it fits)
const formCode = `
        {activeTab === 'withdraw_commission' && (
          <div className="bg-white rounded-3xl shadow-sm p-8 mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <DollarSign className="text-indigo-600" /> Withdraw Commission
            </h3>
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-medium mb-6 border border-red-100 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-600"></div>
                {error}
              </div>
            )}
            {successMsg && (
              <div className="bg-green-50 text-green-700 p-4 rounded-2xl text-sm font-medium mb-6 border border-green-100 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-600"></div>
                {successMsg}
              </div>
            )}
            <form onSubmit={handleWithdrawCommission} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2 opacity-80">Withdraw To</label>
                <div className="relative">
                  <select 
                    value={withdrawMethod}
                    onChange={(e) => setWithdrawMethod(e.target.value)}
                    className="w-full bg-gray-50 border-0 rounded-2xl px-4 py-4 text-gray-900 font-medium focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all appearance-none"
                  >
                    <option value="paycam_balance">Main PayCam Balance</option>
                    <option value="mtn">MTN Mobile Money</option>
                    <option value="orange">Orange Money</option>
                  </select>
                </div>
              </div>
              
              {withdrawMethod !== 'paycam_balance' && (
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2 opacity-80">Phone Number</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={paycamId} // reusing state
                      onChange={(e) => setPaycamId(e.target.value)}
                      className="w-full bg-gray-50 border-0 rounded-2xl px-4 py-4 text-gray-900 font-medium placeholder-gray-400 focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all"
                      placeholder="e.g. 670000000"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2 opacity-80">Amount (XAF)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">XAF</span>
                  <input
                    type="number" min="1"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-gray-50 border-0 rounded-2xl pl-14 pr-4 py-4 text-gray-900 font-bold text-lg placeholder-gray-400 focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all"
                    placeholder="0"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2 ml-2">Available: {user.commissionBalance?.toLocaleString()} XAF</p>
              </div>
              <button 
                type="submit" 
                className="w-full bg-[#1E1B4B] text-white rounded-2xl py-4 font-bold text-lg hover:bg-[#2e2a6b] active:scale-[0.98] transition-all mt-4"
              >
                Withdraw Commission
              </button>
            </form>
          </div>
        )}
`;

code = code.replace(
  /\{\/\* Analytics Tab \*\/\}/,
  formCode + '\n        {/* Analytics Tab */}'
);

fs.writeFileSync('src/pages/AgentDashboard.tsx', code);
console.log("Patched agent dash");
