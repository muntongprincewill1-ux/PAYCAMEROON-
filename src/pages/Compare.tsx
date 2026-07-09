import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft01Icon as ArrowLeft, BarChartIcon as BarChart2, FlashIcon as Zap, Shield01Icon as ShieldCheck, Clock01Icon as Clock } from 'hugeicons-react';

export default function Compare() {
  const [amount, setAmount] = useState('50000');
  const [rates, setRates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!amount) return;
    setLoading(true);
    fetch('/api/rates/compare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: Number(amount) })
    })
    .then(res => res.json())
    .then(data => setRates(data.rates))
    .catch(console.error)
    .finally(() => setLoading(false));
  }, [amount]);

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen pb-24 transition-colors">
      <div className="bg-primary px-6 pt-12 pb-6 flex items-center gap-4 shadow-md sticky top-0 z-10 text-white">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-white/20 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <BarChart2 size={20} /> Compare Rates
        </h1>
      </div>

      <div className="px-6 mt-6">
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
          <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Transfer Amount (XAF)</label>
          <input
            type="number" min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary text-xl font-bold"
            placeholder="Enter amount"
          />
        </div>

        <h3 className="text-dark dark:text-white font-bold text-lg mb-4 px-2">Live Agency Rates</h3>
        
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {rates.map((rate, i) => (
              <div key={i} className={`bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border ${i === 0 ? 'border-secondary bg-yellow-50/30 dark:bg-yellow-900/10' : 'border-gray-100 dark:border-gray-700'}`}>
                {i === 0 && (
                  <div className="inline-flex items-center gap-1 bg-secondary text-dark text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full mb-3 shadow-sm">
                    <Zap size={12} /> Best Value
                  </div>
                )}
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-bold text-dark dark:text-white text-lg">{rate.agency}</h4>
                  <p className="text-xl font-bold text-primary dark:text-blue-400">{rate.fee.toLocaleString()} XAF</p>
                </div>
                
                <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Clock size={14} className="text-gray-400" />
                    <span>{rate.time}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ShieldCheck size={14} className={`${rate.reliability === 'High' ? 'text-green-500' : 'text-yellow-500'}`} />
                    <span>{rate.reliability} Reliability</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
