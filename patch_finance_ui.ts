import fs from 'fs';
let content = fs.readFileSync('src/pages/FinanceDashboard.tsx', 'utf-8');

// Add the tab button
content = content.replace(
  `<button onClick={() => setActiveTab('agents_float')} className={\`pb-4 whitespace-nowrap text-sm font-semibold border-b-[3px] transition \${activeTab === 'agents_float' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}\`}>
             <span className="flex items-center gap-2"><Banknote size={16}/> Agents Float</span>
           </button>`,
  `<button onClick={() => setActiveTab('agents_float')} className={\`pb-4 whitespace-nowrap text-sm font-semibold border-b-[3px] transition \${activeTab === 'agents_float' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}\`}>
             <span className="flex items-center gap-2"><Banknote size={16}/> Agents Float</span>
           </button>
           <button onClick={() => setActiveTab('merchants_withdraw')} className={\`pb-4 whitespace-nowrap text-sm font-semibold border-b-[3px] transition \${activeTab === 'merchants_withdraw' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}\`}>
             <span className="flex items-center gap-2"><Wallet size={16}/> Merchant Withdrawals</span>
           </button>`
);

// Add state for the new tab (Wait, we can just use the existing agentFloat variables, or add new ones. Let's add new state)
content = content.replace(
  `  const [agentFloatAmount, setAgentFloatAmount] = useState('');`,
  `  const [agentFloatAmount, setAgentFloatAmount] = useState('');
  const [merchantWithdrawPaycamId, setMerchantWithdrawPaycamId] = useState('');
  const [merchantWithdrawAmount, setMerchantWithdrawAmount] = useState('');`
);

// Add activeTab type
content = content.replace(
  `const [activeTab, setActiveTab] = useState<'overview' | 'ledger' | 'treasury' | 'reports' | 'settings' | 'agents_float'>('overview');`,
  `const [activeTab, setActiveTab] = useState<'overview' | 'ledger' | 'treasury' | 'reports' | 'settings' | 'agents_float' | 'merchants_withdraw'>('overview');`
);

// Add the handler for Merchant Withdraw
const handler = `
  const handleMerchantWithdraw = async (e: any) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/finance/merchant/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paycamId: merchantWithdrawPaycamId,
          amount: Number(merchantWithdrawAmount)
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setMerchantWithdrawPaycamId('');
        setMerchantWithdrawAmount('');
        fetchDashboardData();
      } else {
        toast.error(data.error || 'Failed to withdraw from merchant');
      }
    } catch (err) {
      toast.error('Withdrawal failed');
    }
  };
`;

content = content.replace(
  `  const handleSendFloat = async (e: any) => {`,
  handler + `\n  const handleSendFloat = async (e: any) => {`
);

// Add the UI
const ui = `
        {activeTab === 'merchants_withdraw' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-white">
                <h2 className="text-slate-900 font-bold text-lg tracking-tight">Withdraw Merchant Funds</h2>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mt-1">Deduct funds from a merchant's balance</p>
              </div>
              <form onSubmit={handleMerchantWithdraw} className="p-6 md:p-8 space-y-6 max-w-xl">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-2">Merchant PayCam ID</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PC11111111"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition outline-none font-medium"
                    value={merchantWithdrawPaycamId}
                    onChange={e => setMerchantWithdrawPaycamId(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-2">Amount to Withdraw (XAF)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="0"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition outline-none font-medium"
                    value={merchantWithdrawAmount}
                    onChange={e => setMerchantWithdrawAmount(e.target.value)}
                  />
                </div>
                <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-lg transition shadow-sm">
                  Process Withdrawal
                </button>
              </form>
            </div>
          </div>
        )}
`;

content = content.replace(
  `        {activeTab === 'agents_float' && (`,
  ui + `\n        {activeTab === 'agents_float' && (`
);

fs.writeFileSync('src/pages/FinanceDashboard.tsx', content);
console.log('Finance dashboard updated.');
