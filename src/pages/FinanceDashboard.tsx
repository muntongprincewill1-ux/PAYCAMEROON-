import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Logout01Icon as LogOut, ArrowUpRight01Icon as ArrowUpRight, CheckmarkCircle01Icon as CheckCircle, Clock01Icon as ClockIcon, Activity01Icon as Activity, DollarCircleIcon as DollarSign, Briefcase01Icon as Briefcase, File01Icon as FileText, Settings01Icon as Settings, ListViewIcon as List, Search01Icon as Search, Building01Icon as Landmark, Download01Icon as Download, Upload01Icon as Upload, PieChartIcon as PieChart, Alert01Icon as ShieldAlert, ViewIcon as Eye, ViewOffIcon as EyeOff, UserGroupIcon as Users, Globe02Icon as Globe, BarChartIcon as BarChart2, ChartIncreaseIcon as TrendingUp, FilterIcon as Filter, Cancel01Icon as X, Money01Icon as Banknote, Wallet01Icon as Wallet } from 'hugeicons-react';
import { Toaster, toast } from 'sonner';

export default function FinanceDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [ledger, setLedger] = useState<any>([]);
  const [lookupPaycamId, setLookupPaycamId] = useState('');
  const [userHistory, setUserHistory] = useState<any[] | null>(null);
  const [treasury, setTreasury] = useState<any>(null);
  const [taxRate, setTaxRate] = useState<number>(19.25);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'ledger' | 'treasury' | 'reports' | 'settings' | 'agents_float' | 'merchants_withdraw'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferBank, setTransferBank] = useState('');
  const [transferMemo, setTransferMemo] = useState('');
  const [transferSource, setTransferSource] = useState('');
  const [transferDest, setTransferDest] = useState('');
  const [transferBankAmount, setTransferBankAmount] = useState('');
  const [transferBankDest, setTransferBankDest] = useState('Ecobank');
  const [pinModal, setPinModal] = useState<{ isOpen: boolean, accountId: string, amount: number } | null>(null);
  const [floatRequests, setFloatRequests] = useState<any[]>([]);
  const [agentPaycamId, setAgentPaycamId] = useState('');
  const [merchantWithdrawPaycamId, setMerchantWithdrawPaycamId] = useState('');
  const [merchantWithdrawAmount, setMerchantWithdrawAmount] = useState('');
  const navigate = useNavigate();

  const [treasurySubTab, setTreasurySubTab] = useState<'overview' | 'accounts' | 'wallets' | 'transfers' | 'liquidity' | 'reconciliation'>('overview');
  const [showBalances, setShowBalances] = useState(false);

  const formatSecuredValue = (value: number | undefined) => {
    if (!showBalances) return '••••••••';
    return (value || 0).toLocaleString();
  };

  // MOCK TREASURY STATES FOR FULL FUNCTIONALITY
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [internalWallets, setInternalWallets] = useState<any[]>([]);

  const [isReconciling, setIsReconciling] = useState(false);
  const [reconProgress, setReconProgress] = useState(0);
  const [reconciliationQueue, setReconQueue] = useState([
    { id: 'REQ-1001', date: new Date().toISOString(), type: 'Settlement', externalId: 'MTN-99812', amount: 50000, internalId: 'MTN-99812', internalAmount: 50000, internalDate: new Date().toISOString(), status: 'Unmatched', exception: 'Missing Internal Record' },
    { id: 'REQ-1002', date: new Date().toISOString(), type: 'Deposit', externalId: 'UBA-77123', amount: 150000, internalId: 'UBA-77123', internalAmount: 150500, internalDate: new Date().toISOString(), status: 'Partial Match', exception: 'Amount Mismatch (Expected 150,500)' },
    { id: 'REQ-1003', date: new Date().toISOString(), type: 'Withdrawal', externalId: 'ORG-12344', amount: 20000, internalId: 'ORG-12344', internalAmount: 20000, internalDate: new Date().toISOString(), status: 'Failed', exception: 'Settlement Failure' },
  ]);

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedAccountHistory, setSelectedAccountHistory] = useState<any>(null);
  const [accountHistoryLogs, setAccountHistoryLogs] = useState<any[]>([]);

  const fetchAccountHistory = (accountId: string, accountName: string) => {
     setSelectedAccountHistory({ id: accountId, name: accountName });
     setAccountHistoryLogs(treasury?.transactions?.filter((t: any) => t.accountId === accountId || t.bank === accountName) || []);
     setShowHistoryModal(true);
  };


  const LIQUIDITY_THRESHOLD = 5000000;
  const notifiedWallets = useRef(new Set<string>());

  useEffect(() => {
    internalWallets.forEach(wallet => {
      if (wallet.balance < LIQUIDITY_THRESHOLD) {
        if (!notifiedWallets.current.has(wallet.id)) {
            toast.error(`Low Liquidity: ${wallet.name}`, {
                description: `Balance fell to ${wallet.balance.toLocaleString()} XAF (Below 5M limit).`
            });
            notifiedWallets.current.add(wallet.id);
        }
      } else {
         if (notifiedWallets.current.has(wallet.id)) {
             toast.success(`Liquidity Restored: ${wallet.name}`, {
                 description: `Balance is healthy at ${wallet.balance.toLocaleString()} XAF.`
             });
             notifiedWallets.current.delete(wallet.id);
         }
      }
    });
  }, [internalWallets]);

  const handleRunAutoEngine = async () => {
    setIsReconciling(true);
    setReconProgress(0);
    
    for (let i = 0; i < reconciliationQueue.length; i++) {
        setReconProgress((i / reconciliationQueue.length) * 100);
        await new Promise(resolve => setTimeout(resolve, 800));
        
        setReconQueue(prev => {
            const newQueue = [...prev];
            const item = newQueue[i];
            
            if (item.externalId === item.internalId && item.amount === item.internalAmount && item.date.slice(0, 10) === item.internalDate.slice(0, 10)) {
                newQueue[i].status = 'Matched';
                newQueue[i].exception = 'Auto-matched successfully';
            }
            return newQueue;
        });
    }
    
    setReconProgress(100);
    setTimeout(() => {
        setIsReconciling(false);
        setReconProgress(0);
    }, 1000);
  };

  const handleInternalTreasuryTransfer = () => {
    if (!transferAmount || isNaN(Number(transferAmount)) || Number(transferAmount) <= 0) return alert('Enter a valid amount');
    fetch('/api/finance/request-approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            type: 'wallet_transfer',
            title: `Treasury Transfer`,
            desc: transferMemo ? `${transferMemo} (${Number(transferAmount).toLocaleString()} XAF)` : `Transfer ${Number(transferAmount).toLocaleString()} XAF from ${transferSource} to ${transferDest}`,
            amount: Number(transferAmount),
            metadata: { fromId: transferSource, toId: transferDest, amount: Number(transferAmount), memo: transferMemo }
        })
    }).then(res => res.json()).then(() => {
        toast.info('Transfer requested and sent for admin approval.');
        setTransferAmount('');
        setTransferMemo('');
    });
  };

  const handleWalletTransfer = (fromId: string, toId: string, amount: number) => {
    if(!amount || amount <= 0) return alert('Invalid amount');
    
    fetch('/api/finance/request-approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            type: 'wallet_transfer',
            title: `Internal Transfer`,
            desc: `Transfer ${amount.toLocaleString()} XAF from ${fromId} to ${toId}`,
            amount: amount,
            metadata: { fromId, toId, amount }
        })
    }).then(res => res.json()).then(() => {
        toast.info('Transfer requested and sent for admin approval.');
    });
  };

  const handleBankTopup = (id: string, amount: number) => {
     if(!amount || amount <= 0) return alert('Invalid amount');
     setPinModal({ isOpen: true, accountId: id, amount });
  };

  const handlePinSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const pin = formData.get("pin") as string;
      
      if (pin && pin.length === 5 && /^\d{5}$/.test(pin)) {
          fetch('/api/finance/request-approval', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  type: 'bank_topup',
                  title: `Bank Top-up Request`,
                  desc: `Top-up account ${pinModal?.accountId} with ${pinModal?.amount?.toLocaleString()} XAF`,
                  amount: pinModal?.amount,
                  metadata: { id: pinModal?.accountId, amount: pinModal?.amount }
              })
          }).then(res => res.json()).then(() => {
              toast.info('Top-up requested and sent for admin approval.');
              setPinModal(null);
          });
      } else {
          toast.error('Invalid PIN. Must be 5 digits.');
      }
  };

  const handleReconcileStatus = (id: string, status: string) => {
    setReconQueue(prev => prev.map(r => r.id === id ? { ...r, status, exception: 'Resolved manually' } : r));
    alert('Reconciliation status updated');
  };

  const handleUserLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupPaycamId) return;
    try {
      const res = await fetch(`/api/finance/user-history/${lookupPaycamId}`);
      if (res.ok) {
        const data = await res.json();
        setUserHistory(data.transactions);
      } else {
        toast.error('User not found or error fetching history');
        setUserHistory(null);
      }
    } catch (err) {
      toast.error('Error fetching history');
      setUserHistory(null);
    }
  };

  const handleApproveFloatRequest = async (id: string) => {
    if (user.level === 1) return alert('Finance Analyst is read-only');
    try {
      const res = await fetch(`/api/finance/float-requests/${id}/approve`, { method: 'POST' });
      if (res.ok) {
        alert('Approved successfully');
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (e) {
      alert('Error approving');
    }
  };

  const handleMerchantWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user.level === 1) return toast.error('Finance Analyst is read-only');
    try {
      const res = await fetch('/api/finance/merchant/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paycamId: merchantWithdrawPaycamId,
          amount: Number(merchantWithdrawAmount)
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setMerchantWithdrawPaycamId('');
        setMerchantWithdrawAmount('');
        fetchData();
      } else {
        toast.error(data.error || 'Failed to withdraw from merchant');
      }
    } catch (err) {
      toast.error('Withdrawal failed');
    }
  };

  const handleSendFloat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user.level === 1) return alert('Finance Analyst is read-only');
    if (!agentPaycamId || !transferAmount) return;
    try {
      const res = await fetch('/api/finance/float/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paycamId: agentPaycamId, amount: Number(transferAmount) })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Float sent successfully');
        setAgentPaycamId('');
        setTransferAmount('');
        fetchData();
      } else {
        alert(data.error);
      }
    } catch (e) {
      alert('Error sending float');
    }
  };

  const fetchData = () => {
    Promise.all([
      fetch('/api/finance/stats').then(res => res.json()),
      fetch('/api/finance/ledger').then(res => res.json()),
      fetch('/api/finance/settings').then(res => res.json()),
      fetch('/api/finance/treasury').then(res => res.json()),
      fetch('/api/finance/float-requests').then(res => res.json())
    ]).then(([statsData, ledgerData, settingsData, treasuryData, floatRequestsData]) => {
      setStats(statsData);
      setLedger(ledgerData.transactions || []);
      setTaxRate(settingsData.taxRate || 19.25);
      setTreasury(treasuryData);
      if (treasuryData.bankAccounts) setBankAccounts(treasuryData.bankAccounts);
      if (treasuryData.internalWallets) setInternalWallets(treasuryData.internalWallets);
      setFloatRequests(floatRequestsData.requests || []);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    fetchData();
    const interval = setInterval(() => {
        fetchData();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const saveSettings = () => {
    fetch('/api/finance/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taxRate })
    }).then(res => res.json())
      .then(data => alert('Settings saved successfully'))
      .catch(() => alert('Failed to save settings'));
  };

  const handleSettle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const btn = e.currentTarget as HTMLButtonElement;
    const oldText = btn.innerText;
    btn.innerText = '...';
    btn.disabled = true;

    fetch(`/api/finance/settle/${id}`, { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          fetchData(); // refresh
        } else {
          btn.innerText = oldText;
          btn.disabled = false;
        }
      })
      .catch(() => {
        btn.innerText = oldText;
        btn.disabled = false;
      });
  };

  const handleProcessBatch = () => {
    const pendingIds = stats?.recentSettlements
      ?.filter((tx: any) => tx.status !== 'completed')
      .map((tx: any) => tx._id);

    if (!pendingIds || pendingIds.length === 0) {
      alert("No pending settlements to process");
      return;
    }

    Promise.all(pendingIds.map((id: string) => 
      fetch(`/api/finance/settle/${id}`, { method: 'POST' })
    )).then(() => {
      fetchData();
    });
  };

  const handleManualSweep = () => {
    if (!transferAmount || isNaN(Number(transferAmount))) return alert('Enter a valid amount');
    fetch('/api/finance/request-approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            type: 'sweep',
            title: `Manual Sweep`,
            desc: `Sweep ${Number(transferAmount).toLocaleString()} XAF to platform treasury`,
            amount: Number(transferAmount),
            metadata: { amount: Number(transferAmount) }
        })
    }).then(res => res.json()).then(() => {
        toast.info('Sweep requested and sent for admin approval.');
        setTransferAmount('');
    });
  };

  const handleBankTransfer = () => {
    if (!transferAmount || isNaN(Number(transferAmount))) return alert('Enter a valid amount');
    if (!transferBank) return alert('Select a destination account');
    
    const profitBalance = treasury?.balance || 0;
    if (Number(transferAmount) > profitBalance) {
        toast.error('Insufficient profit balance');
        fetch('/api/admin/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: 'Failed Profit Withdrawal Attempt',
                message: `Finance attempted to withdraw ${Number(transferAmount).toLocaleString()} XAF to ${transferBank} which exceeds actual profit balance of ${profitBalance.toLocaleString()} XAF.`
            })
        });
        return;
    }

    fetch('/api/finance/request-approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            type: 'profit_withdrawal',
            title: `Profit Withdrawal`,
            desc: `Withdraw ${Number(transferAmount).toLocaleString()} XAF from platform profits to ${transferBank}`,
            amount: Number(transferAmount),
            metadata: { amount: Number(transferAmount), bank: transferBank }
        })
    }).then(res => res.json()).then(() => {
        toast.info('Profit withdrawal requested and sent for admin approval.');
        setTransferAmount('');
    });
  };

  const handleDownloadReport = (title: string) => {
    let csvContent = "";
    
    // Process real ledger data for reports
    const txByMonth = ledger.reduce((acc: any, t: any) => {
      const month = new Date(t.createdAt).toLocaleString('default', { month: 'short' });
      if (!acc[month]) acc[month] = { count: 0, volume: 0, users: new Set() };
      acc[month].count++;
      acc[month].volume += (t.amount || 0);
      acc[month].users.add(t.userId);
      return acc;
    }, {});

    if (title === "User Activity Behavior") {
      const userActivity = ledger.reduce((acc: any, t: any) => {
        if (!acc[t.userId]) acc[t.userId] = { txCount: 0, volume: 0, firstSeen: t.createdAt };
        acc[t.userId].txCount++;
        acc[t.userId].volume += t.amount;
        if (new Date(t.createdAt) < new Date(acc[t.userId].firstSeen)) acc[t.userId].firstSeen = t.createdAt;
        return acc;
      }, {});
      csvContent = "data:text/csv;charset=utf-8,User ID,Total Transactions,Total Volume (XAF),Account First Active\n" +
        Object.entries(userActivity).map(([u, data]: any) => `${u},${data.txCount},${data.volume},${new Date(data.firstSeen).toLocaleDateString()}`).join("\n");
      
    } else if (title === "Transaction Network Flows") {
      const flows = ledger.filter((t: any) => t.recipient).reduce((acc: any, t: any) => {
        const pair = `${t.userId}->${t.recipient}`;
        if (!acc[pair]) acc[pair] = { count: 0, volume: 0, type: t.type };
        acc[pair].count++;
        acc[pair].volume += t.amount;
        return acc;
      }, {});
      csvContent = "data:text/csv;charset=utf-8,Sender ID,Recipient/Target,Tx Type,Total Count,Total Volume (XAF)\n" +
        Object.entries(flows).map(([pair, data]: any) => `${pair.split('->')[0]},${pair.split('->')[1]},${data.type},${data.count},${data.volume}`).join("\n");
        
    } else if (title === "Adoption & Growth Trends") {
      csvContent = "data:text/csv;charset=utf-8,Month,Active Users,Total Transactions,Total Volume (XAF)\n" +
        Object.entries(txByMonth).map(([month, data]: any) => `${month},${data.users.size},${data.count},${data.volume}`).join("\n");
        
    } else if (title === "Merchant Volume Index") {
      const merchActivity = ledger.filter((t: any) => t.type === 'pay_merchant').reduce((acc: any, t: any) => {
        if (!acc[t.recipient]) acc[t.recipient] = { txCount: 0, volume: 0 };
        acc[t.recipient].txCount++;
        acc[t.recipient].volume += t.amount;
        return acc;
      }, {});
      csvContent = "data:text/csv;charset=utf-8,Merchant/Target ID,Total TX Count,Total Processed Volume (XAF)\n" +
        Object.entries(merchActivity).map(([u, data]: any) => `${u},${data.txCount},${data.volume}`).join("\n");
        
    } else if (title === "Monthly Income Statement" || title === "Monthly P&L Statement") {
      csvContent = "data:text/csv;charset=utf-8,Month,Gross Revenue / Fees (XAF),Active Trx Vol (XAF)\n" +
        Object.entries(txByMonth).map(([month, data]: any) => {
          const fees = ledger.filter((t: any) => new Date(t.createdAt).toLocaleString('default', { month: 'short' }) === month).reduce((a: any, b: any) => a + (b.fee || 0), 0);
          return `${month},${fees},${data.volume}`;
        }).join("\n");
        
    } else if (title === "Tax Withholding Report") {
      csvContent = "data:text/csv;charset=utf-8,Date,TxID,Gross Amount (XAF),Tax Withheld (XAF)\n" +
        ledger.filter((t: any) => t.fee > 0).map((t: any) => `${new Date(t.createdAt).toISOString()},${t._id},${t.amount},${(t.fee * (taxRate/100)).toFixed(2)}`).join("\n");
        
    } else if (title === "Merchant Settlement Logs") {
      csvContent = "data:text/csv;charset=utf-8,Date,TxID,Merchant/User ID,Settled Amount (XAF)\n" +
        ledger.filter((t: any) => t.type === 'withdraw' || t.type === 'settle').map((t: any) => `${new Date(t.createdAt).toISOString()},${t._id},${t.userId},${t.amount}`).join("\n");
        
    } else if (title === "Balance Sheet" || title === "Bank Reconciliation") {
      csvContent = `data:text/csv;charset=utf-8,Category,Amount\nCorporate Treasury,${treasury?.balance || 0}\nSystem Liability,${stats?.totalLiability || 0}\nRevenue,${stats?.totalRevenue || 0}`;
    } else {
      // Global E-Journal / Raw Dump
      csvContent = "data:text/csv;charset=utf-8,ID,Date,Type,Amount,Fee,Status,User,Recipient\n" 
        + ledger.map((t: any) => `${t._id},${new Date(t.createdAt).toISOString()},${t.type},${t.amount},${t.fee},${t.status},${t.userId},${t.recipient}`).join("\n");
    }
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${title.replace(/\s+/g, '_').toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div></div>;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-dark text-white p-3 rounded-lg shadow-xl border border-gray-800 text-xs text-left">
          <p className="font-bold mb-2 opacity-70">{label}</p>
          {payload.map((entry: any, index: number) => (
             <p key={`item-${index}`} className="font-medium mb-1" style={{ color: entry.color }}>
                 {entry.name}: {entry.value?.toLocaleString() || 0} XAF
             </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-20 font-sans text-slate-900">
      <Toaster position="top-right" richColors expand={true} />
      <div className="bg-white px-8 pt-10 border-b border-slate-200 flex flex-col gap-8 sticky top-0 z-20 shadow-sm relative">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900"></div>
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-sm border border-slate-800">
              <Landmark size={24} strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-slate-900 font-extrabold text-2xl tracking-tight">Financial Control</h1>
              <p className="text-slate-500 text-xs font-mono tracking-widest text-left uppercase mt-0.5">Corporate Treasury & Ledger</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col items-end mr-4">
               <span className="text-xs font-bold text-slate-900">System Online</span>
               <span className="text-[10px] font-mono text-emerald-600">Reconciled • {new Date().toLocaleTimeString()}</span>
            </div>
            <button onClick={() => setShowBalances(!showBalances)} className="p-2.5 bg-white text-slate-400 hover:text-slate-900 rounded-lg border border-slate-200 hover:border-slate-300 transition shadow-sm" aria-label="Toggle Balances">
              {showBalances ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            <button onClick={handleLogout} className="p-2.5 bg-white text-slate-400 hover:text-slate-900 rounded-lg border border-slate-200 hover:border-slate-300 transition shadow-sm" aria-label="Logout">
              <LogOut size={18} />
            </button>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-8 mt-2 overflow-x-auto pb-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
           <button onClick={() => setActiveTab('overview')} className={`pb-4 whitespace-nowrap text-sm font-semibold border-b-[3px] transition ${activeTab === 'overview' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>
             <span className="flex items-center gap-2"><Activity size={16}/> Overview</span>
           </button>
           <button onClick={() => setActiveTab('treasury')} className={`pb-4 whitespace-nowrap text-sm font-semibold border-b-[3px] transition ${activeTab === 'treasury' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>
             <span className="flex items-center gap-2"><Landmark size={16}/> Treasury & Reconciliations</span>
           </button>
           <button onClick={() => setActiveTab('ledger')} className={`pb-4 whitespace-nowrap text-sm font-semibold border-b-[3px] transition ${activeTab === 'ledger' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>
             <span className="flex items-center gap-2"><List size={16}/> General Ledger</span>
           </button>
           <button onClick={() => setActiveTab('reports')} className={`pb-4 whitespace-nowrap text-sm font-semibold border-b-[3px] transition ${activeTab === 'reports' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>
             <span className="flex items-center gap-2"><FileText size={16}/> Statements & Reports</span>
           </button>
           <button onClick={() => setActiveTab('settings')} className={`pb-4 whitespace-nowrap text-sm font-semibold border-b-[3px] transition ${activeTab === 'settings' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>
             <span className="flex items-center gap-2"><Settings size={16}/> Settings & Tax</span>
           </button>
           <button onClick={() => setActiveTab('agents_float')} className={`pb-4 whitespace-nowrap text-sm font-semibold border-b-[3px] transition ${activeTab === 'agents_float' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>
             <span className="flex items-center gap-2"><Banknote size={16}/> Agents Float</span>
           </button>
           <button onClick={() => setActiveTab('merchants_withdraw')} className={`pb-4 whitespace-nowrap text-sm font-semibold border-b-[3px] transition ${activeTab === 'merchants_withdraw' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>
             <span className="flex items-center gap-2"><Wallet size={16}/> Merchant Withdrawals</span>
           </button>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        
        {activeTab === 'overview' && (
          <>
            {/* KPI Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm flex flex-col relative group min-w-0">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-slate-500 text-[10px] font-bold tracking-widest uppercase pr-2">Total Platform Profits</div>
                  <Activity size={18} className="text-slate-400 shrink-0" />
                </div>
                <div className="text-xl lg:text-2xl font-black text-slate-900 font-mono tracking-tight mb-2 " title={(Math.max(0, stats?.totalRevenue || 0)).toLocaleString() + ' XAF'}>{formatSecuredValue(Math.max(0, stats?.totalRevenue))} <span className="text-xs lg:text-sm font-semibold text-slate-400">XAF</span></div>
                <div className="flex items-center gap-2 mt-auto">
                  <span className="text-emerald-600 text-[10px] font-bold bg-emerald-50 px-2 py-0.5 rounded-md whitespace-nowrap">Cumulative</span>
                </div>
              </div>

              <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm flex flex-col relative group min-w-0">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-slate-500 text-xs font-bold tracking-widest uppercase  pr-2">Platform Vol.</div>
                  <Briefcase size={18} className="text-slate-400 shrink-0" />
                </div>
                <div className="text-xl lg:text-2xl font-black text-slate-900 font-mono tracking-tight mb-2 " title={(stats?.totalVolume || 0).toLocaleString() + ' XAF'}>{formatSecuredValue(stats?.totalVolume)} <span className="text-xs lg:text-sm font-semibold text-slate-400">XAF</span></div>
                <div className="flex flex-col gap-1.5 mt-auto">
                  <div className="flex items-center gap-2">
                    {stats?.totalVolume > 0 && <span className="text-emerald-600 text-[10px] font-bold bg-emerald-50 px-2 py-0.5 rounded-md whitespace-nowrap">Active</span>}
                    
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm flex flex-col relative group min-w-0">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-slate-500 text-xs font-bold tracking-widest uppercase  pr-2">System Liability</div>
                  <PieChart size={18} className="text-slate-400 shrink-0" />
                </div>
                <div className="text-xl lg:text-2xl font-black text-slate-900 font-mono tracking-tight mb-3 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] whitespace-nowrap" title={(stats?.totalLiability || 0).toLocaleString() + ' XAF'}>{formatSecuredValue(stats?.totalLiability)} <span className="text-xs lg:text-sm font-semibold text-slate-400">XAF</span></div>
                <div className="flex flex-col gap-1.5 mt-auto">
                  <div className="flex justify-between items-start text-[10px] font-bold"><span className="uppercase tracking-widest text-slate-400 shrink-0">Users:</span> <span className="text-slate-700 font-mono break-all text-right ml-2">{formatSecuredValue(stats?.usersBalance)}</span></div>
                  <div className="flex justify-between items-start text-[10px] font-bold"><span className="uppercase tracking-widest text-slate-400 shrink-0">Merch:</span> <span className="text-slate-700 font-mono break-all text-right ml-2">{formatSecuredValue(stats?.merchantsBalance)}</span></div>
                  <div className="flex justify-between items-start text-[10px] font-bold"><span className="uppercase tracking-widest text-slate-400 shrink-0">Agents:</span> <span className="text-slate-700 font-mono break-all text-right ml-2">{formatSecuredValue(stats?.agentsBalance)}</span></div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-8 rounded-xl shadow-md flex flex-col relative group overflow-hidden min-w-0">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Landmark size={80} />
                </div>
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <div className="text-slate-400 text-xs font-bold tracking-widest uppercase  pr-2">Corp Treasury</div>
                  <Landmark size={18} className="text-slate-500 shrink-0" />
                </div>
                <div className="text-xl lg:text-2xl font-black text-white font-mono tracking-tight mb-3 relative z-10 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] whitespace-nowrap" title={(treasury?.balance || stats?.platformFloat || 0).toLocaleString() + ' XAF'}>{formatSecuredValue(treasury?.balance || stats?.platformFloat)} <span className="text-xs lg:text-sm font-semibold text-slate-500">XAF</span></div>
                <div className="flex items-center gap-2 relative z-10 mt-auto">
                  <span className="text-emerald-400 text-xs font-bold bg-emerald-400/10 px-2.5 py-1 rounded-md border border-emerald-400/20 whitespace-nowrap">Reconciled</span>
                </div>
              </div>
            </div>

        {/* Charts & Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="lg:col-span-2 bg-white p-8 rounded-xl shadow-sm border border-slate-200">
               <div className="flex items-center justify-between mb-8">
                 <div>
                    <h2 className="text-slate-900 font-bold text-lg tracking-tight">Financial Overview</h2>
                    <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-bold">Profit & Settlement Volumes</p>
                 </div>
                 <div className="bg-slate-100 p-1 rounded-lg flex items-center text-xs font-semibold">
                    <button className="px-4 py-1.5 bg-white shadow-sm rounded-md text-slate-900">7 Days</button>
                    <button className="px-4 py-1.5 text-slate-500 hover:text-slate-900 transition">30 Days</button>
                 </div>
               </div>
               <div className="h-[320px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={stats?.chartData || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                     <defs>
                       <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                         <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                       </linearGradient>
                       <linearGradient id="colorSet" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#334155" stopOpacity={0.15}/>
                         <stop offset="95%" stopColor="#334155" stopOpacity={0}/>
                       </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                     <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dx={-10} tickFormatter={(val) => `${val / 1000}k`} />
                     <RechartsTooltip content={<CustomTooltip />} />
                     <Area type="monotone" dataKey="revenue" name="Profit" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                     <Area type="monotone" dataKey="settled" name="Settlements" stroke="#334155" strokeWidth={3} fillOpacity={1} fill="url(#colorSet)" />
                   </AreaChart>
                 </ResponsiveContainer>
               </div>
           </div>

           <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 flex flex-col">
               <div className="flex items-center justify-between mb-6">
                 <h2 className="text-slate-900 font-bold text-lg tracking-tight">Quick Reports</h2>
                 <button onClick={() => handleDownloadReport("All_Financials")} className="text-emerald-600 text-xs font-bold flex items-center gap-1.5 hover:text-emerald-700 transition px-3 py-1.5 bg-emerald-50 rounded-lg"><FileText size={14}/> Generate</button>
               </div>
               
               <div className="space-y-3 flex-1">
                  {[
                    { title: "Monthly P&L Statement", date: "Oct 2023", size: "1.2 MB", icon: <DollarSign size={18} className="text-emerald-600" />, bg: "bg-emerald-50" },
                    { title: "Bank Reconciliation", date: "Q3 2023", size: "3.4 MB", icon: <Activity size={18} className="text-blue-600" />, bg: "bg-blue-50" },
                    { title: "Merchant Settlement Logs", date: "Sept 2023", size: "840 KB", icon: <Briefcase size={18} className="text-purple-600" />, bg: "bg-purple-50" },
                    { title: "Tax Withholding Report", date: "2023 YTD", size: "2.1 MB", icon: <FileText size={18} className="text-orange-600" />, bg: "bg-orange-50" },
                  ].map((doc, idx) => (
                    <div key={idx} onClick={() => handleDownloadReport(doc.title)} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50 cursor-pointer transition">
                       <div className="flex items-center gap-3">
                         <div className={`w-10 h-10 ${doc.bg} rounded-xl flex items-center justify-center`}>
                           {doc.icon}
                         </div>
                         <div>
                            <p className="text-sm font-bold text-slate-900">{doc.title}</p>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">{doc.date} • {doc.size}</p>
                         </div>
                       </div>
                       <ArrowUpRight size={16} className="text-slate-400" />
                    </div>
                  ))}
               </div>
           </div>
        </div>

        {/* Bank Settlements Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
            <div>
              <h2 className="text-slate-900 font-bold text-lg tracking-tight">Bank Settlements Queue</h2>
              <p className="text-xs text-slate-500 mt-1 uppercase font-bold tracking-widest">Recent requests awaiting reconciliation</p>
            </div>
            <button onClick={handleProcessBatch} className="bg-slate-900 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm hover:bg-slate-800 transition flex items-center gap-2">
              <CheckCircle size={16}/> Process Batch
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold tracking-widest">
                <tr>
                  <th className="px-6 py-4">Transaction ID</th>
                  <th className="px-6 py-4">Participant</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats?.recentSettlements?.map((tx: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{tx._id.slice(-8).toUpperCase()}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 flex flex-col font-sans">
                         <span>{tx.recipient || tx.agency || 'Bank Transfer'}</span>
                         <span className="text-[10px] text-slate-400 font-normal mt-0.5">{new Date(tx.createdAt).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 capitalize font-semibold text-slate-700">{tx.type}</td>
                    <td className="px-6 py-4 font-black font-mono tracking-tight text-slate-900 text-left">{formatSecuredValue(tx.amount)} <span className="text-xs font-semibold text-slate-400">XAF</span></td>
                    <td className="px-6 py-4">
                      {tx.status === 'completed' ? (
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-md text-xs font-bold flex items-center w-fit gap-1"><CheckCircle size={12}/> Settled</span>
                      ) : (
                        <span className="px-2.5 py-1 bg-orange-50 text-orange-600 rounded-md text-xs font-bold flex items-center w-fit gap-1"><ClockIcon size={12}/> Pending</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                       {tx.status !== 'completed' && (
                         <button onClick={(e) => handleSettle(tx._id, e)} className="text-xs bg-slate-900 text-white font-bold px-3 py-1.5 rounded-lg shadow-sm hover:shadow-md hover:bg-slate-800 transition active:scale-95">Reconcile</button>
                       )}
                    </td>
                  </tr>
                ))}
                {(!stats?.recentSettlements || stats?.recentSettlements?.length === 0) && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium text-sm">No recent settlements found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
          </>
        )}

        {activeTab === 'treasury' && (
          <div className="space-y-6">
            {/* Treasury Sub-Navigation */}
            <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200 flex items-center overflow-x-auto gap-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {[
                { id: 'overview', label: 'Treasury Overview' },
                { id: 'accounts', label: 'Bank & Mobile Float' },
                { id: 'wallets', label: 'Internal Wallets' },
                { id: 'transfers', label: 'Fund Transfers' },
                { id: 'liquidity', label: 'Liquidity & Alerts' },
                { id: 'reconciliation', label: 'Reconciliation Module' }
              ].map(tab => (
                <button
                   key={tab.id}
                   onClick={() => setTreasurySubTab(tab.id as any)}
                   className={`px-4 py-2 text-sm font-bold rounded-lg whitespace-nowrap transition ${
                     treasurySubTab === tab.id ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                   }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {treasurySubTab === 'overview' && (
            <div className="flex flex-col gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-md p-6 md:p-8 flex flex-col relative overflow-hidden text-white w-full">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                  <Landmark size={120} />
                </div>
                <h2 className="text-xl font-bold tracking-tight mb-2 relative z-10">Corporate Treasury</h2>
                <p className="text-slate-400 text-sm mb-6 relative z-10">Manage platform float and bank sweeps.</p>
                
                <div className="text-4xl font-black font-mono tracking-tight mb-8 relative z-10 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] whitespace-nowrap">
                  {formatSecuredValue(treasury?.balance)} <span className="text-lg text-slate-500 font-medium">XAF</span>
                </div>

                <div className="bg-slate-800/50 p-5 rounded-xl border border-slate-700 space-y-4 relative z-10 backdrop-blur-sm">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Destination Account (Withdrawals)</label>
                    <select 
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition outline-none font-medium text-sm text-white mb-4"
                      value={transferBank}
                      onChange={e => setTransferBank(e.target.value)}
                    >
                      <option value="">-- Select Bank/Float --</option>
                      {bankAccounts.map(b => (
                        <option key={b.id} value={b.name}>{b.name} - {b.accountNumber || 'N/A'} ({b.type})</option>
                      ))}
                    </select>

                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Action Amount</label>
                    <input 
                      type="number" min="1" 
                      placeholder="e.g. 5000000"
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition outline-none font-mono text-lg text-white"
                      value={transferAmount}
                      onChange={e => setTransferAmount(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={handleManualSweep} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition shadow-md flex items-center justify-center gap-2">
                      <Download size={18} /> Top-Up
                    </button>
                    <button onClick={handleBankTransfer} className="bg-slate-700 border border-slate-600 hover:bg-slate-600 text-white font-bold py-3 rounded-lg transition shadow-sm flex items-center justify-center gap-2">
                       <Upload size={18} /> Withdraw Profit
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight">Treasury Activity</h2>
                  <div className="bg-emerald-50 text-emerald-600 text-xs font-bold px-3 py-1 rounded-md border border-emerald-100 flex items-center gap-1.5"><Activity size={12}/> Live</div>
                </div>
                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
                  {(treasury?.transactions || []).map((t: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.amount > 0 ? "bg-emerald-100 text-emerald-600" : "bg-slate-200 text-slate-600"}`}>
                           {t.amount > 0 ? <Download size={18} /> : <Upload size={18}/>}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{t.type}</p>
                          <p className="text-xs text-slate-500 font-mono mt-0.5">{t.id} • {new Date(t.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className={`font-black font-mono text-base ${t.amount > 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                        {formatSecuredValue(Math.abs(t.amount))} <span className="text-xs font-semibold text-slate-400">XAF</span>
                      </div>
                    </div>
                  ))}
                  {(!treasury?.transactions || treasury.transactions.length === 0) && (
                    <div className="text-center p-8 text-slate-400 font-medium text-sm">No recent treasury activity.</div>
                  )}
                </div>
              </div>
            </div>
            )}

            {treasurySubTab === 'accounts' && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
                  <h2 className="text-slate-900 font-bold text-lg tracking-tight">Bank & Mobile Float Accounts</h2>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {bankAccounts.length === 0 && (
                     <div className="col-span-full py-12 text-center text-slate-500 font-medium">
                        No bank or mobile float accounts configured.
                     </div>
                  )}
                  {bankAccounts.map(account => (
                    <div key={account.id} className="p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4 group hover:border-emerald-500/50 transition overflow-hidden">
                      <div className="flex justify-between items-start">
                        <div className="min-w-0 pr-2">
                           <div className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-1 ">{account.type}</div>
                           <h3 className="font-bold text-slate-900 text-lg " title={account.name}>{account.name}</h3>
                           <div className="text-xs font-mono text-slate-500 mt-1">{account.accountNumber || 'N/A'}</div>
                        </div>
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-md text-[10px] font-bold uppercase tracking-widest border border-emerald-100 shrink-0">{account.status}</span>
                      </div>
                      <div className="text-2xl lg:text-3xl font-black font-mono tracking-tight text-slate-900 mt-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] whitespace-nowrap" title={account.balance.toLocaleString() + ' XAF'}>
                        {formatSecuredValue(account.balance)} <span className="text-sm font-medium text-slate-400">XAF</span>
                      </div>
                      <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                         <button onClick={() => handleBankTopup(account.id, 5000000)} className="flex-1 bg-white border border-slate-200 hover:border-emerald-500 hover:text-emerald-700 text-slate-700 font-bold py-2 rounded-lg text-sm transition shadow-sm">Top up (5M)</button>
                         <button onClick={() => fetchAccountHistory(account.id, account.name)} className="flex-1 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold py-2 rounded-lg text-sm transition shadow-sm">History</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {treasurySubTab === 'wallets' && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
                  <h2 className="text-slate-900 font-bold text-lg tracking-tight">Internal System Wallets</h2>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {internalWallets.map(wallet => (
                    <div key={wallet.id} className="p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-start hover:border-emerald-500/50 transition overflow-hidden">
                      <h3 className="font-bold text-slate-900 mb-2 text-lg whitespace-normal break-words w-full leading-tight">{wallet.name}</h3>
                      <div className="text-2xl lg:text-3xl font-black font-mono tracking-tight text-slate-900 mb-6 w-full pb-6 border-b border-slate-100 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] whitespace-nowrap" title={wallet.balance.toLocaleString() + ' XAF'}>
                        {formatSecuredValue(wallet.balance)} <span className="text-sm font-medium text-slate-400">XAF</span>
                      </div>
                      <button onClick={() => {
                         const toId = prompt('Transfer to wallet ID (w1, w2, w3, w4, w5):');
                         const amount = Number(prompt('Amount to transfer:'));
                         if(toId && amount) handleWalletTransfer(wallet.id, toId, amount);
                      }} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-lg text-sm transition text-center shadow-sm">
                         Internal Transfer Out
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {treasurySubTab === 'reconciliation' && (
              <div className="space-y-6">
                <div className="flex flex-col gap-6">
                   <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm flex flex-col min-w-0">
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2 ">Reconciled Today</p>
                      <h3 className="text-3xl font-black text-slate-900 font-mono tracking-tight mb-2 ">4,521</h3>
                      <div className="text-emerald-600 text-[10px] font-bold bg-emerald-50 px-2 py-0.5 rounded w-fit ">99.8% Success Rate</div>
                   </div>
                   <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm flex flex-col min-w-0">
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2 ">Pending Recon.</p>
                      <h3 className="text-3xl font-black text-orange-500 font-mono tracking-tight mb-2 ">89</h3>
                      <div className="text-slate-500 text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded w-fit ">Check queues</div>
                   </div>
                   <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm flex flex-col min-w-0">
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2 ">Exceptions found</p>
                      <h3 className="text-3xl font-black text-red-500 font-mono tracking-tight mb-2 ">{reconciliationQueue.length}</h3>
                      <div className="text-red-600 text-[10px] font-bold bg-red-50 px-2 py-0.5 rounded w-fit ">Requires intervention</div>
                   </div>
                   <div className="bg-slate-900 p-6 rounded-xl shadow-sm text-white flex flex-col min-w-0 overflow-hidden">
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2 ">Unmatched Funds</p>
                      <h3 className="text-2xl lg:text-3xl font-black text-white font-mono tracking-tight overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] whitespace-nowrap" title="45,000 XAF">{formatSecuredValue(45000)} <span className="text-sm lg:text-base font-medium text-slate-500">XAF</span></h3>
                   </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
                    <div>
                      <h2 className="text-slate-900 font-bold text-lg tracking-tight">Exception Queue & Manual Reconciliation</h2>
                      <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mt-1">Resolve unmatched transactions</p>
                    </div>
                    <button 
                      onClick={handleRunAutoEngine} 
                      disabled={isReconciling}
                      className="bg-white border border-slate-200 text-slate-700 font-bold px-5 py-2.5 rounded-lg text-sm hover:bg-slate-50 hover:border-slate-300 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isReconciling ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-700"></div>
                          Processing Engine...
                        </>
                      ) : (
                        'Run Auto Engine'
                      )}
                    </button>
                  </div>
                  {isReconciling && (
                    <div className="w-full bg-slate-100 h-1">
                      <div className="bg-emerald-500 h-1 transition-all duration-300" style={{ width: `${reconProgress}%` }}></div>
                    </div>
                  )}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold tracking-widest">
                        <tr>
                          <th className="px-6 py-4">Request ID</th>
                          <th className="px-6 py-4">Type</th>
                          <th className="px-6 py-4">Amount</th>
                          <th className="px-6 py-4">Exception Reason</th>
                          <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {reconciliationQueue.map(req => (
                          <tr key={req.id} className="hover:bg-slate-50 transition">
                            <td className="px-6 py-4 font-mono text-xs">{req.id}<br/><span className="text-[10px] text-slate-400 mt-1 block">Ext: {req.externalId}</span></td>
                            <td className="px-6 py-4 font-semibold text-slate-700">{req.type}</td>
                            <td className="px-6 py-4 font-black font-mono tracking-tight text-slate-900">{formatSecuredValue(req.amount)} XAF</td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest ${req.status === 'Resolved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>{req.status}</span>
                              <div className="text-xs text-slate-500 mt-2 font-medium">{req.exception}</div>
                            </td>
                            <td className="px-6 py-4 text-right space-x-2">
                               {req.status !== 'Resolved' ? (
                                  <>
                                    <button onClick={() => handleReconcileStatus(req.id, 'Resolved')} className="text-xs border border-emerald-500 text-emerald-700 hover:bg-emerald-50 bg-white shadow-sm font-bold px-3 py-1.5 rounded-lg transition">Match Manually</button>
                                  </>
                               ) : (
                                  <span className="text-xs text-emerald-600 font-bold flex items-center justify-end gap-1"><CheckCircle size={14}/> Closed</span>
                               )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {treasurySubTab === 'liquidity' && (
              <div className="space-y-6">
                 <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
                      <div>
                        <h2 className="text-slate-900 font-bold text-lg tracking-tight">Liquidity Management & Forecasting</h2>
                        <p className="text-xs text-slate-500 font-bold tracking-widest uppercase mt-1">Cash flow analysis</p>
                      </div>
                      <button onClick={() => alert('Recalculating projections...')} className="bg-white border border-slate-200 text-slate-700 font-bold px-5 py-2.5 rounded-lg text-sm hover:bg-slate-50 hover:border-slate-300 transition shadow-sm">Recalculate Projections</button>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                         <div className="p-6 rounded-xl bg-red-50/50 border border-red-100 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none text-red-600"><ShieldAlert size={80}/></div>
                            <h3 className="text-red-700 font-bold text-sm mb-2 flex items-center gap-2 uppercase tracking-widest"><ShieldAlert size={16}/> Low Float Alert</h3>
                            <p className="text-red-800/80 text-sm font-medium">MTN Mobile Money float is below threshold (45M XAF vs target 80M XAF). Top-up recommended.</p>
                         </div>
                         <div className="p-6 rounded-xl bg-orange-50/50 border border-orange-100 relative overflow-hidden group">
                           <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none text-orange-600"><ClockIcon size={80}/></div>
                            <h3 className="text-orange-700 font-bold text-sm mb-2 flex items-center gap-2 uppercase tracking-widest"><ClockIcon size={16}/> Settlement Shortage</h3>
                            <p className="text-orange-800/80 text-sm font-medium">Projected shortage of 12M XAF in Settlement Wallet by EOD tomorrow.</p>
                         </div>
                         <div className="p-6 rounded-xl bg-emerald-50/50 border border-emerald-100 relative overflow-hidden group">
                           <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none text-emerald-600"><Activity size={80}/></div>
                            <h3 className="text-emerald-700 font-bold text-sm mb-2 flex items-center gap-2 uppercase tracking-widest"><Activity size={16}/> Net Position</h3>
                            <p className="text-emerald-600 text-sm">Overall corporate liquidity ratio is healthy at 1.45 (Assets / Liabilities).</p>
                         </div>
                      </div>

                      <h3 className="font-bold text-slate-900 mb-4 tracking-tight text-lg">7-Day Cash Flow Projection</h3>
                      <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold tracking-widest">
                            <tr>
                              <th className="px-6 py-4">Date</th>
                              <th className="px-6 py-4 text-emerald-600">Expected Inflows</th>
                              <th className="px-6 py-4 text-red-600">Expected Outflows</th>
                              <th className="px-6 py-4">Net Forecast</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {[1,2,3].map(d => (
                              <tr key={d} className="hover:bg-slate-50 transition">
                                <td className="px-6 py-4 font-mono text-xs">{new Date(Date.now() + d * 86400000).toLocaleDateString()}</td>
                                <td className="px-6 py-4 text-emerald-600 font-bold">{showBalances ? '+14,500,000' : '••••••••'}</td>
                                <td className="px-6 py-4 text-red-600 font-bold">{showBalances ? '-10,200,000' : '••••••••'}</td>
                                <td className="px-6 py-4 font-black font-mono tracking-tight text-slate-900">{showBalances ? '+4,300,000 ' : '•••••••• '}XAF</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                 </div>
              </div>
            )}

            {treasurySubTab === 'transfers' && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden max-w-3xl mx-auto">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
                  <div>
                    <h2 className="text-slate-900 font-bold text-lg tracking-tight">Fund Transfers & Approvals</h2>
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mt-1">Initiate internal or bank sweeps</p>
                  </div>
                </div>
                <div className="p-6 md:p-8 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                     <div>
                       <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Source (From)</label>
                       <select value={transferSource} onChange={e => setTransferSource(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition outline-none bg-slate-50/50 text-slate-900 font-medium">
                          <optgroup label="Bank Accounts">
                            {bankAccounts.filter(b=>b.type==='Bank').map(b=><option key={b.id} value={b.id}>{b.name} - {b.accountNumber || 'N/A'} ({b.balance.toLocaleString()})</option>)}
                          </optgroup>
                          <optgroup label="Internal Wallets">
                            {internalWallets.map(w=><option key={w.id} value={w.id}>{w.name} ({w.balance.toLocaleString()})</option>)}
                          </optgroup>
                       </select>
                     </div>
                     <div>
                       <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Destination (To)</label>
                       <select value={transferDest} onChange={e => setTransferDest(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition outline-none bg-slate-50/50 text-slate-900 font-medium">
                          <optgroup label="Float Accounts">
                            {bankAccounts.filter(b=>b.type==='Float').map(b=><option key={b.id} value={b.id}>{b.name} - {b.accountNumber || 'N/A'}</option>)}
                          </optgroup>
                          <optgroup label="Internal Wallets">
                            {internalWallets.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}
                          </optgroup>
                       </select>
                     </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Transfer Amount (XAF)</label>
                    <input type="number" min="1" value={transferAmount} onChange={e => setTransferAmount(e.target.value)} placeholder="Enter amount..." className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition outline-none font-mono text-lg text-slate-900"/>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Transfer Reference / Memo</label>
                    <input type="text" value={transferMemo} onChange={e => setTransferMemo(e.target.value)} placeholder="Reason for transfer..." className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition outline-none text-slate-900"/>
                  </div>

                  <div className="pt-6 border-t border-slate-100 flex justify-end gap-3 mt-8">
                     <button onClick={() => alert('Draft saved')} className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-3 px-6 rounded-lg transition shadow-sm">Save Draft</button>
                     <button onClick={handleInternalTreasuryTransfer} className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-6 rounded-lg transition shadow-sm flex items-center gap-2">
                        <CheckCircle size={18}/> Request Authorization
                     </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        {activeTab === 'ledger' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
              <div>
                <h2 className="text-slate-900 font-bold text-lg tracking-tight">General Ledger</h2>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mt-1">Record of all system transactions</p>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <Search size={16} className="text-slate-400" />
                </div>
                <input 
                  type="text" 
                  placeholder="Search by ID..." 
                  className="pl-10 pr-4 py-2 border border-slate-200 bg-slate-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition w-64 text-slate-900"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-slate-900 font-bold text-sm">Detailed User Transaction History</h3>
                <p className="text-xs text-slate-500">Lookup by PayCam ID</p>
              </div>
              <form onSubmit={handleUserLookup} className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="e.g. PC12345678" 
                  required
                  value={lookupPaycamId}
                  onChange={e => setLookupPaycamId(e.target.value)}
                  className="px-4 py-2 border border-slate-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 w-48 text-slate-900 font-mono"
                />
                <button type="submit" className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-slate-800 transition">Lookup</button>
                {userHistory && (
                  <button type="button" onClick={() => {setUserHistory(null); setLookupPaycamId('');}} className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-300 transition">Clear</button>
                )}
              </form>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold tracking-widest">
                  <tr>
                    <th className="px-6 py-4">Transaction ID</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Fee</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(userHistory || ledger).filter((t: any) => t._id.toLowerCase().includes(searchTerm.toLowerCase())).map((tx: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">{tx._id.slice(-8).toUpperCase()}</td>
                      <td className="px-6 py-4 text-slate-600 font-medium">{new Date(tx.createdAt).toLocaleString()}</td>
                      <td className="px-6 py-4 capitalize font-semibold text-slate-700">
                        {tx.type} 
                        {tx.type === 'transfer' && <span className="block text-[10px] text-slate-400 flex items-center mt-0.5">User to User</span>}
                      </td>
                      <td className="px-6 py-4 font-black text-slate-900 font-mono tracking-tight">{formatSecuredValue(tx.amount)} XAF</td>
                      <td className="px-6 py-4 text-slate-500 font-semibold font-mono tracking-tight">{formatSecuredValue(tx.fee)} XAF</td>
                      <td className="px-6 py-4">
                        {tx.status === 'completed' ? (
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-md text-[10px] font-bold flex items-center w-fit gap-1 uppercase tracking-widest border border-emerald-100">Completed</span>
                        ) : tx.status === 'pending' ? (
                          <span className="px-2.5 py-1 bg-orange-50 text-orange-600 rounded-md text-[10px] font-bold flex items-center w-fit gap-1 uppercase tracking-widest border border-orange-100">Pending</span>
                        ) : (
                          <span className="px-2.5 py-1 bg-red-50 text-red-600 rounded-md text-[10px] font-bold flex items-center w-fit gap-1 uppercase tracking-widest border border-red-100">{tx.status}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {ledger.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium text-sm">No transactions found in ledger.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
                <div>
                  <h2 className="text-slate-900 font-bold text-lg tracking-tight">Market & Activity Intelligence</h2>
                  <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mt-1">Export rich data subsets derived from live ledgers for market research and growth planning.</p>
                </div>
                <button className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition">
                  <Filter size={18} />
                </button>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-slate-50">
                 {[
                   { title: "User Activity Behavior", desc: "User lifetime value, total tx counts, and first-seen dates.", icon: <Users size={24} className="text-purple-600" />, bg: "bg-purple-100 text-purple-600 border border-purple-200" },
                   { title: "Transaction Network Flows", desc: "Volume and relational data for sender-to-target pathways.", icon: <Globe size={24} className="text-sky-600" />, bg: "bg-sky-100 text-sky-600 border border-sky-200" },
                   { title: "Adoption & Growth Trends", desc: "Monthly active uniques, aggregated system activity & volume.", icon: <TrendingUp size={24} className="text-emerald-600" />, bg: "bg-emerald-100 text-emerald-600 border border-emerald-200" },
                   { title: "Merchant Volume Index", desc: "Total processed volume grouped by recipient/merchant ID.", icon: <BarChart2 size={24} className="text-amber-600" />, bg: "bg-amber-100 text-amber-600 border border-amber-200" },
                 ].map((doc, idx) => (
                   <div key={idx} onClick={() => handleDownloadReport(doc.title)} className="p-6 rounded-xl border border-slate-200 hover:border-emerald-500/50 hover:shadow-md transition duration-200 cursor-pointer group bg-white flex flex-col items-start gap-8 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition duration-300">
                        {doc.icon}
                      </div>
                      <div className={`w-12 h-12 ${doc.bg} rounded-xl flex items-center justify-center transition-transform group-hover:scale-105`}>
                        {doc.icon}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">{doc.title}</h3>
                        <p className="text-sm text-slate-500 mt-1 font-medium">{doc.desc}</p>
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded-md">
                        <Download size={14} /> Extract Dataset
                      </div>
                   </div>
                 ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
                <div>
                  <h2 className="text-slate-900 font-bold text-lg tracking-tight">Financial & Compliance Reports</h2>
                  <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mt-1">Generate and download official statements and logs.</p>
                </div>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {[
                   { title: "Monthly Income Statement", desc: "Detailed revenue, cost, and margin analysis.", icon: <Activity size={24} className="text-blue-600" />, bg: "bg-blue-50 text-blue-600", action: () => handleDownloadReport("Monthly Income Statement"), downloadText: "Download CSV" },
                   { title: "Balance Sheet", desc: "System liability vs reconciled corporate float.", icon: <Landmark size={24} className="text-emerald-600" />, bg: "bg-emerald-50 text-emerald-600", action: () => handleDownloadReport("Balance Sheet"), downloadText: "Download CSV" },
                   { title: "Approved Transaction Logs", desc: "Admin-approved finance transactions.", icon: <FileText size={24} className="text-purple-600" />, bg: "bg-purple-50 text-purple-600", action: () => window.print(), downloadText: "Download PDF" },
                   { title: "Tax Withholding Report", desc: "Logs of all automatically withheld tax on transactions.", icon: <ShieldAlert size={24} className="text-orange-600" />, bg: "bg-orange-50 text-orange-600", action: () => handleDownloadReport("Tax Withholding Report"), downloadText: "Download CSV" },
                   { title: "Global E-Journal", desc: "Raw dump of all transactional logs.", icon: <FileText size={24} className="text-slate-600" />, bg: "bg-slate-100 text-slate-600", action: () => handleDownloadReport("Global E-Journal"), downloadText: "Download CSV" }
                 ].map((doc, idx) => (
                   <div key={idx} onClick={doc.action} className="p-6 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition duration-200 cursor-pointer group bg-white flex flex-col items-start gap-8">
                      <div className={`w-14 h-14 ${doc.bg} rounded-xl flex items-center justify-center transition-transform group-hover:scale-105`}>
                        {doc.icon}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">{doc.title}</h3>
                        <p className="text-sm text-slate-500 mt-1 font-medium">{doc.desc}</p>
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-widest">
                        <Download size={14} /> {doc.downloadText}
                      </div>
                   </div>
                 ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-slate-200 max-w-2xl mx-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">Tax & Fee Configuration</h2>
            <p className="text-slate-500 text-sm mb-8 font-medium">Update the global platform tax rates and withholding parameters.</p>
            
            <div className="space-y-6">
              <div>
                <label className="block text-xs uppercase tracking-widest font-bold text-slate-500 mb-2">Standard Tax Rate (%)</label>
                <div className="relative max-w-xs">
                   <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400 font-bold">%</div>
                   <input 
                     type="number" min="1" 
                     step="0.01"
                     className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition outline-none text-slate-900 font-mono text-lg" 
                     value={taxRate}
                     onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                   />
                </div>
                <p className="text-xs text-slate-400 mt-2 font-medium">This rate is applied to all gross merchant settlements.</p>
              </div>

              <div className="pt-8 border-t border-slate-100">
                <button onClick={saveSettings} className="bg-slate-900 text-white font-bold px-6 py-3 rounded-lg shadow-sm hover:shadow-md hover:bg-slate-800 transition active:scale-95 flex items-center gap-2">
                  <CheckCircle size={18} /> Save Configuration
                </button>
              </div>
            </div>
          </div>
        )}
        {pinModal?.isOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 md:p-8 w-full max-w-sm relative">
              <button onClick={() => setPinModal(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
              <div className="flex flex-col items-start text-left">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                  <ShieldAlert size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight mb-1">Confirm Authorization</h3>
                <p className="text-sm text-slate-500 font-medium mb-6">Enter your 5-digit admin PIN to execute the {pinModal.amount.toLocaleString()} XAF transaction.</p>
              </div>
              <form onSubmit={handlePinSubmit} className="space-y-4">
                <div>
                  <input
                    type="password"
                    name="pin"
                    maxLength={5} pattern="\d{5}" title="PIN must be exactly 5 digits"
                    placeholder="•••••"
                    className="w-full text-center tracking-[1em] text-3xl font-mono text-slate-900 bg-slate-50 border border-slate-200 rounded-xl py-4 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition outline-none"
                    required
                    autoFocus
                  />
                  <p className="text-[10px] uppercase font-bold text-slate-400 text-center tracking-widest mt-2">5-Digit Secure PIN</p>
                </div>
                <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl shadow-sm transition active:scale-[0.98]">
                  Authorize & Proceed
                </button>
              </form>
            </div>
          </div>
        )}
        

        {activeTab === 'merchants_withdraw' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-white">
                <h2 className="text-slate-900 font-bold text-lg tracking-tight">Withdraw Merchant Funds</h2>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mt-1">Deduct funds from a merchant's balance</p>
              </div>
              <form onSubmit={handleMerchantWithdraw} className="p-6 md:p-8 space-y-6 max-w-xl">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-2">Merchant PayCam ID</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PC11111111"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition outline-none font-medium"
                    value={merchantWithdrawPaycamId}
                    onChange={e => setMerchantWithdrawPaycamId(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-2">Amount to Withdraw (XAF)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="0"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition outline-none font-medium"
                    value={merchantWithdrawAmount}
                    onChange={e => setMerchantWithdrawAmount(e.target.value)}
                  />
                </div>
                <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-lg transition shadow-sm">
                  Process Withdrawal
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'agents_float' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-white">
                <h2 className="text-slate-900 font-bold text-lg tracking-tight">Manual Send to Agent</h2>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mt-1">Send float to an agent</p>
              </div>
              <div className="p-6">
                <form onSubmit={handleSendFloat} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Agent PayCam ID</label>
                    <input type="text" value={agentPaycamId} onChange={e => setAgentPaycamId(e.target.value)} required placeholder="PC..." className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition outline-none uppercase text-slate-900 font-medium" disabled={user.level === 1} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Amount (XAF)</label>
                    <input type="number" min="1" value={transferAmount} onChange={e => setTransferAmount(e.target.value)} required placeholder="Amount..." className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition outline-none font-mono text-slate-900" disabled={user.level === 1} />
                  </div>
                  <div className="flex items-end">
                    <button type="submit" disabled={user.level === 1} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-lg shadow-sm transition disabled:opacity-50">Send Float</button>
                  </div>
                </form>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-white">
                <h2 className="text-slate-900 font-bold text-lg tracking-tight">Pending Agent Float Requests</h2>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mt-1">Pending top-up requests from agents</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Agent</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {floatRequests.filter(r => r.status === 'pending').length > 0 ? floatRequests.filter(r => r.status === 'pending').map(r => (
                      <tr key={r._id} className="hover:bg-slate-50 transition group">
                        <td className="px-6 py-4 text-slate-500">{new Date(r.createdAt).toLocaleString()}</td>
                        <td className="px-6 py-4" title={`${r.agentName} (${r.agentPaycamId})`}>
                          <div className="font-bold text-slate-900">{r.agentName}</div>
                          <div className="text-xs text-slate-500 font-mono mt-0.5">{r.agentPaycamId}</div>
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-slate-900">{r.amount.toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold flex items-center w-fit gap-1 uppercase tracking-widest bg-orange-50 text-orange-600 border border-orange-100`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {user.level > 1 ? (
                            <button onClick={() => handleApproveFloatRequest(r._id)} className="bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition">Approve</button>
                          ) : (
                            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Read Only</span>
                          )}
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No pending float requests found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-white">
                <h2 className="text-slate-900 font-bold text-lg tracking-tight">Completed Requests</h2>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mt-1">Processed agent float requests</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Agent</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {floatRequests.filter(r => r.status !== 'pending').length > 0 ? floatRequests.filter(r => r.status !== 'pending').map(r => (
                      <tr key={r._id} className="hover:bg-slate-50 transition group">
                        <td className="px-6 py-4 text-slate-500">{new Date(r.createdAt).toLocaleString()}</td>
                        <td className="px-6 py-4" title={`${r.agentName} (${r.agentPaycamId})`}>
                          <div className="font-bold text-slate-900">{r.agentName}</div>
                          <div className="text-xs text-slate-500 font-mono mt-0.5">{r.agentPaycamId}</div>
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-slate-900">{r.amount.toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold flex items-center w-fit gap-1 uppercase tracking-widest ${r.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Processed</span>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No completed float requests found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Account History Modal */}
        {showHistoryModal && selectedAccountHistory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
             <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-2xl w-full flex flex-col max-h-[80vh] overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                   <div>
                      <h2 className="text-xl font-bold text-slate-900 tracking-tight">Transaction History</h2>
                      <p className="text-sm font-medium text-slate-500 mt-1">{selectedAccountHistory.name}</p>
                   </div>
                   <button onClick={() => setShowHistoryModal(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-full transition"><X size={20} /></button>
                </div>
                <div className="p-0 flex-1 overflow-auto">
                   <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-slate-50 sticky top-0 z-10">
                         <tr>
                            <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount (XAF)</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                         {accountHistoryLogs.length > 0 ? (
                             accountHistoryLogs.map((tx: any) => (
                               <tr key={tx.id} className="hover:bg-slate-50/50 transition">
                                 <td className="px-6 py-4 font-medium text-slate-700">{new Date(tx.date).toLocaleString()}</td>
                                 <td className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider">{tx.type}</td>
                                 <td className="px-6 py-4 font-mono font-bold text-slate-900">
                                   <span className={tx.amount > 0 ? "text-emerald-600" : "text-red-600"}>{Math.abs(tx.amount).toLocaleString()}</span>
                                 </td>
                               </tr>
                             ))
                         ) : (
                            <tr>
                               <td colSpan={3} className="px-6 py-12 text-center text-slate-500 font-medium">No history found for this account.</td>
                            </tr>
                         )}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>
        )}

      </div>
    </div>
  );
}
