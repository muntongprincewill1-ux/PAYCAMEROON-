import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft01Icon as ArrowLeft, ArrowUpRight01Icon as ArrowUpRight, ArrowDownLeft01Icon as ArrowDownLeft, Wallet01Icon as Wallet, Store01Icon as Store, Activity01Icon as Activity, Download01Icon as Download } from 'hugeicons-react';
import { useTranslation } from 'react-i18next';

export default function Statements() {
  const [user, setUser] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);

    fetch(`/api/user/${parsedUser._id}`)
      .then(res => res.json())
      .then(data => {
        if (data.transactions) {
          // Filter out pending, we only want actual statement history here
          setTransactions(data.transactions.filter((tx: any) => tx.type !== 'pending_withdrawal'));
        }
      });
  }, [navigate]);

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen pb-24 transition-colors duration-200">
      <div className="bg-white dark:bg-gray-800 px-6 pt-12 pb-6 flex items-center justify-between shadow-sm sticky top-0 z-10 transition-colors duration-200">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-dark dark:text-white">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-dark dark:text-white">Account Statement</h1>
        </div>
        <button className="p-2 text-primary hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full transition-colors" title="Download PDF">
          <Download size={20} />
        </button>
      </div>

      <div className="p-6">
        <div className="bg-primary px-6 py-8 rounded-3xl text-white shadow-xl mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mt-10 -mr-10"></div>
          <p className="text-white/80 font-medium mb-1">Current Balance</p>
          <h2 className="text-4xl font-bold mb-4">{user?.balance?.toLocaleString() || 0} XAF</h2>
          <div className="flex items-center gap-2 text-sm bg-white/20 w-fit px-3 py-1 rounded-full backdrop-blur-sm">
            <Activity size={16} /> All time history
          </div>
        </div>

        <div className="space-y-4">
          {transactions.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
              <p className="text-gray-500 dark:text-gray-400">No transaction history found.</p>
            </div>
          ) : (
            transactions.map((tx, i) => {
              const isDeduction = tx.type === 'send' || tx.type === 'buy_sim' || tx.type === 'withdraw' || tx.type === 'merchant_deposit_out';
              return (
                <div key={tx._id || i} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex justify-between items-center transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${
                      isDeduction ? 'bg-red-50 text-red-500 dark:bg-red-900/20 dark:text-red-400' : 
                      tx.type === 'receive' || tx.type === 'deposit' || tx.type === 'commission_withdrawal' ? 'bg-green-50 text-green-500 dark:bg-green-900/20 dark:text-green-400' : 
                      'bg-blue-50 text-primary dark:bg-blue-900/20 dark:text-blue-400'
                    }`}>
                      {isDeduction ? <ArrowUpRight size={20} /> : 
                       tx.type === 'receive' || tx.type === 'deposit' || tx.type === 'commission_withdrawal' ? <ArrowDownLeft size={20} /> : 
                       <Wallet size={20} />}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white text-base">
                        {tx.type === 'withdraw' ? 'Withdrawal' : 
                         tx.type === 'send' ? 'Transfer to ' + (tx.recipient || 'User') :
                         tx.type === 'receive' ? 'Received from ' + (tx.recipient || 'User') :
                         tx.type === 'deposit' ? 'Deposit' :
                         tx.type === 'buy_sim' ? 'Buy eSIM' :
                         tx.type === 'user_withdrawal_processed' ? 'Processed Withdrawal' :
                         tx.type === 'merchant_deposit_out' ? 'Agent Deposit to ' + (tx.recipient || '') :
                         tx.recipient || tx.type}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {new Date(tx.createdAt).toLocaleString()} • REF: {typeof tx._id === 'string' ? tx._id.slice(-6).toUpperCase() : 'UNKNOWN'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-lg ${isDeduction ? 'text-gray-900 dark:text-white' : 'text-green-600 dark:text-green-400'}`}>
                      {Math.abs(tx.amount).toLocaleString()} 
                    </p>
                    {tx.fee > 0 && <p className="text-xs text-gray-400 dark:text-gray-500">Fee: {tx.fee}</p>}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
