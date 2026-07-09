import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft01Icon as ArrowLeft, CheckmarkCircle02Icon as CheckCircle2, Message01Icon as MessageSquare, Alert01Icon as AlertCircle, Logout01Icon as LogOut, Search01Icon as Search, UserIcon as User, CreditCardAcceptIcon as CreditCard } from 'hugeicons-react';

export default function SupportDashboard() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(false);
  
  // User Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedUser, setSearchedUser] = useState<any>(null);
  const [userTransactions, setUserTransactions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Custom modals block/unblock to avoid iframe restrictions
  const [blockModal, setBlockModal] = useState<{ isOpen: boolean; type: 'temporal' | 'permanent' | null }>({ isOpen: false, type: null });
  const [blockReason, setBlockReason] = useState('');
  const [unblockModalOpen, setUnblockModalOpen] = useState(false);
  const [resetPinModal, setResetPinModal] = useState({ isOpen: false, newPin: '' });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const user = (() => { try { const u = localStorage.getItem('user'); return u && u !== 'undefined' ? JSON.parse(u) : {}; } catch(e) { return {}; } })();
    if (user.role !== 'support') {
      navigate('/login');
      return;
    }
    fetchTickets();
    const interval = setInterval(fetchTickets, 5000);
    return () => clearInterval(interval);
  }, [navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedTicket?.messages]);

  const fetchTickets = async () => {
    try {
      const user = (() => { try { const u = localStorage.getItem('user'); return u && u !== 'undefined' ? JSON.parse(u) : {}; } catch(e) { return {}; } })();
      const res = await fetch(`/api/support/tickets?userLevel=${user.level || 1}`);
      const data = await res.json();
      if (res.ok) {
        setTickets(data.tickets);
        if (selectedTicket) {
          const updated = data.tickets.find((t: any) => t._id === selectedTicket._id);
          if (updated) setSelectedTicket(updated);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearchUser = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const res = await fetch(`/api/support/search-user?query=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.result) {
        setSearchedUser(data.result.user);
        setUserTransactions(data.result.transactions);
      } else {
        setSearchedUser(null);
        setUserTransactions([]);
        alert("User not found");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleBlockUser = (type: 'temporal' | 'permanent') => {
    if (!searchedUser) return;
    setBlockReason('');
    setBlockModal({ isOpen: true, type });
  };

  const confirmBlockUser = async () => {
    if (!searchedUser || !blockModal.type) return;
    if (!blockReason.trim()) {
      alert("A reason is required.");
      return;
    }

    try {
      const res = await fetch(`/api/support/block-user/${searchedUser._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: blockModal.type, reason: blockReason })
      });
      const data = await res.json();
      if (res.ok) {
        setSearchedUser({ ...searchedUser, status: blockModal.type === 'permanent' ? 'blocked_permanent' : 'blocked_temporal' });
        setBlockModal({ isOpen: false, type: null });
        // Optional alert
        // alert(`User successfully blocked.`);
      } else {
        alert(data.error || 'Failed to block user');
      }
    } catch (e) {
      console.error(e);
      alert('Network error');
    }
  };

  
  const handleResetPin = async () => {
    if (!searchedUser) return;
    if (!/^\d{5}$/.test(resetPinModal.newPin)) {
      alert("PIN must be exactly 5 digits.");
      return;
    }
    
    try {
      const res = await fetch(`/api/support/users/${searchedUser._id}/pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: resetPinModal.newPin })
      });
      if (res.ok) {
        alert("PIN successfully reset.");
        setResetPinModal({ isOpen: false, newPin: '' });
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to reset PIN');
      }
    } catch (e) {
      alert('Network error');
    }
  };


  const handleUnblockUser = () => {
    if (!searchedUser) return;
    setUnblockModalOpen(true);
  };

  const confirmUnblockUser = async () => {
    if (!searchedUser) return;
    try {
      const res = await fetch(`/api/support/unblock-user/${searchedUser._id}`, {
        method: 'PUT',
      });
      const data = await res.json();
      if (res.ok) {
        setSearchedUser({ ...searchedUser, status: 'active' });
        setUnblockModalOpen(false);
      } else {
        alert(data.error || 'Failed to unblock user');
      }
    } catch (e) {
      console.error(e);
      alert('Network error');
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim() || !selectedTicket) return;
    
    setLoading(true);
    const user = (() => { try { const u = localStorage.getItem('user'); return u && u !== 'undefined' ? JSON.parse(u) : {}; } catch(e) { return {}; } })();
    try {
      const res = await fetch(`/api/support/tickets/${selectedTicket._id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId: user._id, text: reply })
      });
      if (res.ok) {
        setReply('');
        fetchTickets();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (status: string) => {
    if (!selectedTicket) return;
    try {
      const res = await fetch(`/api/support/tickets/${selectedTicket._id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) fetchTickets();
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getSuggestedReplies = (flag: string) => {
    switch(flag) {
      case 'Transfer Failed': return ["Could you provide the transaction ID or the date?", "We are checking our systems right now."];
      case 'Transfer to wrong account': return ["Please provide the ID of the wrong account you sent it to.", "We are looking into reversing this."];
      case 'Scam': return ["Please provide the scammer's ID or phone number.", "We are immediately investigating this. Please share details."];
      case 'Deposit Issue': return ["Could you provide the phone number or PayCam ID used?", "We apologize for the delay. Elevating this to our partner."];
      case 'Withdrawal Delayed': return ["Please wait up to 24 hours for bank withdrawals.", "Could you provide your PayCam ID so I can check?"];
      case 'Store/ESIM Purchase': return ["Could you confirm the phone number you used?", "I'm looking into this right now."];
      case 'Account Locked / KYC': return ["Please upload your ID document in the settings.", "Your account is restricted until KYC is verified."];
      default: return ["Hello! How can I help you today?", "Could you provide your PayCam ID so I can look up your account?"];
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-6 flex flex-col">
      <div className="bg-primary px-6 pt-6 pb-6 flex items-center justify-between shadow-md sticky top-0 z-10 text-white">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-xl">
            <MessageSquare size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-tight">Support Dashboard</h1>
            <p className="text-xs text-white/80">Level {(() => { try { const u = localStorage.getItem('user'); return u && u !== 'undefined' ? JSON.parse(u) : {}; } catch(e) { return {}; } })().level || 1} Agent • {(() => { try { const u = localStorage.getItem('user'); return u && u !== 'undefined' ? JSON.parse(u) : {}; } catch(e) { return {}; } })().name}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="p-2 bg-white/10 rounded-full hover:bg-red-500 transition-colors">
          <LogOut size={20} />
        </button>
      </div>

      <div className="p-4 flex-1 flex flex-col xl:flex-row gap-4 max-w-[1600px] mx-auto w-full">
        {/* Tickets List */}
        <div className="w-full xl:w-1/4 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[400px] xl:h-[calc(100vh-120px)]">
          <div className="bg-gray-50 p-4 border-b border-gray-100 font-bold text-gray-700 flex justify-between items-center">
            Active Tickets
            <span className="bg-primary text-white text-xs px-2 py-1 rounded-full">{tickets.filter(t => t.status === 'open').length} Open</span>
          </div>
          <div className="overflow-y-auto flex-1">
            {tickets.length === 0 ? (
              <p className="p-6 text-center text-gray-500">No tickets found.</p>
            ) : (
              tickets.map(ticket => (
                <button
                  key={ticket._id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={`w-full text-left p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${selectedTicket?._id === ticket._id ? 'bg-blue-50 border-l-4 border-l-primary' : ''}`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-dark text-sm">User {ticket.userId}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider ${ticket.status === 'open' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                      {ticket.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-gray-500 mb-2 font-bold uppercase tracking-wider">
                    <AlertCircle size={10} /> {ticket.flag}
                  </div>
                  <p className="text-sm text-gray-600 truncate">{ticket.messages[ticket.messages.length - 1]?.text}</p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Selected Ticket Chat View */}
        <div className="w-full xl:w-2/4 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden h-[500px] xl:h-[calc(100vh-120px)]">
          {selectedTicket ? (
            <>
              <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-dark">Ticket #{selectedTicket._id}</h3>
                  <p className="text-xs text-primary font-bold">{selectedTicket.flag}</p>
                </div>
                {selectedTicket.status === 'open' ? (
                  <button onClick={() => updateStatus('resolved')} className="flex items-center gap-1 text-sm bg-green-50 text-green-600 px-3 py-1.5 rounded-xl font-bold hover:bg-green-100 transition-colors">
                    <CheckCircle2 size={16} /> Mark Resolved
                  </button>
                ) : (
                  <button onClick={() => updateStatus('open')} className="flex items-center gap-1 text-sm bg-yellow-50 text-yellow-600 px-3 py-1.5 rounded-xl font-bold hover:bg-yellow-100 transition-colors">
                    Reopen Ticket
                  </button>
                )}
              </div>
              
              <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50/50">
                {selectedTicket.messages.map((msg: any, i: number) => {
                  const isSupport = msg.senderId === (() => { try { const u = localStorage.getItem('user'); return u && u !== 'undefined' ? JSON.parse(u) : {}; } catch(e) { return {}; } })()._id;
                  return (
                    <div key={i} className={`flex ${isSupport ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${
                        isSupport 
                          ? 'bg-primary text-white rounded-br-sm' 
                          : 'bg-white text-dark border border-gray-100 rounded-bl-sm'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                        <span className={`text-[10px] mt-1 block ${isSupport ? 'text-white/70' : 'text-gray-400'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 bg-white border-t border-gray-100">
                {selectedTicket.status === 'open' && (
                  <div className="flex gap-2 overflow-x-auto pb-2 mb-2 scrollbar-hide">
                    {getSuggestedReplies(selectedTicket.flag).map((suggestion, idx) => (
                       <button
                         key={idx}
                         onClick={() => setReply(suggestion)}
                         className="whitespace-nowrap bg-blue-50 text-blue-600 border border-blue-100 px-3 py-1.5 rounded-lg text-xs hover:bg-blue-100 transition-colors"
                       >
                         {suggestion}
                       </button>
                    ))}
                  </div>
                )}
                <form onSubmit={handleReply} className="flex gap-2">
                  <input
                    type="text"
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Type your response..."
                    disabled={selectedTicket.status !== 'open'}
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50"
                  />
                  <button 
                    type="submit"
                    disabled={selectedTicket.status !== 'open' || !reply.trim() || loading}
                    className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-opacity-90 transition-all shadow-md disabled:opacity-50"
                  >
                    Send
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col flex-center items-center justify-center text-gray-400 p-6 text-center">
               <MessageSquare size={48} className="mb-4 opacity-20" />
               <p className="font-bold text-gray-500">No ticket selected</p>
               <p className="text-sm">Select a ticket from the left panel to start chatting.</p>
            </div>
          )}
        </div>
        
        {/* User Lookup */}
        <div className="w-full xl:w-1/4 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[500px] xl:h-[calc(100vh-120px)]">
           <div className="bg-gray-50 p-4 border-b border-gray-100 font-bold text-gray-700">
             User Lookup
           </div>
           <div className="p-4 border-b border-gray-100">
             <form onSubmit={handleSearchUser} className="relative">
               <input
                 type="text"
                 value={searchQuery}
                 onChange={e => setSearchQuery(e.target.value)}
                 placeholder="Name, Phone, or PayCam ID"
                 className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
               />
               <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
               <button type="submit" disabled={isSearching} className="hidden">Search</button>
             </form>
           </div>
           
           <div className="flex-1 overflow-y-auto p-4 bg-gray-50/30">
              {searchedUser ? (
                 <div className="space-y-4">
                    <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
                       <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                          <User size={20} />
                       </div>
                       <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                               <p className="font-bold text-dark text-sm">{searchedUser.name}</p>
                               <p className="text-xs text-gray-500">{searchedUser.paycamId}</p>
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider ${searchedUser.status?.startsWith('blocked') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                               {searchedUser.status?.startsWith('blocked') ? searchedUser.status.replace('_', ' ') : (searchedUser.status || 'active')}
                            </span>
                          </div>
                          
                          {!searchedUser.status?.startsWith('blocked') ? (
                             <div className="flex gap-2 mt-2">
                               {(() => { try { const u = localStorage.getItem('user'); return u && u !== 'undefined' ? JSON.parse(u) : {}; } catch(e) { return {}; } })().level >= 2 && (
                                   <button onClick={() => handleBlockUser('temporal')} className="text-[10px] flex-1 py-1.5 bg-orange-50 text-orange-600 font-bold uppercase rounded hover:bg-orange-100 transition-colors">
                                     Temp Block
                                   </button>
                               )}
                               
                               {(() => { try { const u = localStorage.getItem('user'); return u && u !== 'undefined' ? JSON.parse(u) : {}; } catch(e) { return {}; } })().level >= 2 && (
                                   <button onClick={() => setResetPinModal({ isOpen: true, newPin: '' })} className="text-[10px] flex-1 py-1.5 bg-blue-50 text-blue-600 font-bold uppercase rounded hover:bg-blue-100 transition-colors">
                                     Reset PIN
                                   </button>
                               )}

                               {(() => { try { const u = localStorage.getItem('user'); return u && u !== 'undefined' ? JSON.parse(u) : {}; } catch(e) { return {}; } })().level >= 3 && (
                                   <button onClick={() => handleBlockUser('permanent')} className="text-[10px] flex-1 py-1.5 bg-red-50 text-red-600 font-bold uppercase rounded hover:bg-red-100 transition-colors">
                                     Perm Block
                                   </button>
                               )}
                             </div>
                          ) : (
                             <div className="mt-2">
                               {(() => { try { const u = localStorage.getItem('user'); return u && u !== 'undefined' ? JSON.parse(u) : {}; } catch(e) { return {}; } })().level >= 3 && (
                                   <button onClick={handleUnblockUser} className="text-[10px] w-full py-1.5 bg-green-50 text-green-600 font-bold uppercase rounded hover:bg-green-100 transition-colors">
                                     Unblock Account
                                   </button>
                               )}
                             </div>
                          )}
                       </div>
                    </div>
                    
                    <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                       <p className="text-xs text-gray-500 mb-1">Available Balance</p>
                       <p className="font-bold text-xl text-dark">{searchedUser.balance?.toLocaleString()} XAF</p>
                    </div>
                    
                    <div>
                       <h4 className="font-bold text-sm text-gray-700 mb-2">Recent Transactions</h4>
                       {userTransactions.length === 0 ? (
                          <p className="text-xs text-gray-500">No recent transactions.</p>
                       ) : (
                          <div className="space-y-2">
                             {userTransactions.map(t => (
                                <div key={t._id} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm text-sm">
                                   <div className="flex justify-between items-center mb-1">
                                      <span className="font-bold capitalize">{t.type.replace('_', ' ')}</span>
                                      <span className={`font-bold ${t.type.includes('deposit') ? 'text-green-600' : 'text-dark'}`}>
                                         {t.type.includes('deposit') ? '+' : '-'}{t.amount}
                                      </span>
                                   </div>
                                   <div className="flex justify-between text-xs text-gray-500">
                                      <span>to/from: {t.recipient}</span>
                                      <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                                   </div>
                                </div>
                             ))}
                          </div>
                       )}
                    </div>
                 </div>
              ) : (
                 <div className="text-center text-gray-400 mt-10">
                    <Search size={32} className="mx-auto mb-2 opacity-20" />
                    <p className="text-sm">Search for a user to see their balance and recent transactions.</p>
                 </div>
              )}
           </div>
        </div>
      </div>

      {blockModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-2">Block Account ({blockModal.type})</h3>
            <p className="text-sm text-gray-500 mb-4">Please provide a reason for this block.</p>
            <textarea
              className="w-full border border-gray-200 rounded-xl p-3 mb-4 focus:ring-1 focus:ring-primary"
              rows={3}
              placeholder="e.g. Suspicious activity..."
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
            ></textarea>
            <div className="flex gap-2">
              <button onClick={() => setBlockModal({ isOpen: false, type: null })} className="flex-1 py-2 bg-gray-100 rounded-xl font-bold">Cancel</button>
              <button onClick={confirmBlockUser} className="flex-1 py-2 bg-red-600 text-white rounded-xl font-bold">Block</button>
            </div>
          </div>
        </div>
      )}

      
      {resetPinModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-2">Reset PIN</h3>
            <p className="text-sm text-gray-500 mb-4">Enter a new 5-digit PIN for {searchedUser?.name}</p>
            <input
               type="text"
               maxLength={5}
               value={resetPinModal.newPin}
               onChange={(e) => setResetPinModal({...resetPinModal, newPin: e.target.value})}
               placeholder="12345"
               className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 mb-4 focus:ring-2 focus:ring-primary"
            />
            <div className="flex gap-2">
              <button onClick={() => setResetPinModal({ isOpen: false, newPin: '' })} className="flex-1 py-2 bg-gray-100 rounded-xl font-bold">Cancel</button>
              <button onClick={handleResetPin} className="flex-1 py-2 bg-blue-600 text-white rounded-xl font-bold">Reset</button>
            </div>
          </div>
        </div>
      )}


      {unblockModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-2">Unblock Account</h3>
            <p className="text-sm text-gray-500 mb-4">Are you sure you want to unblock {searchedUser?.name}?</p>
            <div className="flex gap-2">
              <button onClick={() => setUnblockModalOpen(false)} className="flex-1 py-2 bg-gray-100 rounded-xl font-bold">Cancel</button>
              <button onClick={confirmUnblockUser} className="flex-1 py-2 bg-green-600 text-white rounded-xl font-bold">Unblock</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

