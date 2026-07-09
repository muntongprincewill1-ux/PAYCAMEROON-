import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logout01Icon as LogOut, ArrowDownLeft01Icon as ArrowDownLeft, ArrowUpRight01Icon as ArrowUpRight, Copy01Icon as Copy, CheckmarkCircle02Icon as CheckCircle2, DollarCircleIcon as DollarSign, Wallet01Icon as Wallet, Store01Icon as Store, Settings01Icon as Settings, QrCodeIcon as QrCode, ChartIncreaseIcon as TrendingUp, TransactionHistoryIcon as History, Activity01Icon as Activity, Message01Icon as MessageSquare, CallIcon as Phone } from 'hugeicons-react';
import { QRCodeSVG } from 'qrcode.react';
import CopyPaycamId from '../components/CopyPaycamId';
import { NotificationsPopover } from '../components/Notifications';
import { Toaster, toast } from 'sonner';

export default function MerchantDashboard() {
  const [user, setUser] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'receive' | 'settle' | 'history'>('dashboard');
  
  // Settle & Actions
  const [settleTab, setSettleTab] = useState<'capital' | 'commission'>('capital');
  const [paycamId, setPaycamId] = useState('');
  const [amount, setAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('paycam_balance');
  const [destination, setDestination] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  const navigate = useNavigate();

  const fetchUserData = async (id: string) => {
    try {
      const res = await fetch(`/api/user/${id}`);
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        setTransactions(data.transactions || []);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
    } catch (err) {
      console.error(err);
    }
  };

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
    

    if (!parsedUser || parsedUser.role !== 'merchant') {
      navigate('/home');
      return;
    }
    setUser(parsedUser);
    fetchUserData(parsedUser._id);
  }, [navigate]);

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    let endpoint = '';
    let body: any = { merchantId: user._id, amount: Number(amount) };

    if (activeTab === 'settle') {
      if (settleTab === 'commission') {
        if (Number(amount) > (user.commissionBalance || 0)) {
          toast.error('Insufficient commission balance');
          setErrorMsg('Insufficient commission balance');
          setLoading(false);
          return;
        }
        endpoint = '/api/merchant/withdraw-commission';
        body.method = withdrawMethod;
        body.destination = destination;
      } else {
        if(!paycamId) {
          setErrorMsg('User PayCam ID required');
          setLoading(false);
          return;
        }
        endpoint = '/api/merchant/user-withdrawal';
        body.paycamId = paycamId.toUpperCase();
      }
    }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      
      if (res.ok) {
        setSuccessMsg(data.message || 'Operation successful!');
        const updatedUser = { 
          ...user, 
          balance: data.newBalance !== undefined ? data.newBalance : user.balance, 
          commissionBalance: data.newCommissionBalance !== undefined ? data.newCommissionBalance : user.commissionBalance 
        };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setPaycamId('');
        setAmount('');
        fetchUserData(updatedUser._id);
        setTimeout(() => setSuccessMsg(''), 5000);
      } else {
        setErrorMsg(data.error || 'Action failed');
      }
    } catch (err) {
      setErrorMsg('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) return <div className="flex h-screen items-center justify-center">Loading...</div>;

  // Calculate stats
  const receivedTxs = transactions.filter((t: any) => t.type === 'receive' || t.type === 'merchant_payment' || t.type === 'deposit');
  const totalSales = receivedTxs.reduce((sum, t) => sum + t.amount, 0);
  const totalTransactionsCount = receivedTxs.length;

  return (
    <div className="bg-gray-50 min-h-screen pb-24 font-sans">
      <Toaster position="top-right" />
      <div className="bg-primary px-6 pt-12 pb-8 rounded-b-[40px] shadow-lg text-white relative z-50">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center border border-white/30 backdrop-blur-sm">
              <Store size={24} className="text-white" />
            </div>
            <div>
              <p className="text-white/80 text-xs tracking-wider uppercase font-semibold">Merchant Portal</p>
              <h2 className="text-white font-bold text-xl">{user.businessName || user.name}</h2>
              <CopyPaycamId paycamId={user.paycamId} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href="tel:+237600000000" title="Call for Assist" className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
              <Phone size={20} className="text-white" />
            </a>
            <button onClick={() => navigate('/support')} title="PayChat" className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
              <MessageSquare size={20} className="text-white" />
            </button>
            <NotificationsPopover userId={user._id} />
            <button onClick={() => navigate('/settings')} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
              <Settings size={20} />
            </button>
            <button onClick={handleLogout} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
              <LogOut size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
            <p className="text-white/80 text-xs font-medium mb-1">Capital Balance</p>
            <h1 className="text-white text-2xl font-bold tracking-tight">
              {user.balance?.toLocaleString()} <span className="text-sm font-normal text-white/70">XAF</span>
            </h1>
          </div>
          <div className="bg-green-500/20 backdrop-blur-sm rounded-3xl p-5 border border-green-500/30">
            <p className="text-green-100 text-xs font-medium mb-1 flex items-center gap-1"><DollarSign size={14}/> Commission</p>
            <h1 className="text-white text-2xl font-bold tracking-tight">
              {user.commissionBalance?.toLocaleString()} <span className="text-sm font-normal text-white/70">XAF</span>
            </h1>
          </div>
        </div>
      </div>

      <div className="px-6 mt-6">
        {/* Navigation Tabs */}
        <div className="flex bg-white rounded-2xl shadow-sm p-1 border border-gray-100 mb-6">
          <button onClick={() => setActiveTab('dashboard')} className={`flex-1 flex flex-col items-center justify-center py-3 text-xs font-bold rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>
            <TrendingUp size={18} className="mb-1" /> Overview
          </button>
          <button onClick={() => setActiveTab('receive')} className={`flex-1 flex flex-col items-center justify-center py-3 text-xs font-bold rounded-xl transition-all ${activeTab === 'receive' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>
            <QrCode size={18} className="mb-1" /> Receive Pay
          </button>
          <button onClick={() => setActiveTab('settle')} className={`flex-1 flex flex-col items-center justify-center py-3 text-xs font-bold rounded-xl transition-all ${activeTab === 'settle' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>
            <Wallet size={18} className="mb-1" /> Settlement
          </button>
          <button onClick={() => setActiveTab('history')} className={`flex-1 flex flex-col items-center justify-center py-3 text-xs font-bold rounded-xl transition-all ${activeTab === 'history' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>
            <History size={18} className="mb-1" /> Reports
          </button>
        </div>

        {/* Tab Content */}
        <div>
          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl shadow-sm p-8 border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <Activity className="text-primary" /> Sales Tracking (Recent)
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100/50">
                    <p className="text-gray-500 text-sm font-medium mb-1">Total Volume</p>
                    <h4 className="text-2xl font-bold text-gray-900">{totalSales.toLocaleString()} <span className="text-sm font-normal text-gray-500">XAF</span></h4>
                  </div>
                  <div className="bg-purple-50/50 rounded-2xl p-4 border border-purple-100/50">
                    <p className="text-gray-500 text-sm font-medium mb-1">Transactions</p>
                    <h4 className="text-2xl font-bold text-gray-900">{totalTransactionsCount}</h4>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* RECEIVE PAY TAB */}
          {activeTab === 'receive' && (
            <div className="bg-white rounded-3xl shadow-sm p-8 border border-gray-100 text-center animate-in fade-in slide-in-from-bottom-4">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <QrCode className="text-primary" size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Accept Payment</h3>
              <p className="text-gray-500 text-sm mb-6">Show this QR code to customers so they can scan and pay seamlessly.</p>
              
              <div className="bg-gray-50 p-6 rounded-3xl border border-gray-200 inline-block mb-6 relative group">
                <QRCodeSVG value={`paycam://pay/${user.paycamId}`} size={200} />
                <div className="absolute inset-0 bg-black/60 rounded-3xl flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <p className="text-white font-bold mb-2">PayCam ID:</p>
                   <p className="text-white text-xl font-mono tracking-widest">{user.paycamId}</p>
                </div>
              </div>
              
              <div className="bg-blue-50 text-blue-800 p-4 rounded-2xl flex items-center justify-between text-left">
                 <div>
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Your PayCam ID</p>
                    <p className="font-bold text-xl tracking-widest">{user.paycamId}</p>
                 </div>
                 <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-primary hover:bg-gray-50 transition-colors"
                    onClick={() => { navigator.clipboard.writeText(user.paycamId); alert('Copied!') }}>
                    <Copy size={18} />
                 </button>
              </div>
            </div>
          )}

          {/* SETTLEMENT TAB */}
          {activeTab === 'settle' && (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
              <div className="flex border-b border-gray-100">
                <button 
                  className={`flex-1 py-4 text-sm font-bold text-center transition-colors ${settleTab === 'capital' ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-gray-600'}`}
                  onClick={() => setSettleTab('capital')}
                >
                  Customer Withdrawal
                </button>
                <button 
                  className={`flex-1 py-4 text-sm font-bold text-center transition-colors ${settleTab === 'commission' ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-gray-600'}`}
                  onClick={() => setSettleTab('commission')}
                >
                  Cashout Comm.
                </button>
              </div>

              <div className="p-6">
                {successMsg && (
                  <div className="bg-green-50 text-green-700 p-4 rounded-xl mb-6 text-sm border border-green-100 flex items-center gap-2 font-medium">
                    <CheckCircle2 size={18} className="shrink-0" /> {successMsg}
                  </div>
                )}
                {errorMsg && (
                  <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm border border-red-100 font-medium">
                    {errorMsg}
                  </div>
                )}

                <form onSubmit={handleAction} className="space-y-4">
                  {settleTab === 'capital' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">User PayCam ID</label>
                        <input
                          type="text"
                          value={paycamId}
                          onChange={(e) => setPaycamId(e.target.value)}
                          placeholder="PC12345678"
                          className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent text-lg font-medium transition-all uppercase"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Amount to Withdraw (XAF)
                        </label>
                        <input
                          type="number" min="1"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0"
                          className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent text-xl font-bold transition-all"
                          required
                        />
                      </div>
                    </>
                  )}

                  {settleTab === 'commission' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Amount to Withdraw (XAF)</label>
                        <input
                          type="number" min="1"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0"
                          className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent text-xl font-bold transition-all"
                          required
                          max={user.commissionBalance}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Withdraw To</label>
                        <select
                          value={withdrawMethod}
                          onChange={(e) => setWithdrawMethod(e.target.value)}
                          className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent text-sm font-medium transition-all"
                        >
                          <option value="paycam_balance">My PayCam Normal Balance</option>
                          <option value="bank">Bank Account</option>
                          <option value="mtn_momo">MTN Mobile Money</option>
                          <option value="orange_money">Orange Money</option>
                        </select>
                      </div>
                      {withdrawMethod !== 'paycam_balance' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Destination Account/Number</label>
                          <input
                            type="text"
                            value={destination}
                            onChange={(e) => setDestination(e.target.value)}
                            placeholder="Enter account detail"
                            className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            required
                          />
                        </div>
                      )}
                    </>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full text-white font-bold py-4 rounded-2xl shadow-lg transition-all active:scale-[0.98] mt-4 flex justify-center items-center gap-2 ${
                      settleTab === 'capital' ? 'bg-indigo-600 shadow-indigo-500/30 hover:bg-indigo-700' : 'bg-green-600 shadow-green-500/30 hover:bg-green-700'
                    }`}
                  >
                    {loading ? 'Processing...' : (
                      <>
                        {settleTab === 'capital' ? <ArrowDownLeft size={20} /> : <Wallet size={20} />}
                        {settleTab === 'capital' ? 'Process Customer Withdrawal' : 'Move Commission'}
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* HISTORY / RECORDS TAB */}
          {activeTab === 'history' && (
            <div className="bg-white rounded-3xl shadow-sm p-8 border border-gray-100 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-800">Transaction Reports</h3>
                <button onClick={() => navigate('/statements')} className="text-primary text-sm font-medium hover:underline">See All</button>
              </div>
              
              <div className="space-y-4">
                {transactions.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No records found.</p>
                ) : (
                  transactions.slice(0, 10).map((tx, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-gray-200 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                          tx.type === 'receive' || tx.type === 'deposit' ? 'bg-green-100 text-green-600' : 
                          'bg-red-100 text-red-600'
                        }`}>
                          {tx.type === 'receive' || tx.type === 'deposit' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{tx.recipient || 'Customer'}</p>
                          <p className="text-xs text-gray-500 truncate mt-0.5 capitalize">{tx.type.replace('_', ' ')} • {new Date(tx.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`font-bold ${tx.type === 'receive' || tx.type === 'deposit' ? 'text-green-600' : 'text-gray-900'}`}>
                          {Math.abs(tx.amount).toLocaleString()} XAF
                        </p>
                        {tx.fee > 0 && <p className="text-[10px] text-gray-400 mt-0.5">Fee: {tx.fee}</p>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
