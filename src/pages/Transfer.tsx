import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft01Icon as ArrowLeft, SparklesIcon as Sparkles, CheckmarkCircle02Icon as CheckCircle2, UserIcon as UserIcon } from 'hugeicons-react';
import { useTranslation } from 'react-i18next';

export default function Transfer() {
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const user = userStr && userStr !== 'undefined' ? JSON.parse(userStr) : null;
    if (!user || !user.role) {
      navigate('/login');
    } else if (user.role !== 'user') {
      if (user.role === 'agent') navigate('/agent/dashboard');
      else if (user.role === 'support') navigate('/support-dashboard');
      else if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'merchant') navigate('/merchant/dashboard');
      else if (user.role === 'compliance') navigate('/compliance');
      else navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    // Lookup user when recipient ID is entered
    if (recipient.length >= 8) {
      setIsLookingUp(true);
      setRecipientName('');
      setErrorMsg('');

      const timeoutId = setTimeout(async () => {
        try {
          const res = await fetch(`/api/users/lookup?identifier=${recipient}`);
          const data = await res.json();
          if (res.ok) {
            setRecipientName(data.name);
          } else {
            setRecipientName('');
            // Optional: setErrorMsg(data.error) if you want to show it immediately
          }
        } catch (error) {
          setRecipientName('');
        } finally {
          setIsLookingUp(false);
        }
      }, 500); // debounce time

      return () => clearTimeout(timeoutId);
    } else {
      setRecipientName('');
      setIsLookingUp(false);
    }
  }, [recipient]);

  const handleSend = async () => {
    if (!amount || !recipient) return;
    setLoading(true);
    
    const user = (() => { try { const u = localStorage.getItem('user'); return u && u !== 'undefined' ? JSON.parse(u) : {}; } catch(e) { return {}; } })();
    
    try {
      const res = await fetch('/api/transactions/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user._id,
          amount: Number(amount),
          recipient
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => navigate('/home'), 2000);
      } else {
        setErrorMsg(data.error || 'Transaction failed.');
      }
    } catch (error) {
      setErrorMsg('Network error');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-gray-900 px-6 transition-colors duration-200">
        <CheckCircle2 size={80} className="text-green-500 mb-6" />
        <h2 className="text-2xl font-bold text-dark dark:text-white mb-2">{t('Transfer Successful!', 'Transfer Successful!')}</h2>
        <p className="text-gray-500 dark:text-gray-400 text-center">{t('Your money has been sent securely to', 'Your money has been sent securely to')} {recipientName || recipient}.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen pb-24 transition-colors duration-200">
      <div className="bg-white dark:bg-gray-800 px-6 pt-12 pb-6 flex items-center gap-4 shadow-sm sticky top-0 z-10 transition-colors duration-200">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-dark dark:text-white">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-dark dark:text-white">{t('Send to PayCam User', 'Send to PayCam User')}</h1>
      </div>

      <div className="px-6 mt-6">
        {errorMsg && <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-xl mb-4 text-sm text-center border border-red-200 dark:border-red-800/30">{errorMsg}</div>}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 mb-6 transition-colors duration-200">
          <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{t('Amount (XAF)', 'Amount (XAF)')}</label>
          <div className="flex items-center border-b-2 border-primary pb-2 mb-6">
            <span className="text-3xl font-bold text-dark dark:text-white mr-2">XAF</span>
            <input
              type="number" min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full text-4xl font-bold text-dark dark:text-white focus:outline-none bg-transparent"
              placeholder="0"
            />
          </div>

          <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{t('Recipient PayCam ID', 'Recipient PayCam ID')}</label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value.toUpperCase())}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary mb-2 uppercase transition-colors"
            placeholder="e.g. PC12345678"
          />
          
          <div className="min-h-[40px] mt-2 flex items-center">
             {isLookingUp ? (
                <div className="text-sm text-gray-400 dark:text-gray-500 flex items-center gap-2">
                   <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                   {t('Looking up PayCam ID...', 'Looking up PayCam ID...')}
                </div>
             ) : recipientName ? (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg border border-green-100 dark:border-green-800/30 w-full font-medium">
                   <UserIcon size={16} />
                   <span>{recipientName}</span>
                </div>
             ) : recipient.length >= 8 ? (
                <div className="text-sm text-red-500 dark:text-red-400">
                   {t('User not found', 'User not found')}
                </div>
             ) : null}
          </div>
        </div>

        <button
          onClick={handleSend}
          disabled={loading || !amount || !recipient || (!recipientName && recipient.length >= 8)}
          className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-lg hover:bg-opacity-90 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? t('Processing...', 'Processing...') : t('Send Securely', 'Send Securely')}
        </button>
      </div>
    </div>
  );
}
