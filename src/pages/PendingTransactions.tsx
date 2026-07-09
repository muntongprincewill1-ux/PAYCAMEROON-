import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft01Icon as ArrowLeft, CheckmarkBadge01Icon as Check, Clock01Icon as Clock, Alert01Icon as AlertCircle } from 'hugeicons-react';
import { useTranslation } from 'react-i18next';

export default function PendingTransactions() {
  const [user, setUser] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [showPinModal, setShowPinModal] = useState(false);
  const [selectedTx, setSelectedTx] = useState<string | null>(null);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [submittingApprovals, setSubmittingApprovals] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);

    fetch(`/api/user/${parsedUser._id}/pending-withdrawals`)
      .then(res => res.json())
      .then(data => {
        setTransactions(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [navigate]);

  const handleReject = async (transactionId: string) => {
    if (!window.confirm("Are you sure you want to reject this withdrawal request?")) return;
    try {
      const res = await fetch('/api/user/reject-withdrawal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user._id, transactionId })
      });
      if (res.ok) {
        setTransactions(prev => prev.filter(t => t._id !== transactionId));
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Failed to reject transaction');
      }
    } catch (err) {
      setErrorMsg('Network error');
    }
  };

  const initApprove = (transactionId: string) => {
    setSelectedTx(transactionId);
    setShowPinModal(true);
    setPinError('');
    setPin('');
  };

  const handleConfirmPin = async () => {
    if (!selectedTx) return;
    
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
        body: JSON.stringify({ userId: user._id, transactionId: selectedTx })
      });
      const data = await res.json();
      
      if (res.ok) {
        // Update balance locally
        const updatedUser = { ...user, balance: data.balance };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);

        // Remove from list
        setTransactions(prev => prev.filter(t => t._id !== selectedTx));
        setShowPinModal(false);
        setSelectedTx(null);
        setPin('');
      } else {
        setPinError(data.error || 'Failed to approve');
      }
    } catch (err) {
      setPinError('Network error');
    } finally {
      setSubmittingApprovals(false);
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen pb-24 transition-colors duration-200">
      {/* PIN Verification Modal */}
      {showPinModal && selectedTx && (
         <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4 py-8 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] w-full max-w-sm shadow-2xl relative overflow-hidden flex flex-col pt-8">
               <div className="absolute top-0 left-0 w-full h-2 bg-yellow-400"></div>
               <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock size={32} />
               </div>
               <h2 className="text-xl font-bold text-center text-dark dark:text-white mb-2">Confirm Action</h2>
               <p className="text-center text-gray-500 dark:text-gray-400 text-sm mb-6 px-4">
                  Enter your 5-digit PIN to confirm that you have received the cash.
               </p>
               
               {pinError && (
                 <div className="mb-4 text-red-500 bg-red-50 dark:bg-red-900/20 text-sm text-center p-3 rounded-xl border border-red-100 dark:border-red-800 flex items-center justify-center gap-2">
                    <AlertCircle size={16} /> {pinError}
                 </div>
               )}

               <div className="mb-6">
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
                     setSelectedTx(null);
                  }}
                  className="flex-1 py-4 font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors"
                 >
                    Cancel
                 </button>
                 <button 
                  disabled={pin.length !== 5 || submittingApprovals}
                  onClick={handleConfirmPin}
                  className="flex-1 py-4 font-bold text-white bg-primary hover:bg-opacity-90 rounded-xl transition-all disabled:opacity-50"
                 >
                    {submittingApprovals ? 'Processing...' : 'Confirm'}
                 </button>
               </div>
            </div>
         </div>
      )}

      <div className="bg-white dark:bg-gray-800 px-6 pt-12 pb-6 flex items-center gap-4 shadow-sm sticky top-0 z-10 transition-colors duration-200">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-dark dark:text-white">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-dark dark:text-white">Pending Approvals</h1>
      </div>

      <div className="p-6">
        {errorMsg && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl mb-4 text-sm font-medium border border-red-100 dark:border-red-800/30 flex items-center gap-2">
            <AlertCircle size={18} /> {errorMsg}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm mt-4">
            <Clock size={48} className="text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">No pending transactions</p>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map(t => (
              <div key={t._id} className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-yellow-200 dark:border-yellow-900/30 relative overflow-hidden transition-colors duration-200">
                <div className="absolute top-0 left-0 w-1 h-full bg-yellow-400"></div>
                
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="inline-block px-2 py-1 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-500 text-xs font-bold rounded-lg mb-2 uppercase tracking-wide">
                      Awaiting Your Approval
                    </span>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Withdrawal to {t.recipient}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(t.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{(t.amount + t.fee).toLocaleString()} XAF</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Includes {t.fee} XAF fee</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
                  <button 
                    onClick={() => handleReject(t._id)}
                    className="bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-400 font-bold py-2.5 px-6 rounded-xl flex items-center gap-2 transition-colors shadow-sm"
                  >
                    Reject
                  </button>
                  <button 
                    onClick={() => initApprove(t._id)}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-6 rounded-xl flex items-center gap-2 transition-colors shadow-sm"
                  >
                    <Check size={18} /> Confirm Cash Received
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
