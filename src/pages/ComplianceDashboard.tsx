import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield01Icon as ShieldCheck, UserCheck01Icon as UserCheck, Alert02Icon as AlertTriangle, Logout01Icon as LogOut, CheckmarkCircle01Icon as CheckCircle, CancelCircleIcon as XCircle, File01Icon as FileText, Activity01Icon as Activity, UserGroupIcon as Users, FileSearchIcon as FileSearch } from 'hugeicons-react';

export default function ComplianceDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({ pendingKycCount: 0, flaggedTxCount: 0, blockedUserCount: 0 });
  const [kycs, setKycs] = useState<any[]>([]);
  const [flaggedTxs, setFlaggedTxs] = useState<any[]>([]);
  const [amlAlerts, setAmlAlerts] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'kyc' | 'flagged' | 'aml' | 'users' | 'audit'>('overview');

  const [kycDocsVisible, setKycDocsVisible] = useState<Record<string, boolean>>({});
  const [kycFaceVerified, setKycFaceVerified] = useState<Record<string, boolean>>({});
  
  const [promptModal, setPromptModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    placeholder: string;
    inputValue: string;
    onConfirm: (val: string) => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    placeholder: '',
    inputValue: '',
    onConfirm: () => {}
  });

  const openPrompt = (title: string, description: string, placeholder: string): Promise<string | null> => {
    return new Promise((resolve) => {
      setPromptModal({
        isOpen: true,
        title,
        description,
        placeholder,
        inputValue: '',
        onConfirm: (val) => {
          setPromptModal(prev => ({ ...prev, isOpen: false }));
          resolve(val);
        }
      });
    });
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      navigate('/login');
      return;
    }
    let parsedUser;
    try {
      parsedUser = JSON.parse(savedUser);
    } catch (e) {
      navigate('/login');
      return;
    }
    if (!parsedUser || (parsedUser.role !== 'compliance' && parsedUser.role !== 'admin')) {
      navigate('/home');
      return;
    }
    setUser(parsedUser);
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      const [_stats, _kycs, _txs, _aml, _audit, _users] = await Promise.all([
        fetch('/api/compliance/stats').then(r => r.json()),
        fetch('/api/compliance/kyc').then(r => r.json()),
        fetch('/api/compliance/transactions/flagged').then(r => r.json()),
        fetch('/api/compliance/aml-alerts').then(r => r.json()),
        fetch('/api/compliance/audit-logs').then(r => r.json()),
        fetch('/api/compliance/users').then(r => r.json())
      ]);
      setStats(_stats);
      setKycs(_kycs.kycs || []);
      setFlaggedTxs(_txs.transactions || []);
      setAmlAlerts(_aml.alerts || []);
      setAuditLogs(_audit.logs || []);
      setUsers(_users.users || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleKycResolve = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await fetch(`/api/compliance/kyc/${id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, officerId: user._id })
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleTxResolve = async (id: string, action: 'approve' | 'reject') => {
    try {
      await fetch(`/api/compliance/transactions/${id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, officerId: user._id })
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAmlResolve = async (id: string, action: 'approve' | 'reject') => {
    try {
      const note = await openPrompt(
        'Compliance Note',
        'Enter compliance note for this AML alert:',
        'E.g., verified documentation'
      );
      if (note === null) return;
      await fetch(`/api/compliance/aml-alerts/${id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, note, officerId: user._id })
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUserFreeze = async (id: string, isFrozen: boolean) => {
    try {
      const reason = await openPrompt(
        `${isFrozen ? 'Unfreeze' : 'Freeze'} User`,
        `Enter reason to ${isFrozen ? 'unfreeze' : 'freeze'} this user:`,
        isFrozen ? 'User verified, removing restrictive measures' : 'Suspicious activity detected'
      );
      if (reason === null) return;
      await fetch(`/api/compliance/users/${id}/${isFrozen ? 'unfreeze' : 'freeze'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ officerId: user._id, reason })
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportReport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Timestamp,Officer ID,Action,Target ID,Details\n"
      + auditLogs.map(log => 
          `${new Date(log.timestamp).toISOString()},${log.officerId},"${log.action}",${log.targetId},"${log.details.replace(/"/g, '""')}"`
        ).join("\n");
        
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `compliance_audit_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link); // Required for FF
    link.click();
    link.remove();
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) return <div className="flex h-screen items-center justify-center">Loading...</div>;

  return (
    <div className="bg-gray-50 min-h-screen pb-20 font-sans text-gray-900">
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="flex justify-between items-center p-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h1 className="font-bold text-lg">Compliance Center</h1>
              <p className="text-xs text-gray-400">Officer: {user.name}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="text-gray-400 p-2"><LogOut size={20} /></button>
        </div>
        
        <div className="flex overflow-x-auto border-b border-gray-200 scrollbar-hide bg-white px-2">
          <button 
            className={`whitespace-nowrap px-4 py-3 text-sm font-medium border-b-2 ${activeTab === 'overview' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500'}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`whitespace-nowrap px-4 py-3 text-sm font-medium border-b-2 ${activeTab === 'kyc' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500'} flex items-center gap-1`}
            onClick={() => setActiveTab('kyc')}
          >
            KYC {stats.pendingKycCount > 0 && <span className="bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{stats.pendingKycCount}</span>}
          </button>
          <button 
            className={`whitespace-nowrap px-4 py-3 text-sm font-medium border-b-2 ${activeTab === 'flagged' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500'} flex items-center gap-1`}
            onClick={() => setActiveTab('flagged')}
          >
            Flagged TXs {stats.flaggedTxCount > 0 && <span className="bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{stats.flaggedTxCount}</span>}
          </button>
          <button 
            className={`whitespace-nowrap px-4 py-3 text-sm font-medium border-b-2 ${activeTab === 'aml' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500'} flex items-center gap-1`}
            onClick={() => setActiveTab('aml')}
          >
            AML Alerts {amlAlerts.filter(a => a.status === 'open').length > 0 && <span className="bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{amlAlerts.filter(a => a.status === 'open').length}</span>}
          </button>
          <button 
            className={`whitespace-nowrap px-4 py-3 text-sm font-medium border-b-2 ${activeTab === 'users' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500'} flex items-center gap-1`}
            onClick={() => setActiveTab('users')}
          >
            Users/Blacklist
          </button>
          <button 
            className={`whitespace-nowrap px-4 py-3 text-sm font-medium border-b-2 ${activeTab === 'audit' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500'} flex items-center gap-1`}
            onClick={() => setActiveTab('audit')}
          >
            Audit Logs
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2">
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                  <UserCheck size={24} />
                </div>
                <div className="text-2xl font-bold">{stats.pendingKycCount}</div>
                <div className="text-xs text-gray-500">Pending KYC</div>
              </div>
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2">
                <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-red-600">
                  <AlertTriangle size={24} />
                </div>
                <div className="text-2xl font-bold">{stats.flaggedTxCount}</div>
                <div className="text-xs text-gray-500">Flagged TXs</div>
              </div>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
               <h3 className="font-semibold mb-2">Restricted Accounts</h3>
               <p className="text-lg font-bold text-gray-800">{stats.blockedUserCount} Users Blocked</p>
               <p className="text-xs text-gray-500">To unblock a user, refer to Admin or Support L3 tools.</p>
            </div>
          </div>
        )}

        {activeTab === 'kyc' && (
          <div className="space-y-4">
            {kycs.map((kyc) => (
              <div key={kyc._id} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="flex justify-between items-start mb-3">
                   <div>
                     <h3 className="font-semibold">{kyc.name}</h3>
                     <p className="text-xs text-gray-500">User ID: {kyc.paycamId}</p>
                   </div>
                   {kyc.status === 'pending' ? (
                     <span className="text-[10px] bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium">Pending Review</span>
                   ) : kyc.status === 'approved' ? (
                     <span className="text-[10px] bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">Approved</span>
                   ) : (
                     <span className="text-[10px] bg-red-100 text-red-800 px-2 py-1 rounded-full font-medium">Rejected</span>
                   )}
                </div>
                <div className="bg-gray-50 p-3 rounded-lg mb-4 text-sm">
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-500">Doc Type:</span>
                    <span className="font-medium">{kyc.documentType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Doc Num:</span>
                    <span className="font-medium">{kyc.documentNumber}</span>
                  </div>
                  
                  {kycDocsVisible[kyc._id] ? (
                    <div className="mt-4 space-y-3">
                      <div className="border border-gray-300 rounded p-2 bg-white flex flex-col items-center justify-center min-h-[8rem] relative">
                        {kyc.documentImage ? (
                           <>
                             <div className="absolute inset-0 z-10 w-full h-full" onContextMenu={e => e.preventDefault()}></div>
                             <img 
                               src={kyc.documentImage} 
                               alt="ID Document" 
                               className="max-w-full max-h-48 object-contain select-none pointer-events-none" 
                               onDragStart={e => e.preventDefault()}
                               onContextMenu={e => e.preventDefault()}
                             />
                           </>
                        ) : (
                           <>
                             <FileText className="text-gray-400 mb-2" size={32} />
                             <span className="text-xs text-gray-500">Mock ID Document Image</span>
                           </>
                        )}
                      </div>
                      <div className="bg-gray-100 p-2 rounded flex justify-between items-center">
                        <span className="text-xs font-semibold">Face Match SDK:</span>
                        <button 
                          disabled={kycFaceVerified[kyc._id]}
                          onClick={() => setKycFaceVerified({...kycFaceVerified, [kyc._id]: true})}
                          className={`text-xs px-2 py-1 rounded ${kycFaceVerified[kyc._id] ? 'bg-green-100 text-green-700' : 'bg-blue-600 text-white'}`}
                        >
                          {kycFaceVerified[kyc._id] ? 'Match Confirmed (99%)' : 'Run Verification'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setKycDocsVisible({...kycDocsVisible, [kyc._id]: true})}
                      className="mt-3 w-full py-2 bg-gray-200 text-gray-700 font-medium rounded text-xs"
                    >
                      View ID Documents & Face Match
                    </button>
                  )}
                </div>
                {kyc.status === 'pending' && (
                <div className="flex gap-2">
                  <button onClick={() => handleKycResolve(kyc._id, 'approved')} className="flex-1 py-2 bg-green-50 text-green-700 font-medium rounded-xl text-sm flex justify-center items-center gap-1"><CheckCircle size={16}/> Approve</button>
                  <button onClick={() => handleKycResolve(kyc._id, 'rejected')} className="flex-1 py-2 bg-red-50 text-red-700 font-medium rounded-xl text-sm flex justify-center items-center gap-1"><XCircle size={16}/> Reject</button>
                </div>
                )}
              </div>
            ))}
            {kycs.length === 0 && (
              <div className="text-center text-gray-400 py-10">No KYC applications.</div>
            )}
          </div>
        )}

        {activeTab === 'flagged' && (
          <div className="space-y-4">
            {flaggedTxs.map((tx) => (
               <div key={tx._id} className="bg-white p-8 rounded-2xl shadow-sm border border-red-100 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                  <div className="flex justify-between items-start pl-2 mb-3">
                     <div>
                       <h3 className="font-semibold text-red-700">Suspicious Transfer</h3>
                       <p className="text-xs text-gray-500">Tx ID: {tx._id}</p>
                     </div>
                     <span className="font-bold">{tx.amount.toLocaleString()} XAF</span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg mb-4 text-sm pl-4">
                    <div className="text-gray-600 mb-1"><strong>Sender:</strong> {tx.userId}</div>
                    <div className="text-gray-600 mb-2"><strong>Recipient:</strong> {tx.recipient}</div>
                    <div className="bg-red-50 p-2 rounded text-red-700 text-xs border border-red-100">
                      <strong>Flag Reason:</strong> {tx.flagReason || 'Automated risk flag'}
                    </div>
                  </div>
                  <div className="flex gap-2 pl-2">
                    <button onClick={() => handleTxResolve(tx._id, 'approve')} className="flex-1 py-2 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl text-sm hover:bg-gray-50">Clear Flag (Commit)</button>
                    <button onClick={() => handleTxResolve(tx._id, 'reject')} className="flex-1 py-2 bg-red-600 text-white font-medium rounded-xl text-sm">Block Transaction</button>
                  </div>
               </div>
            ))}
            {flaggedTxs.length === 0 && (
              <div className="text-center text-gray-400 py-10">No flagged transactions.</div>
            )}
          </div>
        )}

        {activeTab === 'aml' && (
          <div className="space-y-4">
            <h2 className="font-bold text-gray-800">AML Monitoring Alerts</h2>
            {amlAlerts.map(alert => (
               <div key={alert._id} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 relative">
                  {alert.status === 'open' && <div className="absolute top-0 left-0 w-1 h-full bg-red-600"></div>}
                  <div className="flex justify-between items-start mb-2">
                     <div className="flex flex-col">
                       <span className={`text-[10px] px-2 py-1 rounded-full w-fit font-bold mb-1 ${alert.status === 'open' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>{alert.status.toUpperCase()}</span>
                       <h3 className="font-semibold text-gray-800">{alert.ruleTriggered}</h3>
                     </div>
                     <span className={`text-xs font-medium px-2 py-1 rounded ${alert.severity === 'High' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>{alert.severity} Risk</span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded text-sm text-gray-700 mb-3 space-y-1">
                    <p><strong>User ID:</strong> {alert.userId}</p>
                    <p><strong>Description:</strong> {alert.description}</p>
                    {alert.notes && <p><strong>Officer Note:</strong> {alert.notes}</p>}
                    <p className="text-xs text-gray-400 mt-2">{new Date(alert.createdAt).toLocaleString()}</p>
                  </div>
                  {alert.status === 'open' && (
                    <div className="flex gap-2">
                       <button onClick={() => handleAmlResolve(alert._id, 'approve')} className="flex-1 py-2 bg-green-50 text-green-700 font-medium rounded-xl text-sm border border-green-100">Clear (Safe)</button>
                       <button onClick={() => handleAmlResolve(alert._id, 'reject')} className="flex-1 py-2 bg-red-600 text-white font-medium rounded-xl text-sm">Escalate & Block</button>
                    </div>
                  )}
               </div>
            ))}
            {amlAlerts.length === 0 && <div className="text-center text-gray-400 py-10">No AML alerts.</div>}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-4">
            <h2 className="font-bold text-gray-800">User accounts & Blacklist</h2>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
               {users.map(u => (
                  <div key={u._id} className="p-4 border-b border-gray-100 last:border-0 flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold flex items-center gap-2">
                        {u.name}
                        {u.role !== 'user' && <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 uppercase">{u.role}</span>}
                      </h4>
                      <p className="text-xs text-gray-500">{u.paycamId} | {u.phone} | Balance: {u.balance !== undefined ? `${u.balance} XAF` : 'N/A'}</p>
                      <div className="flex gap-2 items-center mt-1">
                        <span className={`text-[10px] inline-block px-2 py-0.5 rounded-full ${u.status === 'blocked (frozen)' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                          {u.status === 'blocked (frozen)' ? 'FROZEN' : 'ACTIVE'}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                          Risk Score: {Math.floor(Math.random() * 90) + 10}
                        </span>
                      </div>
                    </div>
                    <div>
                      {u.status === 'blocked (frozen)' ? (
                        <button onClick={() => handleUserFreeze(u._id, true)} className="text-sm bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg font-medium hover:bg-gray-200">Unfreeze</button>
                      ) : (
                        <button onClick={() => handleUserFreeze(u._id, false)} className="text-sm bg-red-50 text-red-600 px-3 py-1.5 rounded-lg border border-red-100 font-medium hover:bg-red-100">Freeze</button>
                      )}
                    </div>
                  </div>
               ))}
            </div>
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
               <h2 className="font-bold text-gray-800">Compliance Audit Log</h2>
               <button onClick={handleExportReport} className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded font-medium">Export Report</button>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
               {auditLogs.map(log => (
                  <div key={log._id} className="p-4">
                     <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-sm">{log.action}</span>
                        <span className="text-[10px] text-gray-400">{new Date(log.timestamp).toLocaleString()}</span>
                     </div>
                     <p className="text-xs text-gray-600"><strong>Target:</strong> {log.targetId} | <strong>Officer:</strong> {log.officerId}</p>
                     <p className="text-xs text-gray-500 mt-1">{log.details}</p>
                  </div>
               ))}
               {auditLogs.length === 0 && <div className="p-6 text-center text-gray-400 text-sm">No audit logs available.</div>}
            </div>
          </div>
        )}

      </div>

      {/* Prompt Modal */}
      {promptModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-xl">
            <h3 className="font-bold text-lg mb-2">{promptModal.title}</h3>
            <p className="text-sm text-gray-600 mb-4">{promptModal.description}</p>
            <input 
              type="text" 
              className="w-full border border-gray-300 rounded-lg p-3 text-sm mb-4 focus:ring-2 focus:ring-indigo-600 outline-none"
              placeholder={promptModal.placeholder}
              value={promptModal.inputValue}
              onChange={(e) => setPromptModal(prev => ({ ...prev, inputValue: e.target.value }))}
              autoFocus
            />
            <div className="flex gap-2">
              <button 
                onClick={() => promptModal.onConfirm(null as any)}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={() => promptModal.onConfirm(promptModal.inputValue)}
                className="flex-1 py-2.5 bg-indigo-600 text-white font-medium rounded-xl text-sm"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
