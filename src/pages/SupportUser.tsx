import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft01Icon as ArrowLeft, Message01Icon as MessageSquare, SentIcon as Send, PlusSignCircleIcon as PlusCircle, Alert01Icon as AlertCircle, HeadsetConnectedIcon as Headset, CheckmarkCircle02Icon as CheckCircle2 } from 'hugeicons-react';

export default function SupportUser() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [activeTicket, setActiveTicket] = useState<any>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [supportCategories, setSupportCategories] = useState<any[]>([]);
  
  // creation states
  const [issueFlag, setIssueFlag] = useState('');
  const [initialMessage, setInitialMessage] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const user = (() => { try { const u = localStorage.getItem('user'); return u && u !== 'undefined' ? JSON.parse(u) : {}; } catch(e) { return {}; } })();

  useEffect(() => {
    if (!user._id) {
      navigate('/login');
      return;
    }
    fetchTickets();
    fetchCategories();
    const interval = setInterval(() => {
       fetchTickets(); 
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchCategories = async () => {
     try {
         const res = await fetch('/api/admin/support/categories');
         const data = await res.json();
         if (res.ok) setSupportCategories(data.categories);
     } catch (e) {
         console.error(e);
     }
  };

  const fetchTickets = async () => {
    try {
      const res = await fetch(`/api/support/tickets/user/${user._id}`);
      const data = await res.json();
      if (res.ok) {
        setTickets(data.tickets);
        setActiveTicket((prev: any) => {
          if (prev) {
            const updated = data.tickets.find((t: any) => t._id === prev._id);
            return updated || prev;
          }
          return null;
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeTicket) {
      scrollToBottom();
    }
  }, [activeTicket]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueFlag || !initialMessage.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user._id, flag: issueFlag, message: initialMessage })
      });
      const data = await res.json();
      if (res.ok) {
        setIsCreating(false);
        setActiveTicket(data.ticket);
        fetchTickets();
        setIssueFlag('');
        setInitialMessage('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeTicket) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/support/tickets/${activeTicket._id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId: user._id, text: input })
      });
      if (res.ok) {
        setInput('');
        fetchTickets();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (isCreating) {
    return (
      <div className="bg-gray-50 min-h-screen flex flex-col pb-24">
        <div className="bg-primary px-6 pt-12 pb-6 flex items-center gap-4 shadow-md sticky top-0 z-10 text-white">
          <button onClick={() => setIsCreating(false)} className="p-2 -ml-2 rounded-full hover:bg-white/20 transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
              <Headset size={24} className="text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">New PayChat</h1>
              <p className="text-xs text-white/80">Get help from our team</p>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <form onSubmit={handleCreateTicket} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">What is your issue about?</label>
              <select 
                value={issueFlag} 
                onChange={e => setIssueFlag(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                required
              >
                <option value="">Select an issue...</option>
                {supportCategories.map((cat, idx) => (
                    <option key={idx} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Describe your problem</label>
              <textarea
                value={initialMessage}
                onChange={e => setInitialMessage(e.target.value)}
                rows={5}
                placeholder="Please provide details about the issue..."
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                required
              ></textarea>
            </div>
            <button 
              type="submit" 
              disabled={loading || !issueFlag || !initialMessage}
              className="w-full bg-primary text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-opacity-90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Ticket'} <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (activeTicket) {
    return (
      <div className="bg-gray-50 min-h-screen flex flex-col">
        <div className="bg-primary px-6 pt-12 pb-6 flex items-center gap-4 shadow-md sticky top-0 z-10 text-white">
          <button onClick={() => setActiveTicket(null)} className="p-2 -ml-2 rounded-full hover:bg-white/20 transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
              <Headset size={24} className="text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">
                 {activeTicket.requiredLevel >= 3 ? "PayChat - Special Agent" : "AI Support Assistant"}
              </h1>
              <p className="text-xs text-white/80">Ref: #{activeTicket._id} • {activeTicket.flag}</p>
            </div>
          </div>
          {activeTicket.requiredLevel >= 3 && (
            <button onClick={() => alert("Calling Agent...")} className="p-2 bg-green-500 rounded-full hover:bg-green-400 transition-colors shadow-sm" aria-label="Call Agent">
              <Headset size={20} />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 pb-32">
          {activeTicket.messages.map((msg: any, i: number) => {
            const isUser = msg.senderId === user._id;
            const isAi = msg.senderId === 'ai-agent';
            return (
              <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${
                  isUser 
                    ? 'bg-primary text-white rounded-br-sm' 
                    : 'bg-white text-dark border border-gray-100 rounded-bl-sm'
                }`}>
                  {!isUser && <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">
                     {isAi ? "AI Support Agent" : "Support Agent"}
                  </p>}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  <span className={`text-[10px] mt-2 block ${isUser ? 'text-white/70 text-right' : 'text-gray-400'}`}>
                     {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {activeTicket.status === 'open' ? (
          <div className="fixed bottom-[72px] w-full max-w-[480px] bg-white p-4 border-t border-gray-100 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
            <div className="flex gap-2 overflow-x-auto pb-2 mb-2 scrollbar-hide">
              {(() => {
                switch(activeTicket.flag) {
                  case 'Transfer Failed': return ["I tried to send money but it failed.", "The recipient didn't receive the money."];
                  case 'Transfer to wrong account': return ["I sent money to the wrong user.", "Can you reverse my last transfer?"];
                  case 'Scam': return ["I believe I was scammed.", "Please block the account I just sent money to."];
                  case 'Deposit Issue': return ["My bank account was debited but money is missing.", "The deposit is showing as pending for hours."];
                  case 'Withdrawal Delayed': return ["I withdrew but haven't received it yet.", "The transaction is successful but no money."];
                  case 'Store/ESIM Purchase': return ["I bought an eSIM but didn't get the QR code.", "The bill payment failed but took my money."];
                  case 'Account Locked/KYC': return ["Why is my account locked?", "How do I complete my KYC?"];
                  default: return ["Can you help me with a transaction?", "I need more information about my account."];
                }
              })().map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => setInput(suggestion)}
                  className="whitespace-nowrap bg-blue-50 text-blue-600 border border-blue-100 px-3 py-1.5 rounded-lg text-xs hover:bg-blue-100 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
            <form onSubmit={handleSend} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your reply..."
                className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              <button 
                type="submit" 
                disabled={!input.trim() || loading}
                className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center hover:bg-opacity-90 transition-all shadow-md disabled:opacity-50"
              >
                <Send size={20} className="ml-1" />
              </button>
            </form>
          </div>
        ) : (
          <div className="fixed bottom-[72px] w-full max-w-[480px] bg-gray-100 p-4 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500 font-medium flex items-center justify-center gap-2">
              <CheckCircle2 size={16} className="text-green-500" />
              This ticket has been resolved.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-24">
      <div className="bg-primary px-6 pt-12 pb-8 rounded-b-[40px] shadow-sm text-white relative flex justify-between items-center">
         <div className="flex items-center gap-3">
            <button onClick={() => {
                if (window.history.state && window.history.state.idx > 0) {
                    navigate(-1);
                } else {
                    if (user.role === 'merchant') navigate('/merchant/dashboard');
                    else if (user.role === 'agent') navigate('/agent/dashboard');
                    else navigate('/home');
                }
            }} className="p-2 -ml-2 rounded-full hover:bg-white/20 transition-colors">
                <ArrowLeft size={24} />
            </button>
            <div>
               <h1 className="text-2xl font-bold mb-1">PayChat</h1>
               <p className="text-white/80 text-sm">We are here to help!</p>
            </div>
         </div>
         <Headset size={48} className="opacity-20 absolute right-6 -bottom-4" />
      </div>

      <div className="p-6">
        <button 
          onClick={() => setIsCreating(true)}
          className="w-full bg-white border border-gray-100 rounded-3xl p-4 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow group mb-8"
        >
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <PlusCircle size={24} />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-dark text-lg">Start PayChat</h3>
            <p className="text-sm text-gray-500">Report an issue or ask for help</p>
          </div>
        </button>

        <h2 className="text-lg font-bold text-dark mb-4">Your Recent PayChats</h2>
        <div className="space-y-4">
          {tickets.length === 0 ? (
            <div className="text-center bg-white rounded-3xl p-8 border border-gray-100 text-gray-500">
               <MessageSquare size={32} className="mx-auto mb-3 opacity-20" />
               <p>No PayChats yet.</p>
            </div>
          ) : (
            tickets.map(ticket => (
              <button 
                key={ticket._id}
                onClick={() => setActiveTicket(ticket)}
                className="w-full bg-white border border-gray-100 rounded-3xl p-4 shadow-sm text-left flex items-start gap-3 hover:bg-gray-50 transition-colors"
              >
                <div className={`p-2 rounded-xl mt-1 ${ticket.status === 'open' ? 'bg-yellow-50 text-yellow-600' : 'bg-green-50 text-green-600'}`}>
                  {ticket.status === 'open' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-dark text-sm">{ticket.flag}</h4>
                    <span className="text-[10px] text-gray-400">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-1">{ticket.messages[ticket.messages.length - 1]?.text}</p>
                  <div className="mt-2 text-[10px] font-bold">
                    {ticket.status === 'open' ? <span className="text-yellow-600 uppercase">Open</span> : <span className="text-green-600 uppercase">Resolved</span>}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
