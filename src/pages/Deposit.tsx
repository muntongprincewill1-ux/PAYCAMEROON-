import { isMTNNumber, isOrangeNumber } from '../utils/phoneValidation';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft01Icon as ArrowLeft, CheckmarkCircle02Icon as CheckCircle2, Wallet01Icon as Wallet, CreditCardAcceptIcon as CreditCard, CallIcon as Phone } from 'hugeicons-react';
import { useTranslation } from 'react-i18next';

export default function Deposit() {
  const { t } = useTranslation();
  const [method, setMethod] = useState<'bank' | 'mtn' | 'orange'>('bank');
  const [amount, setAmount] = useState('');
  
  // Bank fields
  const [bankAccount, setBankAccount] = useState('');
  const [bank, setBank] = useState('UBA');
  
  // Mobile fields
  const [phoneNumber, setPhoneNumber] = useState('');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const banks = ['UBA', 'Ecobank', 'Afriland First Bank', 'Societe Generale'];

  const handleDeposit = async () => {
    if (!amount) return;
    if (method === 'bank' && !bankAccount) return;
    if ((method === 'mtn' || method === 'orange') && !phoneNumber) return;

    if (method === 'mtn' && !isMTNNumber(phoneNumber)) {
      setErrorMsg('Please enter a valid MTN Cameroon number');
      return;
    }
    if (method === 'orange' && !isOrangeNumber(phoneNumber)) {
      setErrorMsg('Please enter a valid Orange Cameroon number');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    
    const user = (() => { try { const u = localStorage.getItem('user'); return u && u !== 'undefined' ? JSON.parse(u) : {}; } catch(e) { return {}; } })();
    
    let sourceDetails = '';
    if (method === 'bank') sourceDetails = `${bank} - ${bankAccount}`;
    else sourceDetails = `${method === 'mtn' ? 'MTN' : 'Orange'} - ${phoneNumber}`;

    try {
      const res = await fetch('/api/transactions/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user._id,
          amount: Number(amount),
          bankAccount: sourceDetails
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        if (user) {
          const updatedUser = { ...user, balance: data.newBalance };
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
        setSuccess(true);
        setTimeout(() => navigate('/home'), 2000);
      } else {
        setErrorMsg(data.error || 'Failed to add funds.');
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
        <h2 className="text-2xl font-bold text-dark dark:text-white mb-2">Funds Added!</h2>
        <p className="text-gray-500 dark:text-gray-400 text-center">Your funds have been securely added to your PayCam balance.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen pb-24 transition-colors duration-200">
      <div className="bg-white dark:bg-gray-800 px-6 pt-12 pb-6 flex items-center gap-4 shadow-sm sticky top-0 z-10 transition-colors duration-200">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
          <ArrowLeft size={24} className="text-dark dark:text-white" />
        </button>
        <h1 className="text-xl font-bold text-dark dark:text-white flex items-center gap-2">
          <Wallet size={20} /> {t('Add Funds', 'Add Funds')}
        </h1>
      </div>

      <div className="px-6 mt-6">
        {errorMsg && <div className="bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 p-3 rounded-xl mb-4 text-sm text-center">{errorMsg}</div>}
        
        <div className="flex bg-white dark:bg-gray-800 p-1 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6 transition-colors duration-200">
          <button 
            type="button"
            onClick={() => setMethod('bank')}
            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-colors ${method === 'bank' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}`}
          >
            {t('Bank', 'Bank')}
          </button>
          <button 
            type="button"
            onClick={() => setMethod('mtn')}
            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-colors ${method === 'mtn' ? 'bg-[#ffcc00] text-black shadow-md' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}`}
          >
            MTN
          </button>
          <button 
            type="button"
            onClick={() => setMethod('orange')}
            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-colors ${method === 'orange' ? 'bg-[#ff6600] text-white shadow-md' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}`}
          >
            Orange
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 mb-6 transition-colors duration-200">
          <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{t('Amount (XAF)', 'Amount (XAF)')}</label>
          <div className="flex items-center border-b-2 border-primary pb-2 mb-6">
            <span className="text-3xl font-bold text-dark dark:text-white mr-2">FCFA</span>
            <input
              type="number" min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full text-4xl font-bold text-dark dark:text-white focus:outline-none bg-transparent"
              placeholder="0"
            />
          </div>

          {method === 'bank' && (
            <>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{t('Select Bank', 'Select Bank')}</label>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {banks.map(b => (
                  <button
                    key={b}
                    onClick={() => setBank(b)}
                    className={`py-3 px-4 rounded-xl text-sm font-medium transition-all border ${
                      bank === b 
                        ? 'bg-primary text-white border-primary shadow-md' 
                        : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>

              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{t('Bank Account Number', 'Bank Account Number')}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <CreditCard size={20} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  className="w-full pl-11 pr-4 py-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary mb-2 transition-colors duration-200"
                  placeholder="e.g. 10023456789"
                />
              </div>
            </>
          )}

          {(method === 'mtn' || method === 'orange') && (
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
                   className="w-full pl-11 pr-4 py-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary mb-2 transition-colors duration-200"
                   placeholder="e.g. 6XXXXXXXX"
                 />
               </div>
             </div>
          )}
        </div>

        <button
          onClick={handleDeposit}
          disabled={loading || !amount || (method === 'bank' ? !bankAccount : !phoneNumber)}
          className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-lg hover:bg-opacity-90 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? t('Processing...', 'Processing...') : t('Add Funds', 'Add Funds')}
        </button>
      </div>
    </div>
  );
}
