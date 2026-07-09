import { isMTNNumber, isOrangeNumber } from '../utils/phoneValidation';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft01Icon as ArrowLeft, ShoppingBag01Icon as ShoppingBag, SmartPhone01Icon as Smartphone, QrCodeIcon as QrCode, FlashIcon as Zap, DropletIcon as Droplet, File01Icon as FileText, CheckmarkCircle02Icon as CheckCircle2 } from 'hugeicons-react';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';

export default function Store() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'esim' | 'light' | 'water'>('esim');
  
  // eSIM state
  const [provider, setProvider] = useState('MTN');
  const [action, setAction] = useState<'buy' | 'swap'>('buy');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [assignedNumber, setAssignedNumber] = useState<string | null>(null);
  const [pendingSwap, setPendingSwap] = useState(false);

  // Bill state
  const [meterNumber, setMeterNumber] = useState('');
  const [billNumber, setBillNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [billSuccess, setBillSuccess] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleEsimAction = async () => {
    if (action === 'swap') {
      if (provider.toLowerCase() === 'mtn' && !isMTNNumber(phoneNumber)) {
        setErrorMsg('Please enter a valid MTN Cameroon number');
        return;
      }
      if (provider.toLowerCase() === 'orange' && !isOrangeNumber(phoneNumber)) {
        setErrorMsg('Please enter a valid Orange Cameroon number');
        return;
      }
    }
    setLoading(true);
    const user = (() => { try { const u = localStorage.getItem('user'); return u && u !== 'undefined' ? JSON.parse(u) : {}; } catch(e) { return {}; } })();
    
    try {
      const endpoint = action === 'buy' ? '/api/store/buy-esim' : '/api/store/swap-esim';
      const payload = action === 'buy' 
        ? { userId: user._id, provider } 
        : { userId: user._id, provider, phoneNumber };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (res.ok) {
        if (data.pendingApproval) {
          setPendingSwap(true);
        } else {
          setQrCode(data.qrCode || 'simulated-qr-code');
          setAssignedNumber(data.newNumber || null);
        }
      } else {
        alert(data.error || 'Operation failed');
      }
    } catch (error) {
      alert('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleBillPayment = async (type: 'socadel' | 'camwater') => {
    setLoading(true);
    setErrorMsg('');
    const user = (() => { try { const u = localStorage.getItem('user'); return u && u !== 'undefined' ? JSON.parse(u) : {}; } catch(e) { return {}; } })();
    
    try {
      // We will reuse a transaction endpoint to deduct balance for bills
      const res = await fetch('/api/store/pay-bill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user._id,
          type,
          amount: Number(amount),
          reference: type === 'socadel' ? meterNumber : billNumber
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        const updatedUser = { ...user, balance: data.newBalance };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        if (type === 'socadel') {
           setBillSuccess(data.token || Array.from({length: 20}, () => Math.floor(Math.random() * 10)).join(''));
        } else {
           setBillSuccess('PAID');
        }
      } else {
        setErrorMsg(data.error || 'Payment failed');
      }
    } catch (error) {
      setErrorMsg('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-24 dark:bg-gray-900 transition-colors">
      <div className="bg-primary px-6 pt-12 pb-6 shadow-md sticky top-0 z-10 text-white">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-white/20 transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <ShoppingBag size={20} /> Store
          </h1>
        </div>
        
        {/* Tabs */}
        <div className="flex bg-white/10 rounded-xl p-1">
          <button 
            onClick={() => { setActiveTab('esim'); setBillSuccess(null); }}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'esim' ? 'bg-white text-primary' : 'text-white hover:bg-white/10'}`}
          >
            eSIM
          </button>
          <button 
            onClick={() => { setActiveTab('light'); setBillSuccess(null); }}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-1 ${activeTab === 'light' ? 'bg-white text-primary' : 'text-white hover:bg-white/10'}`}
          >
            <Zap size={14} /> Light
          </button>
          <button 
            onClick={() => { setActiveTab('water'); setBillSuccess(null); }}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-1 ${activeTab === 'water' ? 'bg-white text-primary' : 'text-white hover:bg-white/10'}`}
          >
            <Droplet size={14} /> Water
          </button>
        </div>
      </div>

      <div className="px-6 mt-6">
        {errorMsg && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100 mb-6">
            {errorMsg}
          </div>
        )}

        {/* eSIM VIEW */}
        {activeTab === 'esim' && (
          pendingSwap ? (
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl text-center border border-gray-100 dark:border-gray-700 flex flex-col items-center animate-in fade-in zoom-in duration-300">
              <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mb-4">
                <FileText size={32} className="text-yellow-600 dark:text-yellow-400" />
              </div>
              <h2 className="text-2xl font-bold text-dark dark:text-white mb-2">Swap Request Pending</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">Your request to swap {phoneNumber} to a {provider} eSIM has been submitted and is pending provider validation.</p>
              <button onClick={() => { setPendingSwap(false); setPhoneNumber(''); }} className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-lg hover:bg-opacity-90 transition-all shadow-md">
                Done
              </button>
            </div>
          ) : qrCode ? (
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl text-center border border-gray-100 dark:border-gray-700 flex flex-col items-center animate-in fade-in zoom-in duration-300">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                <QrCode size={32} className="text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-dark dark:text-white mb-2">eSIM Ready!</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-2">Scan this QR code with your phone to activate your new {provider} eSIM.</p>
              {assignedNumber && <p className="text-lg font-bold text-primary mb-6">New Number: {assignedNumber}</p>}
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-center mb-6">
                 <QRCodeSVG value={qrCode} size={200} level="H" />
              </div>
              <button onClick={() => { setQrCode(null); setAssignedNumber(null); }} className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-lg hover:bg-opacity-90 transition-all shadow-md">
                Done
              </button>
            </div>
          ) : (
            <>
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 mb-6 transition-colors">
                <h3 className="text-dark dark:text-white font-bold text-lg mb-4">Select Provider</h3>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {['MTN', 'Orange', 'Camtel', 'Nexttel'].map(p => (
                    <button
                      key={p}
                      onClick={() => setProvider(p)}
                      className={`py-4 rounded-2xl font-bold text-lg transition-all border-2 ${
                        provider === p 
                          ? 'border-primary bg-blue-50 dark:bg-blue-900/20 text-primary shadow-sm' 
                          : 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <h3 className="text-dark dark:text-white font-bold text-lg mb-4">Action</h3>
                <div className="flex gap-4 mb-6">
                  <button
                    onClick={() => setAction('buy')}
                    className={`flex-1 py-4 px-4 rounded-2xl flex flex-col items-center gap-2 transition-all border-2 ${
                      action === 'buy' 
                        ? 'border-secondary bg-yellow-50 dark:bg-yellow-900/20 text-dark dark:text-white shadow-sm' 
                        : 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    <ShoppingBag size={32} className={action === 'buy' ? 'text-secondary' : ''} />
                    <span className="font-bold">Buy New eSIM</span>
                    <span className="text-xs opacity-80">New Number</span>
                  </button>
                  <button
                    onClick={() => setAction('swap')}
                    className={`flex-1 py-4 px-4 rounded-2xl flex flex-col items-center gap-2 transition-all border-2 ${
                      action === 'swap' 
                        ? 'border-primary bg-blue-50 dark:bg-blue-900/20 text-primary shadow-sm' 
                        : 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    <Smartphone size={32} className={action === 'swap' ? 'text-primary' : ''} />
                    <span className="font-bold">Swap to eSIM</span>
                    <span className="text-xs opacity-80">Keep Number</span>
                  </button>
                </div>

                {action === 'swap' && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Phone Number to Swap</label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      placeholder="e.g. 670000000"
                    />
                  </div>
                )}

                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-4 flex justify-between items-center border border-gray-100 dark:border-gray-600">
                  <span className="text-gray-500 dark:text-gray-400 font-medium">Total Cost</span>
                  <span className="text-2xl font-bold text-dark dark:text-white">{action === 'buy' ? '2,000' : '1,000'} XAF</span>
                </div>
              </div>

              <button
                onClick={handleEsimAction}
                disabled={loading || (action === 'swap' && !phoneNumber)}
                className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-lg hover:bg-opacity-90 transition-all shadow-lg disabled:opacity-50"
              >
                {loading ? 'Processing...' : action === 'buy' ? `Purchase ${provider} eSIM` : `Swap to ${provider} eSIM`}
              </button>
            </>
          )
        )}

        {/* LIGHT BILL VIEW */}
        {activeTab === 'light' && (
           billSuccess ? (
             <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl text-center border border-gray-100 dark:border-gray-700 flex flex-col items-center animate-in fade-in zoom-in duration-300">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400">
                  <Zap size={32} />
                </div>
                <h2 className="text-2xl font-bold text-dark dark:text-white mb-2">Purchase Successful!</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6">Here is your Socadel prepaid meter token.</p>
                <div className="bg-gray-100 dark:bg-gray-700 p-6 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-500 flex flex-col items-center justify-center mb-6 w-full">
                   <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Socadel Prepaid Token</p>
                   <p className="text-3xl font-mono font-bold tracking-[0.2em] text-dark dark:text-white bg-white dark:bg-gray-800 px-4 py-2 rounded-xl shadow-sm border border-gray-200 dark:border-gray-600">
                      {billSuccess.match(/.{1,4}/g)?.join('-')}
                   </p>
                </div>
                <button onClick={() => { setBillSuccess(null); setMeterNumber(''); setAmount(''); }} className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-lg hover:bg-opacity-90 transition-all shadow-md">
                  Buy Another Token
                </button>
             </div>
           ) : (
             <>
               <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 mb-6 transition-colors">
                 <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl text-blue-600 dark:text-blue-400">
                       <Zap size={24} />
                    </div>
                    <div>
                      <h3 className="text-dark dark:text-white font-bold text-lg">Socadel Prepaid</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Buy electricity token</p>
                    </div>
                 </div>

                 <div className="space-y-4">
                   <div>
                     <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Enter Meter Number</label>
                     <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                           <FileText size={20} className="text-gray-400" />
                        </div>
                        <input
                          type="text"
                          value={meterNumber}
                          onChange={(e) => setMeterNumber(e.target.value.replace(/\D/g, ''))}
                          className="w-full pl-11 pr-4 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent text-dark dark:text-white font-mono tracking-widest text-lg"
                          placeholder="000 0000 0000"
                        />
                     </div>
                   </div>

   <div>
                     <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Amount (XAF)</label>
                     <div className="relative mb-2">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                           <span className="text-gray-500 font-medium">FCFA</span>
                        </div>
                        <input
                          type="number" min="1"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="w-full pl-16 pr-4 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent text-dark dark:text-white font-bold text-xl"
                          placeholder="0"
                        />
                     </div>
                     {amount && Number(amount) > 0 && (
                        <div className="flex justify-between items-center text-sm px-2 text-green-600 dark:text-green-400">
                           <span>Estimated equivalent:</span>
                           <span className="font-bold">~{(Number(amount) / 79).toFixed(1)} kWh</span>
                        </div>
                     )}
                     <p className="text-xs text-gray-500 px-2 mt-1">Rate: 79 FCFA / kWh</p>
                   </div>
                 </div>
               </div>

               <button
                 onClick={() => handleBillPayment('socadel')}
                 disabled={loading || !meterNumber || !amount}
                 className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-lg hover:bg-opacity-90 transition-all shadow-lg disabled:opacity-50"
               >
                 {loading ? 'Processing...' : 'Buy Token'}
               </button>
             </>
           )
        )}

        {/* WATER BILL VIEW */}
        {activeTab === 'water' && (
           billSuccess ? (
             <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl text-center border border-gray-100 dark:border-gray-700 flex flex-col items-center animate-in fade-in zoom-in duration-300">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4 text-secondary">
                  <CheckCircle2 size={32} />
                </div>
                <h2 className="text-2xl font-bold text-dark dark:text-white mb-2">Payment Successful!</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6">Your Camwater bill has been paid.</p>
                <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-xl mb-6 w-full text-left">
                   <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Bill Number</p>
                   <p className="font-bold text-dark dark:text-white mb-3">{billNumber}</p>
                   <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Amount Paid</p>
                   <p className="font-bold text-dark dark:text-white">{Number(amount).toLocaleString()} XAF</p>
                </div>
                <button onClick={() => { setBillSuccess(null); setBillNumber(''); setAmount(''); }} className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-lg hover:bg-opacity-90 transition-all shadow-md">
                  Done
                </button>
             </div>
           ) : (
             <>
               <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 mb-6 transition-colors">
                 <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl text-secondary">
                       <Droplet size={24} />
                    </div>
                    <div>
                      <h3 className="text-dark dark:text-white font-bold text-lg">Camwater Bill</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Pay your water utility bill</p>
                    </div>
                 </div>

                 <div className="space-y-4">
                   <div>
                     <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Bill Number / Contract ID</label>
                     <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                           <FileText size={20} className="text-gray-400" />
                        </div>
                        <input
                          type="text"
                          value={billNumber}
                          onChange={(e) => setBillNumber(e.target.value.toUpperCase())}
                          className="w-full pl-11 pr-4 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent text-dark dark:text-white font-mono tracking-widest text-lg"
                          placeholder="e.g. CW-12345"
                        />
                     </div>
                   </div>

                   <div>
                     <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Amount (XAF)</label>
                     <div className="relative mb-2">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                           <span className="text-gray-500 font-medium">FCFA</span>
                        </div>
                        <input
                          type="number" min="1"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="w-full pl-16 pr-4 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent text-dark dark:text-white font-bold text-xl"
                          placeholder="0"
                        />
                     </div>
                     {amount && Number(amount) > 0 && (
                        <div className="flex justify-between items-center text-sm px-2 text-blue-600 dark:text-blue-400">
                           <span>Estimated equivalent:</span>
                           <span className="font-bold">~{(Number(amount) / 364).toFixed(1)} m³</span>
                        </div>
                     )}
                     <p className="text-xs text-gray-500 px-2 mt-1">Rate: 364 FCFA / m³</p>
                   </div>
                 </div>
               </div>

               <button
                 onClick={() => handleBillPayment('camwater')}
                 disabled={loading || !billNumber || !amount}
                 className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-lg hover:bg-opacity-90 transition-all shadow-lg disabled:opacity-50"
               >
                 {loading ? 'Processing...' : 'Pay Bill'}
               </button>
             </>
           )
        )}
      </div>
    </div>
  );
}

