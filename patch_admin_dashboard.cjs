const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

const target1 = `taxRate: 19.25,
      transferFeeFixed: 0,
      transferFeePercent: 1.5,
      withdrawalFeeFixed: 50,
      withdrawalFeePercent: 1.0,`;
const replacement1 = `taxRate: 19.25,
      transferFeeFixed: 0,
      transferFeePercent: 1.5,
      withdrawalFeeFixed: 50,
      withdrawalFeePercent: 1.0,
      merchantCommissionRate: 0,
      agentCommissionRate: 0,`;
code = code.replace(target1, replacement1);

const target2 = `<div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">System Tax Rate (%)</label>
                                <input type="number" step="0.01" value={systemSettings.taxRate} onChange={e => setSystemSettings({...systemSettings, taxRate: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm text-black focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                             </div>`;
const replacement2 = `<div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">System Tax Rate (%)</label>
                                <input type="number" step="0.01" value={systemSettings.taxRate} onChange={e => setSystemSettings({...systemSettings, taxRate: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm text-black focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                             </div>
                             <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Merchant Commission (%)</label>
                                <input type="number" step="0.01" value={systemSettings.merchantCommissionRate || 0} onChange={e => setSystemSettings({...systemSettings, merchantCommissionRate: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm text-black focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                             </div>
                             <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Agent Commission (%)</label>
                                <input type="number" step="0.01" value={systemSettings.agentCommissionRate || 0} onChange={e => setSystemSettings({...systemSettings, agentCommissionRate: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm text-black focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                             </div>`;
code = code.replace(target2, replacement2);

fs.writeFileSync('src/pages/AdminDashboard.tsx', code);
