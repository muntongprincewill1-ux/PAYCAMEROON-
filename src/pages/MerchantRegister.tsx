import { isValidCameroonNumber } from '../utils/phoneValidation';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building02Icon as Building2, Store01Icon as Store, CallIcon as Phone, LockIcon as Lock, ArrowLeft01Icon as ArrowLeft, Shield01Icon as ShieldCheck } from 'hugeicons-react';

export default function MerchantRegister() {
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [documentType, setDocumentType] = useState('National ID');
  const [documentNumber, setDocumentNumber] = useState('');
  const [pending, setPending] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (pin.length !== 5 || !/^\d{5}$/.test(pin)) {
      setError('PIN must be exactly 5 digits');
      setLoading(false);
      return;
    }
    if (!isValidCameroonNumber(phone)) {
      setError('Please enter a valid Cameroon phone number');
      setLoading(false);
      return;
    }
    setLoading(true);

    try {
      const res = await fetch('/api/auth/merchant-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, pin, name, businessName, documentType, documentNumber })
      });
      const data = await res.json();
      
      if (res.ok) {
        if (data.pending) {
            setPending(true);
        } else if (data.user) {
            localStorage.setItem('user', JSON.stringify(data.user));
            navigate('/merchant/dashboard');
        }
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  if (pending) {
      return (
          <div className="bg-gray-50 min-h-screen flex flex-col items-center justify-center p-6 text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6 text-blue-600">
                  <ShieldCheck size={40} />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Request Under Review</h1>
              <p className="text-gray-600 max-w-md mx-auto mb-8">
                  Your merchant registration request and KYC documents have been submitted successfully. Our admin team will review your application shortly. You will be notified once approved.
              </p>
              <button 
                onClick={() => navigate('/login')} 
                className="bg-primary text-white font-bold py-3 px-8 rounded-2xl shadow-lg hover:bg-primary/90 transition"
              >
                Return to Login
              </button>
          </div>
      );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-primary px-6 pt-12 pb-24 rounded-b-[40px] text-white shadow-lg relative">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-white/20 transition-colors absolute top-12 left-6">
          <ArrowLeft size={24} />
        </button>
        <div className="text-center mt-8">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm shadow-inner">
            <Store size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Become a Merchant</h1>
          <p className="text-white/80 mt-2 text-sm">Create an agent account to serve PayCam users and earn commissions.</p>
        </div>
      </div>

      <div className="px-6 -mt-16 pb-12">
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
          <form onSubmit={handleRegister} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100 flex items-center gap-2">
                <ShieldCheck size={18} className="shrink-0" /> {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Agent Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-gray-400">@</span>
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Building2 size={20} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. John's Telecom"
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Upload Business/ID Document</label>
              <div className="flex gap-2">
                <select 
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="w-1/3 px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                >
                  <option value="National ID">National ID</option>
                  <option value="Business License">Business License</option>
                  <option value="Passport">Passport</option>
                </select>
                <input
                  type="text"
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  placeholder="Document Number"
                  className="w-2/3 px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Phone size={20} className="text-gray-400" />
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="6XXXXXXXX"
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">6-Digit PIN</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock size={20} className="text-gray-400" />
                </div>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="•••••"
                  maxLength={5} pattern="\d{5}" title="PIN must be exactly 5 digits"
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all active:scale-[0.98] mt-4"
            >
              {loading ? 'Creating Account...' : 'Register as Merchant'}
            </button>
            <p className="text-center text-sm text-gray-500 mt-4">
              Already have an account? <button type="button" onClick={() => navigate('/login')} className="text-primary font-bold">Login</button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
