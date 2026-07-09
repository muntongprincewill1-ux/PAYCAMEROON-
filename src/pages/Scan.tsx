import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { ArrowLeft01Icon as ArrowLeft, CheckmarkCircle02Icon as CheckCircle2, Alert01Icon as AlertCircle, ScanIcon as ScanLine, Store01Icon as Store } from 'hugeicons-react';
import { useTranslation } from 'react-i18next';

export default function Scan() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [user, setUser] = useState<any>(null);
  
  // States
  const [scannedId, setScannedId] = useState('');
  const [merchantName, setMerchantName] = useState('');
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'scan' | 'confirm' | 'success'>('scan');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }
    setUser(JSON.parse(storedUser));
  }, [navigate]);

  useEffect(() => {
    let html5QrCode: Html5Qrcode;

    if (step === 'scan' && user) {
      html5QrCode = new Html5Qrcode("qr-reader");
      const config = { fps: 10, qrbox: { width: 250, height: 250 } };

      html5QrCode.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          if (html5QrCode.isScanning) {
            html5QrCode.stop().then(() => {
              handleScan(decodedText);
            }).catch(console.error);
          }
        },
        (error) => {
          // ignore scan errors
        }
      ).catch((err) => {
        console.error("Failed to start scanner:", err);
      });

      return () => {
        if (html5QrCode && html5QrCode.isScanning) {
          html5QrCode.stop().catch(console.error);
        }
      };
    }
  }, [step, user]);

  const handleScan = async (text: string) => {
    if (text) {
      if (text.startsWith('paycam://pay/')) {
        const id = text.replace('paycam://pay/', '');
        setScannedId(id);
        await lookupMerchant(id);
      } else {
        // Just treat raw text as ID if someone generated standard QR
        setScannedId(text);
        await lookupMerchant(text);
      }
    }
  };

  const lookupMerchant = async (id: string) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/users/lookup?identifier=${id}`);
      const data = await res.json();
      if (res.ok) {
        setMerchantName(data.name || data.businessName);
        setStep('confirm');
      } else {
        setErrorMsg('User/Merchant not found from this QR code');
      }
    } catch (err) {
      setErrorMsg('Failed to lookup QR code information');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!amount || Number(amount) <= 0) {
      setErrorMsg('Please enter a valid amount');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/transactions/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user._id,
          amount: Number(amount),
          recipient: scannedId
        })
      });
      const data = await res.json();
      if (res.ok) {
        setStep('success');
        const updatedUser = { ...user, balance: user.balance - (Number(amount) * 1.01) }; // assume fee
        if (data.newBalance) updatedUser.balance = data.newBalance;
        localStorage.setItem('user', JSON.stringify(updatedUser));
      } else {
        setErrorMsg(data.error || 'Payment failed');
      }
    } catch (err) {
      setErrorMsg('Network error');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen font-sans">
      {/* Header */}
      <div className="bg-primary px-6 pt-12 pb-6 shadow-lg rounded-b-[30px] relative z-50">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-white hover:bg-white/10 p-2 rounded-full transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-white text-xl font-bold">{t('Scan to Pay', 'Scan to Pay')}</h1>
        </div>
      </div>

      <div className="px-6 py-8 h-full">
        {errorMsg && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6 mx-auto max-w-sm flex items-start gap-3 border border-red-100">
            <AlertCircle size={20} className="shrink-0 mt-0.5" />
            <p className="text-sm font-medium">{errorMsg}</p>
          </div>
        )}

        {step === 'scan' && (
          <div className="max-w-md mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl border border-gray-100 dark:border-gray-700 text-center animate-in fade-in zoom-in-95">
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ScanLine className="text-primary dark:text-blue-400" size={32} />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('Scan QR Code', 'Scan QR Code')}</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">{t('Position the PayCam QR code inside the frame to scan and pay.', 'Position the PayCam QR code inside the frame to scan and pay.')}</p>
              
              <div className="rounded-2xl overflow-hidden bg-black shadow-inner flex items-center justify-center min-h-[300px]">
                <div id="qr-reader" className="w-full text-white"></div>
              </div>
              
              {loading && <p className="text-primary font-bold mt-4 animate-pulse">{t('Looking up...', 'Looking up...')}</p>}

              <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                <p className="text-sm text-gray-500 font-medium mb-3">{t('Or enter PayCam ID', 'Or enter PayCam ID')}</p>
                <div className="flex gap-2">
                   <input type="text" placeholder="PC12345678" value={scannedId} onChange={(e) => setScannedId(e.target.value.toUpperCase())} className="flex-1 bg-gray-50 dark:bg-gray-700 dark:text-white border-none rounded-xl px-4 py-3 placeholder:text-gray-400 focus:ring-2 focus:ring-primary uppercase font-bold" />
                   <button onClick={() => lookupMerchant(scannedId)} disabled={loading || !scannedId} className="bg-primary text-white px-5 rounded-xl font-bold cursor-pointer disabled:opacity-50">{t('Go', 'Go')}</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 'confirm' && (
          <div className="max-w-md mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl border border-gray-100 dark:border-gray-700 animate-in fade-in slide-in-from-bottom-4">
              <div className="text-center mb-8">
                 <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/40 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white dark:border-gray-800 shadow-sm">
                   <Store className="text-primary dark:text-blue-400" size={40} />
                 </div>
                 <p className="text-gray-500 font-medium text-sm">{t('Paying', 'Paying')}</p>
                 <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{merchantName}</h2>
                 <p className="text-xs text-gray-400 font-mono mt-1">{scannedId}</p>
              </div>

              <div className="mb-8">
                <label className="block text-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('Amount (XAF)', 'Amount (XAF)')}</label>
                <input
                  type="number" min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="w-full text-center text-4xl font-bold bg-transparent border-b-2 border-gray-200 focus:border-primary focus:outline-none focus:ring-0 text-gray-900 dark:text-white placeholder:text-gray-300 pb-2"
                  autoFocus
                />
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-4 mb-8">
                 <div className="flex justify-between items-center text-sm mb-2">
                    <span className="text-gray-500">{t('Available Balance', 'Available Balance')}</span>
                    <span className="font-bold text-gray-900 dark:text-white">{user.balance?.toLocaleString()} XAF</span>
                 </div>
                 {amount && Number(amount) > 0 && (
                    <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-200 dark:border-gray-600">
                       <span className="text-gray-500">{t('Total + Fee (1%)', 'Total + Fee (1%)')}</span>
                       <span className="font-bold text-red-500">{(Number(amount) * 1.01).toLocaleString()} XAF</span>
                    </div>
                 )}
              </div>

              <button
                onClick={handlePayment}
                disabled={loading || !amount || Number(amount) <= 0}
                className="w-full bg-primary text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-blue-700 disabled:opacity-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {loading ? t('Processing...', 'Processing...') : t('Confirm Payment', 'Confirm Payment')}
              </button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="max-w-md mx-auto text-center mt-12 animate-in fade-in zoom-in-50">
            <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={48} className="text-green-500" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t('Payment Sent!', 'Payment Sent!')}</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8 font-medium">
              {t('Successfully paid', 'Successfully paid')} {Number(amount).toLocaleString()} XAF {t('to', 'to')} {merchantName}.
            </p>
            <button
              onClick={() => navigate('/home')}
              className="bg-primary text-white font-bold py-4 px-12 rounded-2xl shadow-lg hover:bg-blue-700 transition-all active:scale-[0.98]"
            >
              {t('Done', 'Done')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
