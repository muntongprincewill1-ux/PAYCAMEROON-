import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logout01Icon as LogOut, ArrowDownLeft01Icon as ArrowDownLeft, ArrowUpRight01Icon as ArrowUpRight, Copy01Icon as Copy, DollarCircleIcon as DollarSign, Wallet01Icon as Wallet, Settings01Icon as Settings, Location01Icon as MapPin, ChartIncreaseIcon as TrendingUp, TransactionHistoryIcon as History, Message01Icon as MessageSquare, CallIcon as Phone, Money01Icon as Banknote } from 'hugeicons-react';
import CopyPaycamId from '../components/CopyPaycamId';
import { NotificationsPopover } from '../components/Notifications';

export default function AgentDashboard() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'cash_in' | 'cash_out' | 'manage_float' | 'history' | 'analytics' | 'request_float' | 'withdraw_commission'>('cash_in');
  const [paycamId, setPaycamId] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [confirmStep, setConfirmStep] = useState(false);
  const [recipientName, setRecipientName] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('paycam_balance');
  const [stats, setStats] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
    } else {
      try {
        const parsedUser = JSON.parse(userData);
        if (!parsedUser || parsedUser.role !== 'agent') {
          navigate('/');
        } else {
          setUser(parsedUser);
          fetchStats(parsedUser._id);
        }
      } catch (e) {
        navigate('/login');
      }
    }
  }, [navigate]);

  useEffect(() => {
    setError('');
    setSuccessMsg('');
    setPaycamId('');
    setAmount('');
    setConfirmStep(false);
    setRecipientName('');
  }, [activeTab, user]);

  
  const handleWithdrawCommission = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    try {
      let dest = '';
      if (withdrawMethod !== 'paycam_balance') {
         dest = paycamId; // Reusing paycamId state for phone number input
         if (!dest) { setError("Please enter mobile money number"); return; }
      }
      const res = await fetch('/api/agent/withdraw-commission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: user._id,
          amount: Number(amount),
          method: withdrawMethod,
          destination: dest
        })
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setSuccessMsg(`Commission successfully withdrawn via ${withdrawMethod === 'paycam_balance' ? 'PayCam Balance' : withdrawMethod.toUpperCase()}.`);
        setUser({ ...user, balance: data.newBalance, commissionBalance: data.newCommissionBalance });
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({ ...userData, balance: data.newBalance, commissionBalance: data.newCommissionBalance }));
        setAmount('');
        setPaycamId(''); // Clear phone number input
      }
    } catch (err) {
      setError('Failed to withdraw commission');
    }
  };

  const fetchStats = async (id: string) => {
    try {
      const res = await fetch(`/api/agent/${id}/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
        setUser(prev => ({ ...prev, balance: data.floatBalance ?? prev.balance, commissionBalance: data.commissionBalance ?? prev.commissionBalance }));
      }
    } catch {}
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    
    try {
      const res = await fetch(`/api/users/lookup?identifier=${paycamId}`);
      const data = await res.json();
      if (res.ok && data.name) {
        setRecipientName(data.name);
        setConfirmStep(true);
      } else {
        setError(data.error || 'User not found');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  const handleTransaction = async () => {
    setError('');
    setSuccessMsg('');

    let endpoint = '';
    let body: any = { agentId: user._id, amount: Number(amount), paycamId: paycamId.toUpperCase() };

    if (activeTab === 'cash_in') {
      endpoint = '/api/agent/cash-in';
    } else if (activeTab === 'cash_out') {
      endpoint = '/api/agent/cash-out';
    } else if (activeTab === 'manage_float') {
      endpoint = '/api/agent/transfer-float';
    }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (res.ok) {
        setSuccessMsg(data.message || 'Transaction successful');
        setPaycamId('');
        setAmount('');
        setConfirmStep(false);
        setRecipientName('');
        fetchStats(user._id);
      } else {
        setError(data.error || 'Transaction failed');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  const handleRequestFloat = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/agent/request-float', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: user._id, amount: Number(amount) })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message || 'Float request submitted successfully');
        setAmount('');
      } else {
        setError(data.error || 'Failed to request float');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-20">
      {/* Header */}
      <div className="bg-[#1E1B4B] rounded-b-[40px] pt-12 pb-8 px-6 shadow-lg relative z-50">
        <div className="max-w-md mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-white text-xl font-medium opacity-90">Agent Dashboard</h1>
              <div className="mt-1">
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
                <Settings size={20} className="text-white" />
              </button>
              <button onClick={handleLogout} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                <LogOut size={20} className="text-white" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 rounded-3xl p-8 border border-white/20 backdrop-blur-md">
              <p className="text-white/70 text-sm font-medium mb-1">Total Float</p>
              <h2 className="text-white text-2xl font-bold tracking-tight">
                {user.balance?.toLocaleString()} <span className="text-sm font-normal opacity-80">XAF</span>
              </h2>
            </div>
            <div className="bg-white/10 rounded-3xl p-8 border border-white/20 backdrop-blur-md">
              <p className="text-white/70 text-sm font-medium mb-1">Commission</p>
              <h2 className="text-white text-2xl font-bold tracking-tight text-green-400">
                +{user.commissionBalance?.toLocaleString() || 0} <span className="text-sm font-normal opacity-80">XAF</span>
              </h2>
              <button 
                onClick={() => setActiveTab('withdraw_commission')}
                className="mt-2 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold py-1.5 px-3 rounded-full transition-colors"
              >
                Withdraw
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto px-6 -mt-4 relative z-10">
        
        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm p-1.5 flex gap-1 mb-6 overflow-x-auto pb-1 hide-scrollbar">
          <button 
            onClick={() => setActiveTab('cash_in')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap flex items-center justify-center gap-2 ${activeTab === 'cash_in' ? 'bg-[#1E1B4B] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <ArrowUpRight size={16} /> Cash In
          </button>
          <button 
            onClick={() => setActiveTab('cash_out')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap flex items-center justify-center gap-2 ${activeTab === 'cash_out' ? 'bg-[#1E1B4B] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <ArrowDownLeft size={16} /> Cash Out
          </button>
          <button 
            onClick={() => setActiveTab('manage_float')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap flex items-center justify-center gap-2 ${activeTab === 'manage_float' ? 'bg-[#1E1B4B] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <Wallet size={16} /> Send Float
          </button>
          <button 
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap flex items-center justify-center gap-2 ${activeTab === 'analytics' ? 'bg-[#1E1B4B] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <TrendingUp size={16} /> Stats
          </button>
          <button 
            onClick={() => setActiveTab('request_float')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap flex items-center justify-center gap-2 ${activeTab === 'request_float' ? 'bg-[#1E1B4B] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <Banknote size={16} /> Request Float
          </button>
        </div>

        {/* Form area */}
        {activeTab === 'request_float' && (
          <div className="bg-white rounded-3xl shadow-sm p-8 mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Banknote className="text-indigo-600" /> Request Float
            </h3>
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-medium mb-6 border border-red-100 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-600"></div>
                {error}
              </div>
            )}
            {successMsg && (
              <div className="bg-green-50 text-green-700 p-4 rounded-2xl text-sm font-medium mb-6 border border-green-100 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-600"></div>
                {successMsg}
              </div>
            )}
            <form onSubmit={handleRequestFloat} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2 opacity-80">Amount (XAF)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">XAF</span>
                  <input
                    type="number" min="1"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-gray-50 border-0 rounded-2xl pl-14 pr-4 py-4 text-gray-900 font-bold text-lg placeholder-gray-400 focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all"
                    placeholder="0"
                  />
                </div>
              </div>
              <button 
                type="submit" 
                className="w-full bg-[#1E1B4B] text-white rounded-2xl py-4 font-bold text-lg hover:bg-[#2e2a6b] active:scale-[0.98] transition-all mt-4"
              >
                Submit Float Request
              </button>
            </form>
          </div>
        )}

        {(activeTab === 'cash_in' || activeTab === 'cash_out' || activeTab === 'manage_float') && (
          <div className="bg-white rounded-3xl shadow-sm p-8 mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              {activeTab === 'cash_in' ? <><ArrowUpRight className="text-indigo-600" /> Cash In to User</> : activeTab === 'cash_out' ? <><ArrowDownLeft className="text-red-500" /> Cash Out from User</> : <><Wallet className="text-indigo-600" /> Transfer Float to Merchant</>}
            </h3>
            
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-medium mb-6 border border-red-100 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-600"></div>
                {error}
              </div>
            )}
            {successMsg && (
              <div className="bg-green-50 text-green-700 p-4 rounded-2xl text-sm font-medium mb-6 border border-green-100 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-600"></div>
                {successMsg}
              </div>
            )}

            {confirmStep ? (
              <div className="space-y-4">
                <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                  <p className="text-sm text-indigo-800 font-medium mb-1">Verify Recipient</p>
                  <p className="text-indigo-900 font-bold text-lg">{recipientName}</p>
                  <p className="text-sm text-indigo-600 block mt-1">{paycamId}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <p className="text-sm text-gray-500 font-medium mb-1">Amount to {activeTab === 'cash_in' ? 'Deposit' : activeTab === 'manage_float' ? 'Transfer' : 'Withdraw'}</p>
                  <p className="text-gray-900 font-bold text-lg">{Number(amount).toLocaleString()} XAF</p>
                </div>
                <div className="flex gap-3 mt-4">
                  <button 
                    type="button"
                    onClick={() => setConfirmStep(false)}
                    className="flex-1 bg-gray-100 text-gray-700 rounded-2xl py-4 font-bold text-lg hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    onClick={handleTransaction}
                    className="flex-1 bg-[#1E1B4B] text-white rounded-2xl py-4 font-bold text-lg hover:bg-[#2e2a6b] active:scale-[0.98] transition-all"
                  >
                    Confirm {activeTab === 'cash_in' ? 'Deposit' : activeTab === 'manage_float' ? 'Transfer' : 'Withdrawal'}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleLookup} className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2 opacity-80">{activeTab === 'manage_float' ? 'Merchant PayCam ID' : 'User PayCam ID'}</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={paycamId}
                      onChange={(e) => setPaycamId(e.target.value.toUpperCase())}
                      className="w-full bg-gray-50 border-0 rounded-2xl px-4 py-4 text-gray-900 font-medium placeholder-gray-400 focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all uppercase"
                      placeholder="PC..."
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2 opacity-80">Amount (XAF)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">XAF</span>
                    <input
                      type="number" min="1"
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-gray-50 border-0 rounded-2xl pl-14 pr-4 py-4 text-gray-900 font-bold text-lg placeholder-gray-400 focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all"
                      placeholder="0"
                    />
                  </div>
                </div>
                <button 
                  type="submit" 
                  className="w-full bg-[#1E1B4B] text-white rounded-2xl py-4 font-bold text-lg hover:bg-[#2e2a6b] active:scale-[0.98] transition-all mt-4"
                >
                  {activeTab === 'manage_float' ? 'Verify Merchant' : 'Verify User'}
                </button>
              </form>
            )}
          </div>
        )}

        
        {activeTab === 'withdraw_commission' && (
          <div className="bg-white rounded-3xl shadow-sm p-8 mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <DollarSign className="text-indigo-600" /> Withdraw Commission
            </h3>
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-medium mb-6 border border-red-100 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-600"></div>
                {error}
              </div>
            )}
            {successMsg && (
              <div className="bg-green-50 text-green-700 p-4 rounded-2xl text-sm font-medium mb-6 border border-green-100 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-600"></div>
                {successMsg}
              </div>
            )}
            <form onSubmit={handleWithdrawCommission} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2 opacity-80">Withdraw To</label>
                <div className="relative">
                  <select 
                    value={withdrawMethod}
                    onChange={(e) => setWithdrawMethod(e.target.value)}
                    className="w-full bg-gray-50 border-0 rounded-2xl px-4 py-4 text-gray-900 font-medium focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all appearance-none"
                  >
                    <option value="paycam_balance">Main PayCam Balance</option>
                    <option value="mtn">MTN Mobile Money</option>
                    <option value="orange">Orange Money</option>
                  </select>
                </div>
              </div>
              
              {withdrawMethod !== 'paycam_balance' && (
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2 opacity-80">Phone Number</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={paycamId} // reusing state
                      onChange={(e) => setPaycamId(e.target.value)}
                      className="w-full bg-gray-50 border-0 rounded-2xl px-4 py-4 text-gray-900 font-medium placeholder-gray-400 focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all"
                      placeholder="e.g. 670000000"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2 opacity-80">Amount (XAF)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">XAF</span>
                  <input
                    type="number" min="1"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-gray-50 border-0 rounded-2xl pl-14 pr-4 py-4 text-gray-900 font-bold text-lg placeholder-gray-400 focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all"
                    placeholder="0"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2 ml-2">Available: {user.commissionBalance?.toLocaleString()} XAF</p>
              </div>
              <button 
                type="submit" 
                className="w-full bg-[#1E1B4B] text-white rounded-2xl py-4 font-bold text-lg hover:bg-[#2e2a6b] active:scale-[0.98] transition-all mt-4"
              >
                Withdraw Commission
              </button>
            </form>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && stats && (
          <div className="space-y-4 mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp className="text-indigo-600" /> Daily Settlement Report
            </h3>
            
            <div className="bg-white rounded-3xl shadow-sm p-8 border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium mb-1">Daily Volume</p>
                <h4 className="text-2xl font-bold text-gray-900">{stats.dailyVolume?.toLocaleString()} XAF</h4>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
                <DollarSign className="text-indigo-600" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-3xl shadow-sm p-8 border border-gray-100">
                <p className="text-sm text-gray-500 font-medium mb-1">Transactions</p>
                <h4 className="text-2xl font-bold text-gray-900">{stats.dailyTransactions}</h4>
              </div>
              <div className="bg-white rounded-3xl shadow-sm p-8 border border-gray-100">
                <p className="text-sm text-gray-500 font-medium mb-1">Success Rate</p>
                <h4 className="text-2xl font-bold text-[#1E1B4B]">{stats.successRate}%</h4>
              </div>
            </div>
            
            <button 
              onClick={() => navigate('/statements')}
              className="w-full mt-4 flex items-center justify-center gap-2 bg-indigo-50 text-indigo-700 py-3 rounded-2xl font-semibold hover:bg-indigo-100 transition-colors"
            >
              <History size={18} /> View Full History
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
