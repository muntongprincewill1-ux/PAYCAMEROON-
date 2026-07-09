import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight01Icon as ArrowRight, ArrowUpRight01Icon as ArrowUpRight, ArrowDownLeft01Icon as ArrowDownLeft, Wallet01Icon as Wallet, Notification01Icon as Bell, Shield01Icon as ShieldCheck, Logout01Icon as LogOut, Settings01Icon as Settings, Clock01Icon as Clock, Alert01Icon as AlertCircle, ScanIcon as ScanLine, HeadsetConnectedIcon as Headset } from 'hugeicons-react';
import { useTranslation } from 'react-i18next';
import CopyPaycamId from '../components/CopyPaycamId';
import { NotificationsPopover } from '../components/Notifications';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [pendingTx, setPendingTx] = useState<any>(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [submittingApprovals, setSubmittingApprovals] = useState(false);
  
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }
    
    let parsedUser;
    try {
      parsedUser = JSON.parse(storedUser);
    } catch(e) {
      navigate('/login');
      return;
    }
    
    if (parsedUser && !parsedUser.kycVerified && ['user'].includes(parsedUser.role)) {
       navigate('/kyc');
       return;
    }
    if (!parsedUser) {
      navigate('/login');
      return;
    }
    
    if (parsedUser.role && parsedUser.role !== 'user') {
      if (parsedUser.role === 'agent') navigate('/agent/dashboard');
      else if (parsedUser.role === 'support') navigate('/support-dashboard');
      else if (parsedUser.role === 'admin') navigate('/admin');
      else if (parsedUser.role === 'merchant') navigate('/merchant/dashboard');
      else if (parsedUser.role === 'compliance') navigate('/compliance');
      else navigate('/login');
      return;
    }

    setUser(parsedUser);
    
    fetch(`/api/user/${parsedUser._id}`)
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
          setTransactions(data.transactions.filter((tx: any) => tx.type !== 'pending_withdrawal').slice(0, 5));
          localStorage.setItem('user', JSON.stringify(data.user));
        }
      })
      .catch(console.error);
      
    // Check pending withdrawals
    fetch(`/api/user/${parsedUser._id}/pending-withdrawals`)
      .then(res => res.json())
      .then(data => {
         if (data && data.length > 0) {
            setPendingTx(data[0]); // pop up for the most recent one
            setShowPinModal(true);
         }
      })
      .catch(console.error);
  }, [navigate]);

  const handleApprovePending = async () => {
     if (pin.length !== 5 || !/^\d{5}$/.test(pin)) {
        setPinError("PIN must be exactly 5 digits");
        return;
     }
     if (pin !== String(user?.pin)) {
        setPinError("Invalid PIN");
        return;
     }
     
     setSubmittingApprovals(true);
     setPinError('');
     
     try {
      const res = await fetch('/api/user/approve-withdrawal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user._id, transactionId: pendingTx._id })
      });
      const data = await res.json();
      
      if (res.ok) {
        const updatedUser = { ...user, balance: data.balance };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setShowPinModal(false);
        setPendingTx(null);
        setPin('');
      } else {
        setPinError(data.error || 'Failed to approve');
      }
    } catch (err) {
      setPinError('Network error. Try again.');
    } finally {
      setSubmittingApprovals(false);
    }
  };

  if (!user) return <div className="flex h-screen items-center justify-center dark:bg-gray-900 dark:text-white">{t('Loading')}</div>;

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen pb-24 transition-colors duration-200">
      {user.status === 'blocked_temporal' && (
        <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4 m-4 rounded-r-xl shadow-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="text-red-800 dark:text-red-200 font-bold mb-1">Account Temporarily Blocked</h3>
              <p className="text-red-600 dark:text-red-300 text-sm">
                Reason: {user.blockReason || 'Violation of terms'}
              </p>
              <p className="text-red-600 dark:text-red-300 text-xs mt-2">
                You cannot perform transactions. If you do not resolve this within 30 days, your account will be permanently blocked. Please contact support.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Pending Auth Modal */}
      {showPinModal && pendingTx && (
         <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4 py-8 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] w-full max-w-sm shadow-2xl relative overflow-hidden flex flex-col pt-8">
               <div className="absolute top-0 left-0 w-full h-2 bg-yellow-400"></div>
               <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock size={32} />
               </div>
               <h2 className="text-xl font-bold text-center text-dark dark:text-white mb-2">Pending Withdrawal</h2>
               <p className="text-center text-gray-500 dark:text-gray-400 text-sm mb-6 px-4">
                  {pendingTx.agency || 'Agent/Merchant'} <span className="font-bold text-dark dark:text-gray-200">{pendingTx.recipient}</span> requested a <span className="font-bold text-dark dark:text-gray-200">{pendingTx.amount.toLocaleString()} XAF</span> withdrawal from your account. Did you receive the physical cash?
               </p>
               
               {pinError && (
                 <div className="mb-4 text-red-500 bg-red-50 dark:bg-red-900/20 text-sm text-center p-3 rounded-xl border border-red-100 dark:border-red-800 flex items-center justify-center gap-2">
                    <AlertCircle size={16} /> {pinError}
                 </div>
               )}

               <div className="mb-6">
                 <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 text-center">Confirm with your 5-digit PIN</label>
                 <input 
                    type="password" 
                    maxLength={5} pattern="\d{5}" title="PIN must be exactly 5 digits" 
                    value={pin}
                    onChange={(e) => {
                       const val = e.target.value.replace(/\D/g, '');
                       setPin(val);
                       setPinError('');
                    }}
                    placeholder="•••••"
                    className="w-full text-center tracking-[1em] text-3xl font-bold p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent dark:text-white transition-colors"
                 />
               </div>

               <div className="flex gap-3 mt-auto">
                 <button 
                  onClick={() => {
                     setShowPinModal(false);
                     setPin('');
                  }}
                  className="flex-1 py-4 font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors"
                 >
                    Later
                 </button>
                 <button 
                  disabled={pin.length !== 5 || submittingApprovals}
                  onClick={handleApprovePending}
                  className="flex-1 py-4 font-bold text-white bg-primary hover:bg-opacity-90 rounded-xl transition-all disabled:opacity-50"
                 >
                    {submittingApprovals ? 'Processing...' : 'Approve'}
                 </button>
               </div>
            </div>
         </div>
      )}

      {/* Header */}
      <div className="bg-primary px-6 pt-12 pb-8 rounded-b-[40px] shadow-lg relative z-50">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent rounded-b-[40px]"></div>
        <div className="flex justify-between items-center mb-6 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center border border-white/30 backdrop-blur-sm">
              <span className="text-white font-bold text-lg">{user.name.charAt(0)}</span>
            </div>
            <div>
              <p className="text-white/80 text-sm">{t('Good morning')},</p>
              <h2 className="text-white font-bold text-xl">{user.name}</h2>
              <CopyPaycamId paycamId={user.paycamId} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <NotificationsPopover userId={user._id} />
            <button onClick={() => navigate('/settings')} className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center relative backdrop-blur-sm border border-white/30 hover:bg-white/30 transition-colors">
              <Settings className="text-white" size={20} />
            </button>
          </div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 shadow-inner relative z-10 hover:bg-white/20 transition-colors cursor-pointer">
          <div className="flex justify-between items-center mb-2">
            <p className="text-white/80 text-sm font-medium flex items-center gap-2">
              <Wallet size={16} /> {t('Total Balance')}
            </p>
            <ShieldCheck className="text-secondary" size={18} />
          </div>
          <h1 className="text-white text-4xl font-bold tracking-tight">
            {user.balance.toLocaleString()} <span className="text-2xl text-white/70">XAF</span>
          </h1>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-6 -mt-6 relative z-20">
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-xl flex justify-between items-center border border-gray-100 dark:border-gray-700 transition-colors duration-200">
          <ActionBtn icon={<ArrowUpRight size={24} />} label={t('Send')} onClick={() => user.status === 'blocked_temporal' ? alert('Account blocked. Please contact support.') : navigate('/transfer')} color="bg-blue-50 text-primary dark:bg-blue-900/30 dark:text-blue-400" />
          <ActionBtn icon={<ArrowDownLeft size={24} />} label={t('Withdraw')} onClick={() => user.status === 'blocked_temporal' ? alert('Account blocked. Please contact support.') : navigate('/withdraw')} color="bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400" />
          <ActionBtn icon={<ScanLine size={24} />} label={t('Scan')} onClick={() => user.status === 'blocked_temporal' ? alert('Account blocked. Please contact support.') : navigate('/scan')} color="bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-110" />
          <ActionBtn icon={<Wallet size={24} />} label={t('Add Funds')} onClick={() => user.status === 'blocked_temporal' ? alert(t('Account blocked. Please contact support.')) : navigate('/deposit')} color="bg-yellow-50 text-secondary dark:bg-yellow-900/30 dark:text-yellow-400" />
          <ActionBtn icon={<Clock size={24} />} label={t('Pending')} onClick={() => navigate('/pending-transactions')} color="bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" />
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="px-6 mt-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-dark dark:text-white font-bold text-lg">{t('Recent Transactions')}</h3>
          <button onClick={() => navigate('/statements')} className="text-primary dark:text-blue-400 text-sm font-medium hover:underline">{t('See All')}</button>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 transition-colors duration-200">
          {transactions.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-6">{t('No recent transactions')}</p>
          ) : (
            transactions.map((tx, i) => {
              const isDeduction = tx.type === 'send' || tx.type === 'buy_sim' || tx.type === 'withdraw' || tx.type === 'merchant_deposit_out';
              return (
                <div key={i} className="flex justify-between items-center py-4 border-b border-gray-50 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg px-2 -mx-2 transition-colors cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${
                      isDeduction ? 'bg-red-50 text-red-500 dark:bg-red-900/20' : 
                      tx.type === 'receive' || tx.type === 'deposit' || tx.type === 'commission_withdrawal' ? 'bg-green-50 text-green-500 dark:bg-green-900/20' : 'bg-blue-50 text-primary dark:bg-blue-900/20'
                    }`}>
                      {isDeduction ? <ArrowUpRight size={20} /> : 
                       tx.type === 'receive' || tx.type === 'deposit' || tx.type === 'commission_withdrawal' ? <ArrowDownLeft size={20} /> : <Wallet size={20} />}
                    </div>
                    <div>
                      <p className="font-semibold text-dark dark:text-white">
                        {tx.type === 'withdraw' ? 'Withdrawal' : 
                         tx.type === 'user_withdrawal_processed' ? 'Processed Withdrawal' :
                         tx.recipient || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{tx.agency} • {new Date(tx.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${isDeduction ? 'text-dark dark:text-white' : 'text-green-600 dark:text-green-400'}`}>
                      {Math.abs(tx.amount).toLocaleString()} XAF
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider">{tx.status}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      
      <button 
         onClick={() => navigate('/support')}
         className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition hover:scale-105 z-50"
         title="Contact Support"
      >
         <Headset size={24} />
      </button>
    </div>
  );
}

function ActionBtn({ icon, label, onClick, color }: { icon: React.ReactNode, label: string, onClick: () => void, color: string }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-2 group">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 shadow-sm ${color}`}>
        {icon}
      </div>
      <span className="text-xs font-medium text-gray-600 dark:text-gray-400 group-hover:text-primary dark:group-hover:text-blue-400 transition-colors">{label}</span>
    </button>
  );
}
