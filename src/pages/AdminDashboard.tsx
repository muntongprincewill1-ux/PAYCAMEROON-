import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { UserGroupIcon as Users, Activity01Icon as Activity, DollarCircleIcon as DollarSign, ChartIncreaseIcon as TrendingUp, Notification01Icon as Bell, Logout01Icon as LogOut, ArrowUpRight01Icon as ArrowUpRight, ArrowDownRight01Icon as ArrowDownRight, Layers01Icon as Layers, DashboardSquare01Icon as LayoutDashboard, ListViewIcon as List, CheckmarkSquare01Icon as CheckSquare, Alert01Icon as ShieldAlert, File01Icon as FileText, Search01Icon as Search, EngineSlashIcon as Slash, CheckmarkCircle01Icon as CheckCircle, CancelCircleIcon as XCircle, Store01Icon as Store, ServerStack01Icon as Server, Settings01Icon as Settings, Alert02Icon as AlertTriangle, FileSearchIcon as FileSearch, Activity01Icon as HeartPulse, RefreshIcon as RefreshCw, ArrowRight01Icon as ChevronRight, HeadsetConnectedIcon as Headset, Delete01Icon as Trash2, Edit01Icon as Edit, PencilEdit01Icon as Pencil, Briefcase01Icon as Briefcase } from 'hugeicons-react';
import { Toaster, toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import OperationalCalendar from '../components/OperationalCalendar';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [approvals, setApprovals] = useState<any[]>([]);
  const [treasuryAccounts, setTreasuryAccounts] = useState<any[]>([]);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [bankForm, setBankForm] = useState({ id: '', name: '', type: 'Bank', accountNumber: '' });
  const [txLogs, setTxLogs] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [ledgerTransactions, setLedgerTransactions] = useState<any[]>([]);
  const [amlAlerts, setAmlAlerts] = useState<any[]>([]);
  const [agentLogs, setAgentLogs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [fraudSubTab, setFraudSubTab] = useState<'summary' | 'threat-dashboard'>('summary');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [limitsModalUser, setLimitsModalUser] = useState<any>(null);
  const [newUser, setNewUser] = useState({ name: '', phone: '', pin: '', role: 'user', level: 1 });
  const [resetPinUserId, setResetPinUserId] = useState<string | null>(null);
  const [newPinValue, setNewPinValue] = useState('');
  const [supportCategories, setSupportCategories] = useState<any[]>([]);
  const [supportSubTab, setSupportSubTab] = useState<'personnel' | 'categories'>('personnel');
  const [systemSettings, setSystemSettings] = useState<any>({
      taxRate: 19.25,
      transferFeeFixed: 0,
      transferFeePercent: 1.5,
      withdrawalFeeFixed: 50,
      withdrawalFeePercent: 1.0,
      merchantCommissionRate: 0,
      agentCashInCommissionRate: 0,
      agentCashOutCommissionRate: 0,
      require2FASupport: true,
      geoBlocking: false
  });
  const seenApprovals = useRef<Set<string>>(new Set());
  const isFirstLoad = useRef<boolean>(true);
  const navigate = useNavigate();

  const fetchAdminData = (isInitial = false) => {
      fetch('/api/admin/approvals').then(res => res.ok ? res.json() : {approvals: []}).then(data => {
          if (!data || !data.approvals) return;
          const newApprovals = data.approvals;
          setApprovals(newApprovals);
          
          if (!isFirstLoad.current) {
              newApprovals.forEach((app: any) => {
                  if (!seenApprovals.current.has(app.id)) {
                      toast.info(`New Finance Request: ${app.title}`, {
                          description: app.desc,
                      });
                  }
              });
          }
          
          const newSeen = new Set<string>();
          newApprovals.forEach((app: any) => newSeen.add(app.id));
          seenApprovals.current = newSeen;
          isFirstLoad.current = false;
      }).catch(console.error);
      
      fetch('/api/admin/txlogs').then(res => res.ok ? res.json() : {logs: []}).then(data => { if(data?.logs) setTxLogs(data.logs); }).catch(console.error);
      fetch('/api/compliance/audit-logs').then(res => res.ok ? res.json() : {logs: []}).then(data => { if(data?.logs) setAuditLogs(data.logs); }).catch(console.error);
      fetch('/api/compliance/aml-alerts').then(res => res.ok ? res.json() : {alerts: []}).then(data => { if(data?.alerts) setAmlAlerts(data.alerts); }).catch(console.error);
      fetch('/api/compliance/agent-logs').then(res => res.ok ? res.json() : {logs: []}).then(data => { if(data?.logs) setAgentLogs(data.logs); }).catch(console.error);
      fetch('/api/admin/users').then(res => res.ok ? res.json() : {users: []}).then(data => { if(data?.users) setUsers(data.users); }).catch(console.error);
      fetch('/api/finance/ledger').then(res => res.ok ? res.json() : {transactions: []}).then(data => { if(data?.transactions) setLedgerTransactions(data.transactions); }).catch(console.error);
      fetch('/api/admin/stats').then(res => res.ok ? res.json() : {stats: null}).then(data => { if(data?.stats) setStats(data.stats); }).catch(console.error);
      
      if (isInitial) {
         fetch('/api/admin/support/categories').then(res => res.ok ? res.json() : {categories: []}).then(data => { if(data?.categories) setSupportCategories(data.categories); }).catch(console.error);
         fetch('/api/admin/settings').then(res => res.ok ? res.json() : {settings: null}).then(data => { if(data?.settings) setSystemSettings(data.settings); }).catch(console.error);
      }
      
      fetch('/api/finance/treasury').then(res => res.ok ? res.json() : {bankAccounts: []}).then(data => { if(data?.bankAccounts) setTreasuryAccounts(data.bankAccounts); }).catch(console.error);
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    fetchAdminData(true);
    const interval = setInterval(() => {
        fetchAdminData(false);
    }, 5000);

    fetch('/api/admin/stats')
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
      
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let telemetryInterval: any;
    if (activeTab === 'fraud') {
        telemetryInterval = setInterval(() => {
            fetch('/api/compliance/agent-logs').then(res => res.ok ? res.json() : {logs: []}).then(data => { if(data?.logs) setAgentLogs(data.logs); }).catch(console.error);
            fetch('/api/compliance/aml-alerts').then(res => res.ok ? res.json() : {alerts: []}).then(data => { if(data?.alerts) setAmlAlerts(data.alerts); }).catch(console.error);
        }, 1500);
    }
    return () => {
        if (telemetryInterval) clearInterval(telemetryInterval);
    };
  }, [activeTab]);

  const handleApprove = async (id: string) => {
      try {
        const res = await fetch(`/api/admin/approvals/${id}/approve`, { method: 'POST' });
        const data = await res.json();
        if (!res.ok) {
            toast.error(data.error || 'Failed to approve');
            return;
        }
        toast.success('Approved successfully!');
        fetchAdminData();
      } catch (err) {
        toast.error('An error occurred');
      }
  };

  const handleReject = async (id: string) => {
      try {
        const res = await fetch(`/api/admin/approvals/${id}/reject`, { method: 'POST' });
        const data = await res.json();
        if (!res.ok) {
            toast.error(data.error || 'Failed to reject');
            return;
        }
        toast.success('Rejected!');
        fetchAdminData();
      } catch (err) {
        toast.error('An error occurred');
      }
  };

  const handleDownloadReceipt = (logId: string) => {
      toast.success('Generating Receipt...');
      const log = ledgerTransactions.find((l: any) => l._id === logId || l.id === logId);
      if (!log) return toast.error('Receipt not found');

      const doc = new jsPDF('p', 'mm', 'a4');
      doc.setFontSize(22);
      doc.setTextColor(15, 23, 42);
      doc.text("PayCam Platform", 14, 20);
      
      doc.setFontSize(14);
      doc.setTextColor(71, 85, 105);
      doc.text("Transaction Receipt", 14, 28);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Receipt ID: ${logId}`, 14, 35);
      doc.text(`Date Generated: ${new Date().toLocaleString()}`, 14, 40);

      autoTable(doc, {
          startY: 45,
          head: [['Date', 'Type', 'Amount (XAF)', 'Description/Recipient']],
          body: [[
              new Date(log.createdAt || log.date).toLocaleString(),
              log.type,
              (log.amount || 0).toLocaleString(),
              log.recipient || log.desc || '-'
          ]],
          styles: { fontSize: 9, cellPadding: 3, textColor: [51, 65, 85] },
          headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [248, 250, 252] },
          margin: { top: 40 }
      });
      
      const finalY = (doc as any).lastAutoTable.finalY || 45;
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text('Authorized By (Finance)', 14, finalY + 20);
      doc.line(14, finalY + 25, 80, finalY + 25);
      
      doc.save(`paycam_receipt_${logId}.pdf`);
      toast.success('Receipt downloaded successfully.');
  };

  const handleGenerateAuditPdf = () => {
      toast.success('Generating Audit PDF...');
      
      const doc = new jsPDF('p', 'mm', 'a4');
      doc.setFontSize(22);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text("PayCam Platform", 14, 20);
      
      doc.setFontSize(14);
      doc.setTextColor(71, 85, 105); // slate-500
      doc.text("Official Financial Audit & Ledger", 14, 28);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Date Generated: ${new Date().toLocaleString()}`, 14, 35);
      
      let logsToPrint = ledgerTransactions;
      let filename = 'paycam_financial_audit.pdf';

      autoTable(doc, {
          startY: 45,
          head: [['Date', 'Type', 'Amount (XAF)', 'Fee', 'Recipient / Details']],
          body: logsToPrint.map((log: any) => [
              new Date(log.createdAt || log.date).toLocaleString(),
              log.type || '-',
              (log.amount || 0).toLocaleString(),
              (log.fee || 0).toLocaleString(),
              log.recipient || log.desc || '-'
          ]),
          styles: { fontSize: 9, cellPadding: 3, textColor: [51, 65, 85] },
          headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [248, 250, 252] },
          margin: { top: 40 }
      });
      
      const finalY = (doc as any).lastAutoTable.finalY || 45;
      
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text('Prepared By (System Administrator)', 14, finalY + 20);
      doc.line(14, finalY + 25, 80, finalY + 25);
      doc.text('Sign Date: ________________', 14, finalY + 32);

      doc.text('Approved By (Compliance Officer)', 110, finalY + 20);
      doc.line(110, finalY + 25, 180, finalY + 25);
      doc.text('Sign Date: ________________', 110, finalY + 32);

      doc.save(filename);
      toast.success('Audit PDF downloaded successfully.');
  };

  const handleExportCsv = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Transaction ID,Date,Type,Amount (XAF),Fee (XAF),Commission (XAF),Net Profit (XAF)\n";
    ledgerTransactions.forEach((log: any) => {
      const fee = log.fee || 0;
      const commission = log.commissionRecord || 0;
      const netProfit = fee - commission;
      csvContent += `${log._id || log.id},${new Date(log.createdAt || log.date).toLocaleDateString()},${log.type},${log.amount},${fee},${commission},${netProfit}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `pnl_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('P&L CSV Report exported successfully.');
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        const res = await fetch('/api/admin/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newUser)
        });
        let data;
        try {
           data = await res.json();
        } catch(e) {
           throw new Error("Server returned an invalid response (possibly HTML/502).");
        }
        
        if (data.success) {
            toast.success('User created successfully');
            setIsAddUserModalOpen(false);
            setNewUser({ name: '', phone: '', pin: '', role: 'user', level: 1 });
            fetchAdminData();
        } else {
            toast.error(data.error || 'Failed to create user');
        }
    } catch (err: any) {
        toast.error(err.message || 'An error occurred while creating user');
    }
  };

  const handleUpdateRole = async (userId: string, targetRole: string) => {
      try {
          const res = await fetch(`/api/admin/users/${userId}/role`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ role: targetRole })
          });
          const data = await res.json();
          if (data.success) {
              toast.success('User role updated');
              fetchAdminData();
          } else {
              toast.error(data.error);
          }
      } catch (err) {
          toast.error('Failed to update role');
      }
  };

  const handleResetPin = async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (!resetPinUserId || !newPinValue.match(/^\d{5}$/)) {
          toast.error('PIN must be exactly 5 digits');
          return;
      }
      try {
          const res = await fetch(`/api/admin/users/${resetPinUserId}/pin`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ pin: newPinValue })
          });
          const data = await res.json();
          if (data.success) {
              toast.success('User PIN updated');
              setResetPinUserId(null);
              setNewPinValue('');
          } else {
              toast.error(data.error);
          }
      } catch (err) {
          toast.error('Failed to update PIN');
      }
  };

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
      const targetStatus = currentStatus === 'active' ? 'blocked' : 'active';
      try {
          const res = await fetch(`/api/admin/users/${userId}/status`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: targetStatus })
          });
          const data = await res.json();
          if (data.success) {
              toast.success(`User ${targetStatus}`);
              fetchAdminData();
          } else {
              toast.error(data.error);
          }
      } catch (err) {
          toast.error('Failed to update status');
      }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-[#F8FAFC]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-dark text-white p-3 rounded-lg shadow-xl border border-gray-800 text-xs">
          <p className="font-bold mb-1 opacity-70">{label}</p>
          <p className="font-medium text-blue-400">Vol: {payload[0]?.value?.toLocaleString() || 0} XAF</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex h-screen bg-[#F4F7FB] font-sans overflow-x-auto overflow-y-hidden">
      <div className="flex min-w-[1280px] w-full h-full">
      <Toaster position="top-right" />
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#0A1128] text-white flex flex-col shrink-0">
         <div className="h-16 flex items-center px-6 border-b border-white/10 gap-3">
            <div className="w-8 h-8 flex items-center justify-center bg-blue-600 rounded-lg shrink-0 overflow-hidden">
               {systemSettings?.appLogoUrl ? (
                  <img src={systemSettings.appLogoUrl} alt="Logo" className="w-full h-full object-cover bg-white" />
               ) : (
                  <Layers className="text-white" size={16} />
               )}
            </div>
            <div>
               <h1 className="font-bold tracking-wider text-sm uppercase leading-tight">PayCam</h1>
               <p className="text-[9px] text-blue-400 font-mono tracking-widest">SUPER ADMIN</p>
            </div>
         </div>
         <div className="flex-1 overflow-y-auto py-6 [&::-webkit-scrollbar]:hidden">
            <div className="px-6 mb-2"><p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Main</p></div>
            <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center px-6 py-2.5 text-sm gap-3 transition ${activeTab === 'overview' ? 'bg-white/10 text-white font-medium border-l-2 border-blue-500' : 'text-gray-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent'}`}>
              <LayoutDashboard size={16} /> Overview
            </button>
            <button onClick={() => setActiveTab('users')} className={`w-full flex items-center px-6 py-2.5 text-sm gap-3 transition ${activeTab === 'users' ? 'bg-white/10 text-white font-medium border-l-2 border-blue-500' : 'text-gray-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent'}`}>
              <Users size={16} /> User Management
            </button>
            <button onClick={() => setActiveTab('merchants')} className={`w-full flex items-center px-6 py-2.5 text-sm gap-3 transition ${activeTab === 'merchants' ? 'bg-white/10 text-white font-medium border-l-2 border-blue-500' : 'text-gray-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent'}`}>
              <Store size={16} /> Merchants
            </button>
            <button onClick={() => setActiveTab('agents')} className={`w-full flex items-center px-6 py-2.5 text-sm gap-3 transition ${activeTab === 'agents' ? 'bg-white/10 text-white font-medium border-l-2 border-blue-500' : 'text-gray-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent'}`}>
              <Activity size={16} /> Agents
            </button>
            <button onClick={() => setActiveTab('support')} className={`w-full flex items-center px-6 py-2.5 text-sm gap-3 transition ${activeTab === 'support' ? 'bg-white/10 text-white font-medium border-l-2 border-blue-500' : 'text-gray-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent'}`}>
              <Headset size={16} /> Support Team
            </button>
            <button onClick={() => setActiveTab('finance-staff')} className={`w-full flex items-center px-6 py-2.5 text-sm gap-3 transition ${activeTab === 'finance-staff' ? 'bg-white/10 text-white font-medium border-l-2 border-blue-500' : 'text-gray-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent'}`}>
              <Briefcase size={16} /> Finance Team
            </button>

            <div className="px-6 mb-2 mt-6"><p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Financial</p></div>
            <button onClick={() => setActiveTab('transactions')} className={`w-full flex items-center px-6 py-2.5 text-sm gap-3 transition ${activeTab === 'transactions' ? 'bg-white/10 text-white font-medium border-l-2 border-blue-500' : 'text-gray-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent'}`}>
              <List size={16} /> Transactions
            </button>
            <button onClick={() => setActiveTab('approvals')} className={`w-full flex items-center px-6 py-2.5 text-sm gap-3 transition ${activeTab === 'approvals' ? 'bg-white/10 text-white font-medium border-l-2 border-blue-500' : 'text-gray-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent'}`}>
              <CheckSquare size={16} /> Approvals & Requests
            </button>
            <button onClick={() => setActiveTab('reports')} className={`w-full flex items-center px-6 py-2.5 text-sm gap-3 transition ${activeTab === 'reports' ? 'bg-white/10 text-white font-medium border-l-2 border-blue-500' : 'text-gray-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent'}`}>
              <FileText size={16} /> Revenue & Reports
            </button>

            <div className="px-6 mb-2 mt-6"><p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Risk & Compliance</p></div>
            <button onClick={() => setActiveTab('compliance')} className={`w-full flex items-center px-6 py-2.5 text-sm gap-3 transition ${activeTab === 'compliance' ? 'bg-white/10 text-white font-medium border-l-2 border-blue-500' : 'text-gray-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent'}`}>
              <FileSearch size={16} /> KYC / AML
            </button>
            <button onClick={() => setActiveTab('fraud')} className={`w-full flex items-center px-6 py-2.5 text-sm gap-3 transition ${activeTab === 'fraud' ? 'bg-red-500/20 text-red-100 font-medium border-l-2 border-red-500' : 'text-gray-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent'}`}>
              <ShieldAlert size={16} /> Fraud & Threats
            </button>

            <div className="px-6 mb-2 mt-6"><p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">System</p></div>
            <button onClick={() => setActiveTab('health')} className={`w-full flex items-center px-6 py-2.5 text-sm gap-3 transition ${activeTab === 'health' ? 'bg-white/10 text-white font-medium border-l-2 border-blue-500' : 'text-gray-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent'}`}>
              <HeartPulse size={16} /> Health Monitor
            </button>
            <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center px-6 py-2.5 text-sm gap-3 transition ${activeTab === 'settings' ? 'bg-white/10 text-white font-medium border-l-2 border-blue-500' : 'text-gray-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent'}`}>
              <Settings size={16} /> Configuration
            </button>
         </div>
         <div className="p-4 border-t border-white/10">
            <button onClick={handleLogout} className="w-full flex items-center justify-center py-2.5 bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-gray-400 rounded-lg text-sm font-medium gap-2 transition">
               <LogOut size={16} /> Logout
            </button>
         </div>
      </aside>

      {/* MAIN CONTENT DIV */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* TOP NAV */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 shadow-[0_2px_10px_rgba(0,0,0,0.02)] z-10 w-full">
           <div className="flex items-center gap-4 flex-1">
               <div className="relative w-full max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input type="number" step="0.01" placeholder="Global system search..." className="pl-10 pr-4 py-2 w-full bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400" />
               </div>
           </div>
           <div className="flex items-center gap-4">
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition relative">
                 <Bell size={18} />
                 <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
              </button>
              <div className="h-8 w-[1px] bg-gray-200 mx-2"></div>
              <div className="flex items-center gap-3">
                 <div className="text-right hidden sm:block">
                    <p className="text-xs font-bold text-gray-900 leading-tight">{user?.name || 'Administrator'}</p>
                    <p className="text-[10px] text-green-500 font-bold uppercase">{user?.role || 'admin'}</p>
                 </div>
                 <div className="w-9 h-9 bg-dark text-white rounded-full flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-gray-100">
                    {user?.name?.charAt(0) || 'A'}
                 </div>
              </div>
           </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#F4F7FB]">
           {activeTab === 'overview' && (
              <div className="space-y-6">
                 {/* Hero Metrics */}
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center relative overflow-hidden group">
                       <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                       <div className="flex items-center gap-2 text-gray-500 mb-2 text-xs font-bold tracking-wider uppercase">
                         <Users size={14} className="text-blue-500" /> Total Users
                       </div>
                       <div className="text-2xl font-black text-gray-900">{stats?.totalUsers?.toLocaleString() || 8420}</div>
                       <div className="text-green-500 text-[10px] font-bold flex items-center mt-2"><ArrowUpRight size={12} className="mr-0.5"/> 12.5% this week</div>
                    </div>
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center relative overflow-hidden group">
                       <div className="absolute top-0 right-0 w-16 h-16 bg-purple-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                       <div className="flex items-center gap-2 text-gray-500 mb-2 text-xs font-bold tracking-wider uppercase">
                         <Store size={14} className="text-purple-500" /> Merchants
                       </div>
                       <div className="text-2xl font-black text-gray-900">{stats?.totalMerchants?.toLocaleString() || 450}</div>
                       <div className="text-green-500 text-[10px] font-bold flex items-center mt-2"><ArrowUpRight size={12} className="mr-0.5"/> 4.2% this week</div>
                    </div>
                    <div className="bg-gradient-to-br from-gray-900 to-[#0A1128] p-8 rounded-2xl shadow-lg border border-gray-800 flex flex-col justify-center relative overflow-hidden">
                       <div className="absolute bottom-0 right-0 opacity-10">
                          <svg width="150" height="150" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                       </div>
                       <div className="flex items-center gap-2 text-blue-300 mb-2 text-xs font-bold tracking-wider uppercase relative z-10">
                         <TrendingUp size={14} /> Platform Volume (30D)
                       </div>
                       <div className="text-3xl font-black text-white relative z-10">{stats?.totalVolume?.toLocaleString() || '142,500,000'} <span className="text-sm text-gray-400 font-medium">XAF</span></div>
                       <div className="flex justify-between items-end mt-4 relative z-10">
                         <div className="text-[10px] uppercase font-bold tracking-widest text-gray-400">System Healthy</div>
                       </div>
                    </div>
                    <div className="col-span-1 bg-gradient-to-br from-emerald-900 to-[#064e3b] p-8 rounded-2xl shadow-lg border border-emerald-800 flex flex-col justify-center relative overflow-hidden">
                        <div className="flex items-center gap-2 text-emerald-300 mb-2 text-xs font-bold tracking-wider uppercase relative z-10">
                          <DollarSign size={14} /> Platform Profits
                        </div>
                        <div className="text-3xl font-black text-white relative z-10" title={(Math.max(0, stats?.totalRevenue || 0)).toLocaleString() + ' XAF'}>{(Math.max(0, stats?.totalRevenue || 0)).toLocaleString() || '2,850,000'} <span className="text-sm text-emerald-400/50 font-medium">XAF</span></div>
                        <div className="flex justify-between items-end mt-4 relative z-10">
                           <div className="text-emerald-400 text-[10px] font-bold bg-emerald-400/20 px-2 py-0.5 rounded uppercase tracking-widest">Available to Withdraw</div>
                        </div>
                    </div>
                 </div>

                 {/* Charts Section */}
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="col-span-1 lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-gray-100 h-[320px] flex flex-col">
                       <div className="flex items-center justify-between mb-6">
                          <h2 className="text-sm font-bold tracking-wider text-gray-400 uppercase">Volume Trend</h2>
                          <div className="flex gap-2 text-xs">
                             <button className="px-3 py-1 bg-gray-100 text-gray-600 rounded-md font-bold">7D</button>
                             <button className="px-3 py-1 text-gray-400 hover:text-gray-600 font-bold">30D</button>
                             <button className="px-3 py-1 text-gray-400 hover:text-gray-600 font-bold">1Y</button>
                          </div>
                       </div>
                       <div className="flex-1 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                             <AreaChart data={stats?.chartData || []} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                                <defs>
                                <linearGradient id="colorVolumeMain" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0052FF" stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor="#0052FF" stopOpacity={0}/>
                                </linearGradient>
                                </defs>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} tickFormatter={(val) => `${val / 1000}k`} />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="volume" stroke="#0052FF" strokeWidth={3} fillOpacity={1} fill="url(#colorVolumeMain)" />
                             </AreaChart>
                          </ResponsiveContainer>
                       </div>
                    </div>
                    
                    {/* Live Feed */}
                    <div className="col-span-1 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col h-[320px] overflow-hidden">
                       <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                          <h2 className="text-sm font-bold tracking-wider text-gray-900 uppercase flex items-center gap-2">
                             <Activity size={14} className="text-blue-500" /> Live Feed
                          </h2>
                       </div>
                       <div className="flex-1 overflow-y-auto p-2">
                          {stats?.recent && stats.recent.length > 0 ? (
                             <div className="divide-y divide-gray-50">
                               {stats.recent.slice(0, 5).map((tx: any, i: number) => (
                                 <div key={i} className="p-3 flex items-center justify-between hover:bg-gray-50 transition-colors rounded-xl">
                                    <div className="flex items-center gap-3">
                                       <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${tx.type.includes('withdraw') ? 'bg-indigo-50 text-indigo-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                          {tx.type.includes('withdraw') ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                                       </div>
                                       <div className="min-w-0">
                                          <p className="font-bold text-xs text-gray-900  capitalize">{tx.type.replace(/_/g, ' ')}</p>
                                          <p className="text-[10px] text-gray-400 font-mono ">{new Date(tx.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                       </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                       <p className="font-bold text-xs text-gray-900">{tx.amount?.toLocaleString()}</p>
                                    </div>
                                 </div>
                               ))}
                             </div>
                          ) : (
                             <div className="h-full flex items-center justify-center text-xs text-gray-400 font-medium">No recent activity</div>
                          )}
                       </div>
                    </div>
                 </div>
              </div>
           )}

           {/* Reusable Data Table Component Wrapper mapping activeTab to filters */}
           {(activeTab === 'users' || activeTab === 'merchants' || activeTab === 'agents') && (
              <div className="space-y-6">
                 <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[calc(100vh-8rem)]">
                    <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/30 shrink-0">
                       <div>
                          <h2 className="font-bold text-gray-900 tracking-tight text-lg capitalize">{activeTab === 'users' ? 'User Management' : activeTab}</h2>
                          <p className="text-xs text-gray-500 mt-1">Manage accounts, roles, limits, and statuses.</p>
                       </div>
                       <div className="flex items-center gap-3">
                          <button onClick={() => setIsAddUserModalOpen(true)} className="px-4 py-2 bg-gray-900 text-white text-sm font-bold rounded-xl shadow-sm hover:bg-gray-800 transition flex items-center gap-2">
                             <Users size={16} /> Add {activeTab === 'users' ? 'User' : activeTab.slice(0,-1)}
                          </button>
                       </div>
                    </div>
                    <div className="flex-1 overflow-auto">
                       <table className="w-full text-left text-sm whitespace-nowrap">
                          <thead className="bg-gray-50/80 text-gray-600 font-bold text-xs uppercase tracking-wider sticky top-0 z-10 hidden sm:table-header-group shadow-sm">
                             <tr>
                                <th className="px-6 py-4 border-b border-gray-100">User Details</th>
                                <th className="px-6 py-4 border-b border-gray-100">Role & Level</th>
                                <th className="px-6 py-4 border-b border-gray-100">Date Joined</th>
                                <th className="px-6 py-4 border-b border-gray-100">Status</th>
                                <th className="px-6 py-4 border-b border-gray-100 text-right">Actions</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                             {users
                               .filter(u => {
                                  if (activeTab === 'users') return u.role !== 'merchant' && u.role !== 'agent';
                                  if (activeTab === 'merchants') return u.role === 'merchant';
                                  if (activeTab === 'agents') return u.role === 'agent';
                                  return true;
                               })
                               .map((u: any) => {
                                 const roleColors: any = {
                                    'user': 'bg-blue-50 text-blue-600',
                                    'merchant': 'bg-purple-50 text-purple-600',
                                    'agent': 'bg-orange-50 text-orange-600',
                                    'support': 'bg-indigo-50 text-indigo-600 border border-indigo-100',
                                    'admin': 'bg-gray-900 text-white',
                                    'finance': 'bg-emerald-50 text-emerald-700',
                                    'compliance': 'bg-rose-50 text-rose-700'
                                 };
                                 const color = roleColors[u.role] || 'bg-gray-100 text-gray-600';
                                 const isRestricted = ['admin', 'super_admin', 'finance', 'compliance', 'executive'].includes(u.role);
                                 return (
                                 <tr key={u._id} className="hover:bg-gray-50/50 transition sm:table-row flex flex-col p-4 sm:p-0">
                                    <td className="px-6 py-4">
                                       <div className="flex items-center gap-3">
                                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-600 shrink-0">
                                             {u.name?.charAt(0)}
                                          </div>
                                          <div>
                                             <p className="font-bold text-gray-900">{u.name || 'Unnamed'}</p>
                                             <p className="text-xs text-gray-500 font-mono mt-0.5">{u.paycamId}</p>
                                          </div>
                                       </div>
                                    </td>
                                    <td className="px-6 py-4">
                                       <span className={`px-2.5 py-1 ${color} rounded-md text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1`}>
                                          {u.role}
                                          {u.role === 'support' && u.level ? <span className="bg-indigo-100 text-indigo-800 px-1 rounded">L{u.level}</span> : ''}
                                       </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 text-xs font-medium">{new Date(u.createdAt).toLocaleDateString()}</td>
                                    <td className="px-6 py-4">
                                       <span className={`px-2.5 py-1 ${u.status === 'active' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'} rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center`}>
                                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${u.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                          {u.status}
                                       </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                       <div className="flex items-center justify-end gap-2">
                                          {!isRestricted ? (
                                             <>
                                                <select 
                                                   value={u.role} 
                                                   onChange={(e) => handleUpdateRole(u._id, e.target.value)}
                                                   className="border border-gray-200 text-xs rounded-lg px-2 py-1.5 bg-white font-bold text-gray-600 focus:outline-none focus:border-gray-300 shadow-sm"
                                                >
                                                   <option value="user">User</option>
                                                   <option value="agent">Agent</option>
                                                   <option value="merchant">Merchant</option>
                                                   <option value="support">Support</option>
                                                </select>
                                                {u.role === 'support' && (
                                                   <button onClick={() => {
                                                       setResetPinUserId(u._id);
                                                       setNewPinValue('');
                                                   }} className="px-3 py-1.5 text-xs font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition border border-orange-100">
                                                       PIN
                                                   </button>
                                                )}
                                                <button onClick={() => setLimitsModalUser(u)} className="px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition border border-blue-100">
                                                   Limits
                                                </button>
                                                <button onClick={() => handleToggleStatus(u._id, u.status)} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition border ${u.status === 'active' ? 'text-red-600 bg-red-50 hover:bg-red-100 border-red-100' : 'text-green-600 bg-green-50 hover:bg-green-100 border-green-100'}`}>
                                                   {u.status === 'active' ? 'Block' : 'Unblock'}
                                                </button>
                                             </>
                                          ) : (
                                             <span className="text-gray-400 text-xs italic bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">Restricted Admin</span>
                                          )}
                                       </div>
                                    </td>
                                 </tr>
                                 )
                             })}
                             {users.length === 0 && (
                                <tr>
                                   <td colSpan={5} className="px-6 py-12 text-center text-gray-500 font-medium text-sm">No users found.</td>
                                </tr>
                             )}
                          </tbody>
                       </table>
                    </div>
                 </div>
              </div>
           )}

           {activeTab === 'support' && (
              <div className="space-y-6">
                 <div className="flex gap-4 border-b border-gray-200">
                     <button onClick={() => setSupportSubTab('personnel')} className={`pb-3 text-sm font-bold transition ${supportSubTab === 'personnel' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>Support Personnel</button>
                     <button onClick={() => setSupportSubTab('categories')} className={`pb-3 text-sm font-bold transition ${supportSubTab === 'categories' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>Issue Categories</button>
                 </div>
                 
                 {supportSubTab === 'personnel' && (
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="font-bold text-gray-900 tracking-tight text-lg">Support Personnel ({users.filter(u => u.role === 'support').length})</h2>
                            <button onClick={() => { setNewUser({ name: '', phone: '', pin: '', role: 'support', level: 1 }); setIsAddUserModalOpen(true); }} className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-black transition flex items-center gap-2">
                               <Users size={16} /> Add Support Agent
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                           <table className="w-full text-left text-sm">
                              <thead className="bg-gray-50/50 text-gray-500 font-medium border-b border-gray-100">
                                 <tr>
                                    <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Agent</th>
                                    <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Level</th>
                                    <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Actions</th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-50">
                                 {users.filter(u => u.role === 'support').map((u, i) => (
                                    <tr key={i} className="hover:bg-gray-50/50 transition">
                                       <td className="px-6 py-4">
                                          <div className="font-bold text-gray-900">{u.name}</div>
                                          <div className="text-gray-500 font-mono text-xs">{u.paycamId}</div>
                                       </td>
                                       <td className="px-6 py-4">
                                          <select value={u.level || 1} onChange={(e) => fetch(`/api/admin/users/${u._id}/role`, { method: 'POST', headers: { 'Content-Type': 'application/json'}, body: JSON.stringify({ role: 'support', level: Number(e.target.value) }) }).then(() => fetchAdminData())} className="bg-gray-50 border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none text-black">
                                              <option value={1} className="text-black">Tier 1</option>
                                              <option value={2} className="text-black">Tier 2</option>
                                              <option value={3} className="text-black">Tier 3</option>
                                          </select>
                                       </td>
                                       <td className="px-6 py-4">
                                           <button onClick={() => {
                                               fetch(`/api/admin/users/${u._id}/status`, {
                                                   method: 'POST',
                                                   headers: { 'Content-Type': 'application/json' },
                                                   body: JSON.stringify({ status: 'deleted' })
                                               }).then(() => fetchAdminData())
                                           }} className="text-red-500 hover:text-red-700 text-xs font-bold">Delete</button>
                                       </td>
                                    </tr>
                                 ))}
                              </tbody>
                           </table>
                        </div>
                    </div>
                 )}
                 {supportSubTab === 'categories' && (
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-6">
                       <h2 className="font-bold text-gray-900 tracking-tight text-lg mb-4">Issue Categories & Mapping</h2>
                       <div className="grid grid-cols-1 gap-4 mb-6">
                           {supportCategories.map((cat, i) => (
                               <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                                   <div className="font-medium text-sm text-gray-900">{cat.name}</div>
                                   <div className="flex items-center gap-4">
                                       <select value={cat.level} onChange={(e) => fetch(`/api/admin/support/categories/${cat.id}/level`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ level: Number(e.target.value) }) }).then(() => fetchAdminData())} className="bg-white border border-gray-200 rounded px-2 py-1 text-xs text-black">
                                           <option value={1} className="text-black">Tier 1</option>
                                           <option value={2} className="text-black">Tier 2</option>
                                           <option value={3} className="text-black">Tier 3</option>
                                       </select>
                                       <button onClick={() => fetch(`/api/admin/support/categories/${cat.id}`, { method: 'DELETE' }).then(() => fetchAdminData())} className="text-red-500 hover:text-red-700"><Trash2 size={14}/></button>
                                   </div>
                               </div>
                           ))}
                       </div>
                       <form onSubmit={(e) => {
                           e.preventDefault();
                           const fd = new FormData(e.currentTarget);
                           fetch('/api/admin/support/categories', {
                               method: 'POST',
                               headers: { 'Content-Type': 'application/json' },
                               body: JSON.stringify({ name: fd.get('name'), level: fd.get('level') })
                           }).then(() => fetchAdminData());
                           (e.target as HTMLFormElement).reset();
                       }} className="flex gap-4 items-end">
                           <div className="flex-1">
                               <label className="block text-xs font-bold text-gray-500 mb-1">New Category Name</label>
                               <input name="name" required className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="e.g. Password Reset" />
                           </div>
                           <div className="w-32">
                               <label className="block text-xs font-bold text-gray-500 mb-1">Tier</label>
                               <select name="level" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-black">
                                   <option value={1} className="text-black">Tier 1</option>
                                   <option value={2} className="text-black">Tier 2</option>
                                   <option value={3} className="text-black">Tier 3</option>
                               </select>
                           </div>
                           <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold">Add</button>
                       </form>
                    </div>
                 )}
              </div>
           )}

           {activeTab === 'finance-staff' && (
              <div className="space-y-6">
                 <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                     <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                         <h2 className="font-bold text-gray-900 tracking-tight text-lg">Finance Personnel ({users.filter(u => u.role === 'finance').length})</h2>
                         <button onClick={() => { setNewUser({ name: '', phone: '', pin: '', role: 'finance', level: 1 }); setIsAddUserModalOpen(true); }} className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-black transition flex items-center gap-2">
                            <Briefcase size={16} /> Add Finance Staff
                         </button>
                     </div>
                     <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                           <thead className="bg-gray-50/50 text-gray-500 font-medium border-b border-gray-100">
                              <tr>
                                 <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Staff Member</th>
                                 <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Role/Permissions</th>
                                 <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Status</th>
                                 <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Actions</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-50">
                              {users.filter(u => u.role === 'finance').map((u, i) => (
                                 <tr key={i} className="hover:bg-gray-50/50 transition">
                                    <td className="px-6 py-4">
                                       <div className="font-bold text-gray-900">{u.name}</div>
                                       <div className="text-gray-500 font-mono text-xs">{u.phone}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                       <select value={u.level || 1} onChange={(e) => fetch(`/api/admin/users/${u._id}/role`, { method: 'POST', headers: { 'Content-Type': 'application/json'}, body: JSON.stringify({ role: 'finance', level: Number(e.target.value) }) }).then(() => fetchAdminData())} className="bg-gray-50 border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none font-medium text-black">
                                           <option value={1} className="text-black">Finance Analyst (Read-Only)</option>
                                           <option value={2} className="text-black">Finance Manager (Operations)</option>
                                           <option value={3} className="text-black">Finance Controller (Full Access)</option>
                                       </select>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${u.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                            {u.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 flex items-center gap-3">
                                        <button onClick={() => setResetPinUserId(u._id)} className="text-blue-600 hover:text-blue-800 text-xs font-bold transition">Reset PIN</button>
                                        <button onClick={() => toast.info(`Viewing activity for ${u.name}`)} className="text-gray-600 hover:text-gray-900 text-xs font-bold transition">View Activity</button>
                                        <button onClick={() => {
                                            const newStatus = u.status === 'active' ? 'blocked (frozen)' : 'active';
                                            fetch(`/api/admin/users/${u._id}/status`, {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ status: newStatus })
                                            }).then(() => fetchAdminData())
                                        }} className={`${u.status === 'active' ? 'text-orange-500 hover:text-orange-700' : 'text-emerald-600 hover:text-emerald-800'} text-xs font-bold transition`}>
                                            {u.status === 'active' ? 'Deactivate' : 'Activate'}
                                        </button>
                                        <button onClick={() => {
                                            if (window.confirm('Are you sure you want to delete this finance account?')) {
                                                fetch(`/api/admin/users/${u._id}/status`, {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ status: 'deleted' })
                                                }).then(() => { toast.success('Staff deleted'); fetchAdminData(); })
                                            }
                                        }} className="text-red-500 hover:text-red-700 text-xs font-bold transition">Delete</button>
                                    </td>
                                 </tr>
                              ))}
                              {users.filter(u => u.role === 'finance').length === 0 && (
                                 <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500 font-medium text-sm">No finance staff found.</td>
                                 </tr>
                              )}
                           </tbody>
                        </table>
                     </div>
                 </div>
              </div>
           )}

           {activeTab === 'transactions' && (
              <div className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col">
                       <div className="text-gray-500 text-xs font-bold tracking-wider uppercase mb-2">Today's Txns</div>
                       <div className="text-3xl font-black text-gray-900">{ledgerTransactions.filter((t: any) => new Date(t.createdAt).toDateString() === new Date().toDateString()).length}</div>
                    </div>
                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col">
                       <div className="text-gray-500 text-xs font-bold tracking-wider uppercase mb-2">Processing/Pending</div>
                       <div className="text-3xl font-black text-orange-500">{ledgerTransactions.filter((t: any) => t.status === 'pending').length}</div>
                    </div>
                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col">
                       <div className="text-gray-500 text-xs font-bold tracking-wider uppercase mb-2">Flagged/Failed</div>
                       <div className="text-3xl font-black text-red-500">{ledgerTransactions.filter((t: any) => t.status === 'flagged' || t.status === 'failed' || t.status === 'rejected').length}</div>
                    </div>
                 </div>
                 <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[600px]">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
                       <div>
                           <h2 className="font-bold text-gray-900 tracking-tight text-lg">Global Transaction Ledger</h2>
                           <p className="text-xs text-gray-500 mt-1">Live overview of all system transfers and deposits.</p>
                       </div>
                       <span className="px-3 py-1 bg-gray-900 text-white rounded-full text-xs font-bold shadow-sm">{ledgerTransactions.length} Total</span>
                    </div>
                    <div className="flex-1 overflow-x-auto overflow-y-auto">
                       <table className="w-full text-left border-collapse whitespace-nowrap">
                          <thead className="sticky top-0 bg-white shadow-sm z-10">
                             <tr className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-bold bg-gray-50/50">
                                <th className="p-4 pl-6">Tx ID</th>
                                <th className="p-4">Type</th>
                                <th className="p-4">Amount</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Details</th>
                                <th className="p-4 pr-6 text-right">Date</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                             {ledgerTransactions.map((tx: any) => (
                               <tr key={tx._id} className="hover:bg-gray-50/50 transition">
                                  <td className="p-4 pl-6 text-sm font-mono text-gray-500">{tx._id.slice(-8).toUpperCase()}</td>
                                  <td className="p-4">
                                      <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md text-[10px] font-bold uppercase tracking-wider">
                                          {tx.type.replace('_', ' ')}
                                      </span>
                                  </td>
                                  <td className="p-4 text-sm font-black text-gray-900">{tx.amount?.toLocaleString() || 0} XAF</td>
                                  <td className="p-4">
                                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                          tx.status === 'completed' ? 'bg-green-50 text-green-700 border border-green-100' :
                                          tx.status === 'pending' ? 'bg-orange-50 text-orange-700 border border-orange-100' :
                                          'bg-red-50 text-red-700 border border-red-100'
                                      }`}>
                                          {tx.status}
                                      </span>
                                  </td>
                                  <td className="p-4 text-xs text-gray-600 font-medium">
                                      {tx.recipient || tx.agency || 'System Core'}
                                  </td>
                                  <td className="p-4 pr-6 text-right text-xs text-gray-500 font-mono">
                                      {new Date(tx.createdAt).toLocaleString()}
                                  </td>
                               </tr>
                             ))}
                             {ledgerTransactions.length === 0 && (
                                <tr>
                                   <td colSpan={6} className="p-12 text-center text-gray-500 font-medium text-sm">No records found.</td>
                                </tr>
                             )}
                          </tbody>
                       </table>
                    </div>
                 </div>
              </div>
           )}

           {activeTab === 'approvals' && (
              <div className="space-y-6">
                 <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
                       <div>
                         <h2 className="font-bold text-gray-900 tracking-tight text-lg">Pending Operational Approvals</h2>
                         <p className="text-xs text-gray-500 mt-1">Manual oversight for limits, KYCs, and system overrides.</p>
                       </div>
                       <span className="px-4 py-1.5 bg-orange-100 text-orange-700 font-bold rounded-lg text-xs border border-orange-200">{approvals.length} Pending requests</span>
                    </div>
                    <div className="divide-y divide-gray-100 p-2">
                       {approvals.map(approval => (
                         <div key={approval.id} className="p-4 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white hover:bg-gray-50 transition rounded-xl m-2 border border-gray-50">
                            <div className="flex-1">
                               <p className="text-sm font-bold text-gray-900">{approval.title || (approval.type === 'merchant_registration' ? `Merchant Registration: ${approval.metadata?.businessName}` : approval.type)}</p>
                               <p className="text-xs text-gray-500 mt-1">{approval.desc || (approval.type === 'merchant_registration' ? `User ${approval.metadata?.name} (${approval.metadata?.phone}) wants to become a merchant.` : '')}</p>
                            </div>
                            <div className="flex items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0 shrink-0">
                               <button onClick={() => handleReject(approval.id)} className="flex-1 sm:flex-none px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold transition flex justify-center items-center gap-2"><XCircle size={16}/> Reject</button>
                               <button onClick={() => handleApprove(approval.id)} className="flex-1 sm:flex-none px-5 py-2.5 bg-green-500 text-white rounded-xl hover:bg-green-600 text-sm font-bold shadow-[0_2px_10px_rgba(34,197,94,0.3)] transition flex justify-center items-center gap-2"><CheckCircle size={16}/> Approve</button>
                            </div>
                         </div>
                       ))}
                       {approvals.length === 0 && (
                         <div className="p-16 text-center">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                               <CheckSquare size={24} className="text-gray-300" />
                            </div>
                            <p className="text-gray-500 text-sm font-medium">All caught up! No pending approvals.</p>
                         </div>
                       )}
                    </div>
                 </div>
              </div>
           )}

           {activeTab === 'compliance' && (
              <div className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-8 flex flex-col h-[300px]">
                       <h2 className="text-lg font-bold tracking-tight mb-2">KYC Verifications</h2>
                       <p className="text-sm text-gray-500 mb-6">Automated document processing statistics</p>
                       <div className="flex-1 flex flex-col justify-center">
                          <div className="flex justify-between items-end mb-2">
                             <span className="text-3xl font-black text-gray-900">
                                {stats?.totalUsers ? ((stats.totalKycVerified / stats.totalUsers) * 100).toFixed(1) : '0'}%
                             </span>
                             <span className="text-sm font-bold text-green-500">Auto-approved</span>
                          </div>
                          <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden mb-4">
                             <div className="bg-green-500 h-full" style={{ width: `${stats?.totalUsers ? ((stats.totalKycVerified / stats.totalUsers) * 100) : 0}%` }}></div>
                          </div>
                          <p className="text-xs text-gray-400 font-medium">
                              Requires ~{stats?.totalUsers ? (100 - ((stats.totalKycVerified / stats.totalUsers) * 100)).toFixed(1) : '100'}% manual review queue.
                          </p>
                       </div>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-8 flex flex-col h-[300px]">
                       <h2 className="text-lg font-bold tracking-tight mb-2">Regulatory Holds</h2>
                       <p className="text-sm text-gray-500 mb-6">Accounts frozen for compliance review</p>
                       <div className="flex-1 flex items-center justify-center flex-col">
                          <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center mb-4">
                             <ShieldAlert size={24} className="text-rose-500" />
                          </div>
                          <span className="text-4xl font-black text-gray-900 mb-2">{stats?.totalHolds || 0}</span>
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Active Holds</span>
                       </div>
                    </div>
                 </div>
                 
                 {/* Re-use AML Alerts here but styled better */}
                 <div className="bg-white border border-gray-100 rounded-3xl shadow-sm pt-6 flex flex-col">
                    <div className="px-6 pb-4 border-b border-gray-100">
                       <h3 className="font-bold text-gray-900 tracking-tight text-lg">AML Transaction Alerts</h3>
                       <p className="text-xs text-gray-500 mt-1">Triggered by the AI monitoring engine</p>
                    </div>
                    <div className="p-4">
                       <table className="w-full text-left text-sm whitespace-nowrap">
                           <thead className="bg-gray-50/50 text-gray-500 text-xs font-bold uppercase tracking-wider">
                              <tr>
                                 <th className="px-4 py-3 border-b border-gray-100 rounded-tl-lg">Severity</th>
                                 <th className="px-4 py-3 border-b border-gray-100">Rule Triggered</th>
                                 <th className="px-4 py-3 border-b border-gray-100">Description</th>
                                 <th className="px-4 py-3 border-b border-gray-100 text-right">Timestamp</th>
                                 <th className="px-4 py-3 border-b border-gray-100 text-right rounded-tr-lg">Action</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-50">
                              {amlAlerts.length > 0 ? amlAlerts.map((a, i) => (
                                 <tr key={i} className="hover:bg-gray-50/30">
                                    <td className="px-4 py-3">
                                       <span className={`px-2 py-1 rounded bg-white border text-[10px] font-black uppercase tracking-wider ${a.severity === 'High' ? 'text-rose-600 border-rose-200 shadow-[0_2px_10px_rgba(225,29,72,0.1)]' : 'text-orange-600 border-orange-200'}`}>
                                          {a.severity}
                                       </span>
                                    </td>
                                    <td className="px-4 py-3 font-bold text-gray-800">{a.ruleTriggered}</td>
                                    <td className="px-4 py-3 text-xs text-gray-500 max-w-sm ">{a.description}</td>
                                    <td className="px-4 py-3 text-right text-xs font-mono text-gray-400">{new Date(a.createdAt).toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right">
                                      {a.status === 'open' ? (
                                        <div className="flex gap-2 justify-end">
                                          <button onClick={() => {
                                            fetch(`/api/compliance/aml-alerts/${a._id}/resolve`, {
                                              method: 'POST',
                                              headers: { 'Content-Type': 'application/json' },
                                              body: JSON.stringify({ action: 'approve', note: 'Cleared by admin', officerId: user?._id || 'admin' })
                                            }).then(() => fetchAdminData(false));
                                          }} className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-lg hover:bg-green-600 transition">Clear</button>
                                          <button onClick={() => {
                                            fetch(`/api/compliance/aml-alerts/${a._id}/resolve`, {
                                              method: 'POST',
                                              headers: { 'Content-Type': 'application/json' },
                                              body: JSON.stringify({ action: 'reject', note: 'Escalated by admin', officerId: user?._id || 'admin' })
                                            }).then(() => fetchAdminData(false));
                                          }} className="px-3 py-1 bg-rose-500 text-white text-xs font-bold rounded-lg hover:bg-rose-600 transition">Escalate</button>
                                        </div>
                                      ) : (
                                        <span className="text-xs font-bold text-gray-400 capitalize">{a.status}</span>
                                      )}
                                    </td>
                                 </tr>
                              )) : (
                                 <tr><td colSpan={5} className="p-8 text-center text-gray-400 text-xs">No active AML alerts.</td></tr>
                              )}
                           </tbody>
                       </table>
                    </div>
                 </div>
              </div>
           )}

           {activeTab === 'fraud' && (
              <div className="space-y-6">
                 {/* Reused fraud logic with modern styling */}
                 <div className="bg-dark rounded-3xl p-8 shadow-xl border border-gray-800 text-green-400 font-mono text-sm relative overflow-hidden h-[600px] flex flex-col">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-800">
                       <div className="flex items-center gap-3">
                          <div className="bg-green-500/20 p-2 rounded-lg">
                             <Activity size={20} className="text-green-500 animate-pulse" />
                          </div>
                          <div>
                             <span className="text-white font-bold tracking-widest uppercase text-base block leading-tight">Live Threat Stream</span>
                             <span className="text-green-500/50 text-[10px] tracking-widest">Real-time Agent Telemetry</span>
                          </div>
                       </div>
                       <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-xs">
                          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                          <span className="text-white">Active</span>
                       </div>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-4 pr-4 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
                       {agentLogs.map((log: any, i: number) => (
                          <div key={i} className="flex flex-col sm:flex-row items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition">
                             <span className="text-gray-500 shrink-0 text-xs bg-black/50 px-2 py-1 rounded">[{new Date(log.timestamp || log.createdAt).toLocaleTimeString()}]</span>
                             <span className={`text-sm ${log.type === 'alert' ? 'text-rose-400 font-bold' : log.type === 'system' ? 'text-blue-400' : 'text-green-400'}`}>{log.action}</span>
                          </div>
                       ))}
                       {agentLogs.length === 0 && <span className="text-gray-500 flex items-center justify-center h-full">Connecting to telemetry stream...</span>}
                    </div>
                 </div>
              </div>
           )}

           {activeTab === 'reports' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-emerald-900 to-[#064e3b] p-8 rounded-3xl shadow-lg border border-emerald-800 flex flex-col justify-center relative overflow-hidden min-h-[300px]">
                        <div className="flex items-center gap-2 text-emerald-300 mb-2 text-xs font-bold tracking-wider uppercase relative z-10">
                          <DollarSign size={14} /> Total Platform Profits
                        </div>
                        <div className="text-4xl font-black text-white relative z-10 mb-4 " title={(Math.max(0, stats?.totalRevenue || 0)).toLocaleString() + ' XAF'}>
                            {(Math.max(0, stats?.totalRevenue || 0)).toLocaleString() || '2,850,000'} <span className="text-lg text-emerald-400/50 font-medium">XAF</span>
                        </div>
                        <p className="text-emerald-100/70 text-sm relative z-10 mb-6">Cumulative revenue from transaction fees and system sweeps.</p>
                        <div className="flex gap-4 flex-wrap w-full mt-auto relative z-10">
                           <button onClick={handleExportCsv} className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold text-sm rounded-xl shadow-lg shadow-emerald-900/20 transition">Download P&L</button>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex flex-col items-center justify-center min-h-[300px]">
                       <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-6 border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                         <FileText size={28} className="text-blue-600" />
                       </div>
                       <h2 className="text-xl font-bold text-gray-900 tracking-tight mb-2">Automated Reporting</h2>
                       <p className="text-gray-500 text-sm mb-8 max-w-sm text-center">Download end-of-day ledgers, CSV dumps, and cryptographically signed PDF audits.</p>
                       <div className="flex gap-4 flex-wrap justify-center w-full max-w-sm">
                          <button onClick={handleExportCsv} className="flex-1 py-3 bg-gray-900 text-white font-bold text-sm rounded-xl shadow-lg shadow-gray-900/20 hover:bg-gray-800 transition">Export CSV</button>
                          <button onClick={() => handleGenerateAuditPdf()} className="flex-1 py-3 bg-white text-gray-700 font-bold text-sm rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition">Generate PDF</button>
                       </div>
                    </div>
                    
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex flex-col">
                       <div className="mb-6">
                          <h2 className="font-bold text-gray-900 tracking-tight text-lg mb-1">Operational Calendar</h2>
                          <p className="text-xs text-gray-500">Visualizing platform load across 24h cycles</p>
                       </div>
                       <div className="flex-1 flex items-center justify-center w-full min-h-[200px]">
                          {stats?.heatmapData ? (
                              <OperationalCalendar data={stats.heatmapData} />
                          ) : (
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                          )}
                       </div>
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
                       <h2 className="font-bold text-gray-900 tracking-tight text-lg">Settlement Archive</h2>
                    </div>
                    <div className="overflow-x-auto">
                       <table className="w-full text-left text-sm whitespace-nowrap">
                          <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider">
                             <tr>
                                <th className="px-6 py-4 border-b border-gray-100">Reference ID</th>
                                <th className="px-6 py-4 border-b border-gray-100">Date Logged</th>
                                <th className="px-6 py-4 border-b border-gray-100">Type</th>
                                <th className="px-6 py-4 border-b border-gray-100">Signature Memo</th>
                                <th className="px-6 py-4 border-b border-gray-100 text-right">Action</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                             {ledgerTransactions.map((log: any) => (
                               <tr key={log._id || log.id} className="hover:bg-gray-50/50 transition">
                                  <td className="px-6 py-4 font-mono text-xs text-gray-500">{log._id || log.id}</td>
                                  <td className="px-6 py-4 font-medium text-gray-800">{new Date(log.createdAt || log.date).toLocaleString()}</td>
                                  <td className="px-6 py-4">
                                     <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded text-[10px] font-bold uppercase tracking-wider">{log.type}</span>
                                  </td>
                                  <td className="px-6 py-4  max-w-[200px] text-xs font-mono text-gray-500">{log.recipient || log.desc || '-'}</td>
                                  <td className="px-6 py-4 text-right">
                                     <button onClick={() => handleDownloadReceipt(log._id || log.id)} className="text-blue-600 text-xs font-bold hover:underline bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">Get Receipt</button>
                                  </td>
                               </tr>
                             ))}
                             {ledgerTransactions.length === 0 && (
                                <tr>
                                   <td colSpan={5} className="px-6 py-12 text-center text-gray-500 font-medium text-sm">No archive logs available.</td>
                                </tr>
                             )}
                          </tbody>
                       </table>
                    </div>
                </div>
              </div>
           )}

           {activeTab === 'health' && (
              <div className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-start text-left">
                       <Server className="text-blue-500 mb-4" size={32} />
                       <h3 className="font-bold text-gray-900 mb-1">Compute Nodes</h3>
                       <p className="text-3xl font-black text-gray-900 mb-2">98.2%</p>
                       <p className="text-xs text-gray-500">Uptime (30d trailing)</p>
                    </div>
                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-start text-left">
                       <RefreshCw className="text-emerald-500 mb-4" size={32} />
                       <h3 className="font-bold text-gray-900 mb-1">Sync Latency</h3>
                       <p className="text-3xl font-black text-gray-900 mb-2">42ms</p>
                       <p className="text-xs text-gray-500">Average ledger commit time</p>
                    </div>
                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-start text-left">
                       <ShieldAlert className="text-violet-500 mb-4" size={32} />
                       <h3 className="font-bold text-gray-900 mb-1">Security Core</h3>
                       <p className="text-3xl font-black text-gray-900 mb-2">v4.1.2</p>
                       <p className="text-xs text-green-500 font-bold uppercase tracking-wider">Fully Patched</p>
                    </div>
                 </div>
                 <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 h-[300px] flex items-center justify-center text-center flex-col">
                    <HeartPulse size={48} className="text-gray-200 mb-4" />
                    <h2 className="text-lg font-bold text-gray-400">All Systems Operational</h2>
                 </div>
              </div>
           )}

           {activeTab === 'settings' && (
              <div className="space-y-6">
                 <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden max-w-4xl mx-auto">
                    <div className="p-8 border-b border-gray-100">
                       <h2 className="text-xl font-bold text-gray-900">Platform Configuration</h2>
                       <p className="text-sm text-gray-500 mt-1">Super Admin global variables and module limits.</p>
                    </div>
                    <div className="p-8 space-y-8">
                       <div>
                          <h3 className="text-sm font-bold tracking-wider text-gray-400 uppercase mb-4">Transaction Fees</h3>
                          <div className="grid grid-cols-2 gap-6">
                             <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Transfer Fee (%)</label>
                                <input type="number" step="0.01" value={systemSettings.transferFeePercent} onChange={e => setSystemSettings({...systemSettings, transferFeePercent: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm text-black focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                             </div>
                             <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Transfer Fee (Fixed)</label>
                                <input type="number" step="1" value={systemSettings.transferFeeFixed} onChange={e => setSystemSettings({...systemSettings, transferFeeFixed: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm text-black focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                             </div>
                             <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Withdrawal Fee (%)</label>
                                <input type="number" step="0.01" value={systemSettings.withdrawalFeePercent} onChange={e => setSystemSettings({...systemSettings, withdrawalFeePercent: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm text-black focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                             </div>
                             <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Withdrawal Fee (Fixed)</label>
                                <input type="number" step="1" value={systemSettings.withdrawalFeeFixed} onChange={e => setSystemSettings({...systemSettings, withdrawalFeeFixed: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm text-black focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                             </div>
                             <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">System Tax Rate (%)</label>
                                <input type="number" step="0.01" value={systemSettings.taxRate} onChange={e => setSystemSettings({...systemSettings, taxRate: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm text-black focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                             </div>
                             <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Merchant Commission (%)</label>
                                <input type="number" step="0.01" value={systemSettings.merchantCommissionRate || 0} onChange={e => setSystemSettings({...systemSettings, merchantCommissionRate: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm text-black focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                             </div>
                             <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Agent Cash-In Commission (%)</label>
                                <input type="number" step="0.01" value={systemSettings.agentCashInCommissionRate || 0} onChange={e => setSystemSettings({...systemSettings, agentCashInCommissionRate: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm text-black focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                             </div>
                             <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Agent Cash-Out Commission (%)</label>
                                <input type="number" step="0.01" value={systemSettings.agentCashOutCommissionRate || 0} onChange={e => setSystemSettings({...systemSettings, agentCashOutCommissionRate: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm text-black focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                             </div>
                          </div>
                       </div>
                       
                       <div>
                          <h3 className="text-sm font-bold tracking-wider text-gray-400 uppercase mb-4">Branding</h3>
                          <div className="space-y-4">
                             <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">App Logo</label>
                                <div className="flex items-center gap-4">
                                   {systemSettings.appLogoUrl && (
                                     <div className="w-16 h-16 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center p-1 overflow-hidden">
                                        <img src={systemSettings.appLogoUrl} alt="Logo Preview" className="w-full h-full object-contain" />
                                     </div>
                                   )}
                                   <label className="px-4 py-2 bg-blue-50 text-blue-600 font-bold rounded-xl cursor-pointer hover:bg-blue-100 transition text-sm">
                                      Select Logo
                                      <input 
                                         type="file" 
                                         accept="image/*"
                                         className="hidden"
                                         onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                               const img = new Image();
                                               img.onload = () => {
                                                  const canvas = document.createElement('canvas');
                                                  const MAX_WIDTH = 200;
                                                  const MAX_HEIGHT = 200;
                                                  let width = img.width;
                                                  let height = img.height;
                                     
                                                  if (width > height) {
                                                      if (width > MAX_WIDTH) {
                                                          height *= MAX_WIDTH / width;
                                                          width = MAX_WIDTH;
                                                      }
                                                  } else {
                                                      if (height > MAX_HEIGHT) {
                                                          width *= MAX_HEIGHT / height;
                                                          height = MAX_HEIGHT;
                                                      }
                                                  }
                                                  canvas.width = width;
                                                  canvas.height = height;
                                                  const ctx = canvas.getContext('2d');
                                                  ctx?.drawImage(img, 0, 0, width, height);
                                                  const dataUrl = canvas.toDataURL('image/png');
                                                  setSystemSettings({...systemSettings, appLogoUrl: dataUrl});
                                               };
                                               img.src = URL.createObjectURL(file);
                                            }
                                         }} 
                                      />
                                   </label>
                                   {systemSettings.appLogoUrl && (
                                      <button 
                                         type="button"
                                         onClick={() => setSystemSettings({...systemSettings, appLogoUrl: ''})}
                                         className="px-4 py-2 text-sm text-red-500 hover:bg-red-50 font-bold rounded-xl transition"
                                      >
                                         Remove
                                      </button>
                                   )}
                                </div>
                                <p className="text-xs text-gray-400 mt-2">Upload a logo image from your device to display across the application.</p>
                             </div>
                          </div>
                       </div>
                       
                       <div>
                          <h3 className="text-sm font-bold tracking-wider text-gray-400 uppercase mb-4">Security Policies</h3>
                          <div className="space-y-4">
                             <div className="flex items-center justify-between p-4 border border-gray-100 rounded-2xl bg-gray-50/50">
                                <div>
                                   <p className="font-bold text-gray-900 text-sm">Require 2FA for Support Agents</p>
                                   <p className="text-xs text-gray-500 mt-0.5">Mandatory TOTP token on login</p>
                                </div>
                                <div onClick={() => setSystemSettings({...systemSettings, require2FASupport: !systemSettings.require2FASupport})} className={`w-12 h-6 rounded-full relative cursor-pointer shadow-inner transition-colors ${systemSettings.require2FASupport ? 'bg-blue-600' : 'bg-gray-200'}`}>
                                   <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${systemSettings.require2FASupport ? 'right-1 translate-x-0' : 'left-1 translate-x-0'}`}></div>
                                </div>
                             </div>
                             <div className="flex items-center justify-between p-4 border border-gray-100 rounded-2xl bg-gray-50/50">
                                <div>
                                   <p className="font-bold text-gray-900 text-sm">Geo-blocking rules</p>
                                   <p className="text-xs text-gray-500 mt-0.5">Block logins outside operational region</p>
                                </div>
                                <div onClick={() => setSystemSettings({...systemSettings, geoBlocking: !systemSettings.geoBlocking})} className={`w-12 h-6 rounded-full relative cursor-pointer shadow-inner transition-colors ${systemSettings.geoBlocking ? 'bg-blue-600' : 'bg-gray-200'}`}>
                                   <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${systemSettings.geoBlocking ? 'right-1 translate-x-0' : 'left-1 translate-x-0'}`}></div>
                                </div>
                             </div>
                          </div>
                       </div>
                       
                       <div className="pt-4 border-t border-gray-100">
                          <h3 className="text-sm font-bold tracking-wider text-gray-400 uppercase mb-4">Company Bank & Float Accounts</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                             {treasuryAccounts.map((acc, i) => (
                                <div key={i} className="p-4 border border-gray-100 rounded-2xl bg-gray-50/50 flex flex-col justify-between">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="font-bold text-gray-900">{acc.name}</div>
                                        <div className="flex items-center gap-2">
                                           <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{acc.type}</div>
                                           <div className="flex items-center gap-1">
                                               <button onClick={() => {
                                                   setEditingAccount(acc);
                                                   setBankForm({ id: acc.id, name: acc.name, type: acc.type, accountNumber: acc.accountNumber || '' });
                                               }} className="p-1 text-gray-400 hover:text-emerald-600 transition"><Edit size={14}/></button>
                                               <button onClick={() => {
                                                   fetch(`/api/finance/treasury/accounts/${acc.id}`, { method: 'DELETE' })
                                                       .then(() => { toast.success('Account deleted'); fetchAdminData(); });
                                               }} className="p-1 text-gray-400 hover:text-red-600 transition"><Trash2 size={14}/></button>
                                           </div>
                                        </div>
                                    </div>
                                    <div className="font-mono text-xs text-gray-500">{acc.accountNumber || 'No Account Number'}</div>
                                </div>
                             ))}
                          </div>
                          
                          <form onSubmit={(e) => {
                              e.preventDefault();
                              if (editingAccount) {
                                  fetch(`/api/finance/treasury/accounts/${editingAccount.id}`, {
                                      method: 'PUT',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify(bankForm)
                                  }).then(() => { 
                                      toast.success('Account updated'); 
                                      fetchAdminData(); 
                                      setEditingAccount(null);
                                      setBankForm({ id: '', name: '', type: 'Bank', accountNumber: '' });
                                  });
                              } else {
                                  fetch('/api/finance/treasury/accounts', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify(bankForm)
                                  }).then(() => { 
                                      toast.success('Account added'); 
                                      fetchAdminData(); 
                                      setBankForm({ id: '', name: '', type: 'Bank', accountNumber: '' });
                                  });
                              }
                          }} className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                             <div className="flex justify-between items-center mb-4">
                                <h4 className="text-sm font-bold text-gray-900">{editingAccount ? 'Edit Account' : 'Add New Account'}</h4>
                                {editingAccount && (
                                    <button type="button" onClick={() => {
                                        setEditingAccount(null);
                                        setBankForm({ id: '', name: '', type: 'Bank', accountNumber: '' });
                                    }} className="text-xs font-bold text-gray-500 hover:text-gray-900 transition">Cancel</button>
                                )}
                             </div>
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Account Name</label>
                                    <select required value={bankForm.name} onChange={(e) => setBankForm({...bankForm, name: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm text-black bg-white">
                                        <option value="">Select Account Name</option>
                                        <option value="PayCam - Ecobank">PayCam - Ecobank</option>
                                        <option value="PayCam - BICEC">PayCam - BICEC</option>
                                        <option value="PayCam - Afriland First Bank">PayCam - Afriland First Bank</option>
                                        <option value="PayCam - MTN MoMo">PayCam - MTN MoMo</option>
                                        <option value="PayCam - Orange Money">PayCam - Orange Money</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Account Number (Optional)</label>
                                    <input value={bankForm.accountNumber} onChange={(e) => setBankForm({...bankForm, accountNumber: e.target.value})} placeholder="e.g. 123456789" className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm text-black" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Type</label>
                                    <div className="flex gap-2">
                                      <select value={bankForm.type} onChange={(e) => setBankForm({...bankForm, type: e.target.value})} className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm bg-white text-black">
                                          <option value="Bank">Bank Account</option>
                                          <option value="Float">Mobile Float</option>
                                      </select>
                                      <button type="submit" className="px-4 py-2 bg-gray-900 text-white font-bold rounded-xl shadow-lg shadow-gray-900/20 w-fit hover:bg-black transition whitespace-nowrap">
                                          {editingAccount ? 'Update' : 'Add'}
                                      </button>
                                    </div>
                                </div>
                             </div>
                          </form>
                       </div>
                       
                       <div className="pt-4 border-t border-gray-100 mt-8">
                          <button onClick={() => {
                              fetch('/api/admin/settings', {
                                  method: 'POST',
                                  headers: {'Content-Type': 'application/json'},
                                  body: JSON.stringify({ settings: systemSettings })
                              }).then(res => res.json()).then(data => {
                                  if(data.success) {
                                      toast.success('Settings saved successfully');
                                      setSystemSettings(data.settings);
                                  }
                              }).catch(console.error);
                          }} className="px-6 py-3 bg-gray-900 text-white font-bold rounded-xl shadow-lg shadow-gray-900/20 w-fit hover:bg-black transition">Save Configurations</button>
                       </div>
                    </div>
                 </div>
              </div>
           )}
        </main>
      </div>

      {/* MODALS */}
      {resetPinUserId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2"><Settings size={20} className="text-orange-500"/> Force Reset PIN</h2>
            <form onSubmit={handleResetPin} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">New 5-Digit PIN</label>
                <input required type="password" pattern="\d{5}" title="PIN must be exactly 5 digits" value={newPinValue} onChange={e => setNewPinValue(e.target.value)} maxLength={5} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-base font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition" placeholder="•••••" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setResetPinUserId(null)} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition shadow-[0_2px_10px_rgba(249,115,22,0.3)]">Update Key</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAddUserModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 font-sans">Provision Account</h2>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Full Name</label>
                   <input required type="text" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-black" />
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Phone Number</label>
                   <input required type="tel" value={newUser.phone} onChange={e => setNewUser({...newUser, phone: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-mono text-black" />
                 </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">System Role</label>
                   <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-black">
                       <option value="user" className="text-black">Standard User</option>
                       <option value="merchant" className="text-black">Merchant Account</option>
                       <option value="agent" className="text-black">Mobile Agent</option>
                       <option value="support" className="text-black">Support Staff</option>
                       <option value="finance" className="text-black">Finance Staff</option>
                       <option value="admin" className="text-black">Administrator</option>
                   </select>
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Initial PIN</label>
                   <input required type="password" pattern="\d{5}" title="PIN must be exactly 5 digits" value={newUser.pin} onChange={e => setNewUser({...newUser, pin: e.target.value})} maxLength={5} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 tracking-widest font-mono text-center text-black" placeholder="•••••" />
                 </div>
              </div>

              {newUser.role === 'support' && (
                <div className="pt-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Support Clearance Level</label>
                  <select value={newUser.level} onChange={e => setNewUser({...newUser, level: Number(e.target.value)})} className="w-full px-4 py-2.5 bg-blue-50 border border-blue-200 text-black font-medium rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm">
                      <option value={1} className="text-black">Tier 1 (General CS)</option>
                      <option value={2} className="text-black">Tier 2 (Technical Dispute)</option>
                      <option value={3} className="text-black">Tier 3 (Manager Override)</option>
                  </select>
                </div>
              )}

              {newUser.role === 'finance' && (
                <div className="pt-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Finance Role</label>
                  <select value={newUser.level} onChange={e => setNewUser({...newUser, level: Number(e.target.value)})} className="w-full px-4 py-2.5 bg-emerald-50 border border-emerald-200 text-black font-medium rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-sm">
                      <option value={1} className="text-black">Finance Analyst (Read-Only)</option>
                      <option value={2} className="text-black">Finance Manager (Operations)</option>
                      <option value={3} className="text-black">Finance Controller (Full Access)</option>
                  </select>
                </div>
              )}
              
              <div className="flex gap-3 pt-6 border-t border-gray-100 mt-6">
                <button type="button" onClick={() => setIsAddUserModalOpen(false)} className="flex-1 py-3.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition">Discard</button>
                <button type="submit" className="flex-1 py-3.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition shadow-lg shadow-gray-900/20">Provision Key</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {limitsModalUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Operational Limits</h2>
            <p className="text-xs text-gray-500 mb-6 font-mono">{limitsModalUser.paycamId} - {limitsModalUser.name}</p>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const limits = {
                  maxPerTransfer: Number(formData.get('maxPerTransfer')),
                  maxDaily: Number(formData.get('maxDaily')),
                  maxMonthly: Number(formData.get('maxMonthly'))
              };
              for (const [key, value] of Object.entries(limits)) {
                 if (!value) delete (limits as any)[key];
              }

              try {
                  const res = await fetch(`/api/admin/users/${limitsModalUser._id}/limits`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ limits })
                  });
                  if (res.ok) {
                      toast.success('Limits updated');
                      setLimitsModalUser(null);
                      // Custom re-fetch equivalent
                      fetch('/api/admin/users').then(r => r.json()).then(d => setUsers(d.users));
                  } else {
                      toast.error('Failed to update limits');
                  }
              } catch (err) {
                  toast.error('Failed to update limits');
              }
            }} className="space-y-4">
               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Max Per Transfer (XAF)</label>
                  <input name="maxPerTransfer" type="number" defaultValue={limitsModalUser.limits?.maxPerTransfer} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="Default" />
               </div>
               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Max Daily Limit (XAF)</label>
                  <input name="maxDaily" type="number" defaultValue={limitsModalUser.limits?.maxDaily} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="Default" />
               </div>
               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Max Monthly Limit (XAF)</label>
                  <input name="maxMonthly" type="number" defaultValue={limitsModalUser.limits?.maxMonthly} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="Default" />
               </div>
               <div className="flex gap-3 pt-6 border-t border-gray-100 mt-6">
                  <button type="button" onClick={() => setLimitsModalUser(null)} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition">Cancel</button>
                  <button type="submit" className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md shadow-blue-500/20 transition">Apply Policy</button>
               </div>
            </form>
          </div>
        </div>
      )}

    </div>
        
        {/* Print Only View for PDF Generation */}
        <div className="hidden print:block absolute top-0 left-0 w-full bg-white z-[9999] p-10 font-sans text-black min-h-screen">
          <div className="border-b-2 border-black pb-4 mb-8 flex items-center justify-between">
            <div>
               <h1 className="text-3xl font-black uppercase tracking-widest">PayCam Platform</h1>
               <p className="text-sm font-bold text-gray-500 mt-1">Official Transaction & Profit Audit Log</p>
               <p className="text-xs font-mono text-gray-400 mt-1">Generated: {new Date().toLocaleString()}</p>
            </div>
            {systemSettings?.appLogoUrl && (
               <img src={systemSettings.appLogoUrl} alt="Logo" className="h-16 object-contain" />
            )}
          </div>
          
          <table className="w-full text-left border-collapse mb-12">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="py-2 text-xs uppercase tracking-wider font-bold text-gray-600">ID</th>
                <th className="py-2 text-xs uppercase tracking-wider font-bold text-gray-600">Date</th>
                <th className="py-2 text-xs uppercase tracking-wider font-bold text-gray-600">Type</th>
                <th className="py-2 text-xs uppercase tracking-wider font-bold text-gray-600">Amount</th>
              </tr>
            </thead>
            <tbody>
              {txLogs.map((log: any) => (
                <tr key={log.id} className="border-b border-gray-100">
                  <td className="py-3 font-mono text-xs">{log.id}</td>
                  <td className="py-3 text-xs">{new Date(log.date).toLocaleString()}</td>
                  <td className="py-3 text-xs font-bold">{log.type}</td>
                  <td className="py-3 font-mono text-sm font-bold">{log.amount.toLocaleString()} XAF</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-20 pt-10 border-t border-gray-300 grid grid-cols-2 gap-10">
            <div>
              <p className="text-xs uppercase font-bold text-gray-500 mb-8">Prepared By (System Administrator)</p>
              <div className="border-b border-black w-64 mb-2"></div>
              <p className="text-xs font-mono">Sign Date: ________________</p>
            </div>
            <div>
              <p className="text-xs uppercase font-bold text-gray-500 mb-8">Approved By (Executive/Finance)</p>
              <div className="border-b border-black w-64 mb-2"></div>
              <p className="text-xs font-mono">Sign Date: ________________</p>
            </div>
          </div>
        </div>

    </div>
  );
}
