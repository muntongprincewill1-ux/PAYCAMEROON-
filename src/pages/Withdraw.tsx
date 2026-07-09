import { isMTNNumber, isOrangeNumber } from '../utils/phoneValidation';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft01Icon as ArrowLeft, Building02Icon as Building2, CreditCardAcceptIcon as CreditCard, CheckmarkCircle02Icon as CheckCircle2, Store01Icon as Store, CallIcon as Phone } from 'hugeicons-react';
import { useTranslation } from 'react-i18next';
import { Toaster, toast } from 'sonner';

export default function Withdraw() {
  const { t } = useTranslation();
  const [method, setMethod] = useState<'bank' | 'agent' | 'mtn' | 'orange'>('agent');
  const [amount, setAmount] = useState('');
  
  // Bank fields
  const [bankAccount, setBankAccount] = useState('');
  const [bank, setBank] = useState('');
  
  // Mobile fields
  const [phoneNumber, setPhoneNumber] = useState('');
  
  // Agent fields
  const [agentId, setAgentId] = useState('');
  const [agentName, setAgentName] = useState('');
  const [isLookingUpAgent, setIsLookingUpAgent] = useState(false);
  const [agentLookupError, setAgentLookupError] = useState('');

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  const [pendingWithdrawal, setPendingWithdrawal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [timeLeft, setTimeLeft] = useState(60);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }
    setUser(JSON.parse(storedUser));
  }, [navigate]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showPinModal && timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (showPinModal && timeLeft === 0) {
      setShowPinModal(false);
      setError('Transaction cancelled: Timeout reached waiting for approval.');
      setLoading(false);
    }
    return () => clearTimeout(timer);
  }, [showPinModal, timeLeft]);

  useEffect(() => {
    // Lookup agent when agentId is entered
    if (agentId.length >= 8 && method === 'agent') {
      setIsLookingUpAgent(true);
      setAgentName('');
      setAgentLookupError('');

      const timeoutId = setTimeout(async () => {
        try {
          const res = await fetch(`/api/users/lookup?identifier=${agentId}`);
          const data = await res.json();
          if (res.ok) {
            if (data.role === 'agent') {
              setAgentName(data.name || data.businessName || 'Agent');
            } else {
              setAgentLookupError('ID belongs to a non-agent user');
              setAgentName('');
            }
          } else {
            setAgentName('');
            setAgentLookupError(data.error || 'Agent not found');
          }
        } catch (error) {
          setAgentName('');
        } finally {
          setIsLookingUpAgent(false);
        }
      }, 500); // debounce time

      return () => clearTimeout(timeoutId);
    } else {
      setAgentName('');
      setAgentLookupError('');
      setIsLookingUpAgent(false);
    }
  }, [agentId, method]);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (method === 'agent') {
      if (!amount || !agentId) {
        setError('Please enter amount and Agent PayCam ID');
        return;
      }
      setLoading(true);
      try {
        const res = await fetch('/api/user/request-withdrawal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user?._id,
            agentPaycamId: agentId.toUpperCase(),
            amount: parseFloat(amount)
          })
        });

        const data = await res.json();
        if (res.ok) {
          setPendingWithdrawal(true);
          setStep(2);
        } else {
          setError(data.error || 'Request failed');
        }
      } catch (err) {
        setError('Failed to connect to server');
      } finally {
        setLoading(false);
      }
    } else {
      if (!amount) {
        setError('Please fill in all fields');
        return;
      }
      if (method === 'bank' && (!bankAccount || !bank)) {
        setError('Please select bank and account number');
        return;
      }
      if ((method === 'mtn' || method === 'orange') && !phoneNumber) {
        setError('Please enter mobile money number');
        return;
      }

      if (method === 'mtn' && !isMTNNumber(phoneNumber)) {
        setError('Please enter a valid MTN Cameroon number');
        return;
      }
      if (method === 'orange' && !isOrangeNumber(phoneNumber)) {
        setError('Please enter a valid Orange Cameroon number');
        return;
      }
      if (parseFloat(amount) > (user?.balance || 0)) {
        toast.error('Insufficient balance');
        setError('Insufficient balance');
        return;
      }
      // Show PIN approval modal before processing
      setPin('');
      setPinError('');
      setTimeLeft(60);
      setShowPinModal(true);
    }
  };

  const processDirectWithdrawal = async () => {
    if (pin !== String(user?.pin)) {
      setPinError('Invalid PIN');
      return;
    }
    setShowPinModal(false);
    setLoading(true);

    let destination = '';
    if (method === 'bank') destination = `${bank} - ${bankAccount}`;
    else destination = `${method === 'mtn' ? 'MTN' : 'Orange'} - ${phoneNumber}`;

    try {
      const res = await fetch('/api/transactions/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?._id,
          amount: parseFloat(amount),
          bankAccount: destination
        })
      });
      const data = await res.json();

      if (res.ok) {
        if (user) {
          const updatedUser = { ...user, balance: data.newBalance };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
        setPendingWithdrawal(false);
        setStep(2);
      } else {
        setError(data.error || 'Withdrawal failed');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="bg-gray-50 min-h-screen pb-20 dark:bg-gray-900 transition-colors">
      <Toaster position="top-right" />
      
      {showPinModal && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl flex flex-col animate-in slide-in-bottom-4 duration-300 border border-gray-100 dark:border-gray-700">
               <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                     <Store size={32} className="text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Approve Withdrawal</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                     Enter your 5-digit PIN to authorize this transaction. 
                  </p>
                  <p className="text-red-500 text-sm font-bold mt-2">Time remaining: {timeLeft}s</p>
               </div>

               {pinError && (
                 <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl mb-4 text-sm font-medium border border-red-100 dark:border-red-800/30 text-center">
                   {pinError}
                 </div>
               )}

               <div className="mb-8">
                 <input
                    type="password"
                    maxLength={5}
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
                     setError('Transaction rejected by user.');
                     setLoading(false);
                  }}
                  className="flex-1 py-4 font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors"
                 >
                    Reject
                 </button>
                 <button
                   disabled={pin.length !== 5 || loading}
                  onClick={processDirectWithdrawal}
                  className="flex-1 py-4 font-bold text-white bg-primary hover:bg-opacity-90 rounded-xl transition-all disabled:opacity-50"
                 >
                    {loading ? 'Processing...' : 'Approve'}
                 </button>
               </div>
            </div>
         </div>
      )}
      <div className="bg-primary px-6 pt-12 pb-6 text-white sticky top-0 z-10 shadow-md">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-white/20 transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold">{t('Withdraw Funds', 'Withdraw Funds')}</h1>
        </div>
        <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/20">
          <p className="text-sm text-white/80 mb-1">{t('Available Balance', 'Available Balance')}</p>
          <p className="text-3xl font-bold">{user?.balance?.toLocaleString()} XAF</p>
        </div>
      </div>

      <div className="p-6">
        {step === 1 ? (
          <form onSubmit={handleWithdraw} className="space-y-6">
            
            <div className="flex bg-white dark:bg-gray-800 p-1 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex-wrap gap-1">
              <button 
                type="button"
                onClick={() => setMethod('agent')}
                className={`flex-1 py-3 px-2 text-sm font-bold rounded-xl transition-colors ${method === 'agent' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}`}
              >
                Agent
              </button>
              <button 
                type="button"
                onClick={() => setMethod('bank')}
                className={`flex-1 py-3 px-2 text-sm font-bold rounded-xl transition-colors ${method === 'bank' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}`}
              >
                Bank
              </button>
              <button 
                type="button"
                onClick={() => setMethod('mtn')}
                className={`flex-1 py-3 px-2 text-sm font-bold rounded-xl transition-colors ${method === 'mtn' ? 'bg-[#ffcc00] text-black shadow-md' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}`}
              >
                MTN
              </button>
              <button 
                type="button"
                onClick={() => setMethod('orange')}
                className={`flex-1 py-3 px-2 text-sm font-bold rounded-xl transition-colors ${method === 'orange' ? 'bg-[#ff6600] text-white shadow-md' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}`}
              >
                Orange
              </button>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100">
                {error}
              </div>
            )}

            {method === 'agent' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('Agent PayCam ID', 'Agent PayCam ID')}</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Store size={20} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={agentId}
                      onChange={(e) => setAgentId(e.target.value.toUpperCase())}
                      placeholder="e.g. AG11111111"
                      className="w-full pl-11 pr-4 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent uppercase dark:text-white"
                    />
                  </div>
                  {isLookingUpAgent ? (
                    <p className="text-xs text-gray-500 mt-2">Looking up agent...</p>
                  ) : agentName ? (
                    <p className="text-sm text-green-600 mt-2 font-semibold">Agent: {agentName}</p>
                  ) : agentLookupError ? (
                    <p className="text-xs text-red-500 mt-2">{agentLookupError}</p>
                  ) : (
                    <p className="text-xs text-gray-500 mt-2">The request will be sent to the agent for cash withdrawal.</p>
                  )}
                </div>
              </div>
            )}

            {method === 'bank' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('Select Bank', 'Select Bank')}</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Building2 size={20} className="text-gray-400" />
                    </div>
                    <select
                      value={bank}
                      onChange={(e) => setBank(e.target.value)}
                      className="w-full pl-11 pr-4 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent appearance-none dark:text-white"
                    >
                      <option value="" disabled>Choose your bank</option>
                      <option value="Ecobank">Ecobank</option>
                      <option value="UBA">UBA Cameroon</option>
                      <option value="Afriland">Afriland First Bank</option>
                      <option value="SGBC">Société Générale</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Account Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <CreditCard size={20} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={bankAccount}
                      onChange={(e) => setBankAccount(e.target.value)}
                      placeholder="Enter account number"
                      className="w-full pl-11 pr-4 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {(method === 'mtn' || method === 'orange') && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('Mobile Money Number', 'Mobile Money Number')}</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Phone size={20} className="text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="e.g. 6XXXXXXXX"
                      className="w-full pl-11 pr-4 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('Amount (XAF)', 'Amount (XAF)')}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-gray-500 font-medium">FCFA</span>
                </div>
                <input
                  type="number" min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="w-full pl-16 pr-4 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent text-lg font-semibold dark:text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !amount || (method === 'bank' && (!bank || !bankAccount)) || (method === 'agent' && (!agentId || !agentName)) || ((method === 'mtn' || method === 'orange') && !phoneNumber)}
              className="w-full bg-primary text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all disabled:opacity-50 disabled:shadow-none mt-8"
            >
              {loading ? t('Processing...', 'Processing...') : (method === 'agent' ? t('Request Withdrawal', 'Request Withdrawal') : t('Withdraw', 'Withdraw'))}
            </button>
          </form>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 text-center shadow-sm border border-gray-100 dark:border-gray-700 mt-8">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${pendingWithdrawal ? 'bg-yellow-100' : 'bg-green-100'}`}>
              {pendingWithdrawal ? <Store size={40} className="text-yellow-500" /> : <CheckCircle2 size={40} className="text-green-500" />}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {pendingWithdrawal ? 'Request Submitted!' : 'Withdrawal Successful!'}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8">
              {pendingWithdrawal 
                ? `${parseFloat(amount).toLocaleString()} XAF requested from Agent. You can approve it from Pending Transactions once you receive the cash.`
                : `${parseFloat(amount).toLocaleString()} XAF has been sent.`}
            </p>
            <div className="space-y-3">
              {pendingWithdrawal && (
                <button
                  onClick={() => navigate('/pending-transactions')}
                  className="w-full bg-primary text-white font-bold py-4 rounded-2xl hover:bg-opacity-90 transition-colors shadow-lg shadow-primary/30"
                >
                  View Pending Transactions
                </button>
              )}
              <button
                onClick={() => navigate('/')}
                className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-bold py-4 rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Back to Home
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
