import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FingerPrintAddIcon as Fingerprint, LockIcon as Lock, UserIcon as User, ArrowLeft02Icon } from 'hugeicons-react';
import { useSettings } from '../hooks/useSettings';
import { isValidCameroonNumber } from '../utils/phoneValidation';

export default function Signup() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { appLogoUrl } = useSettings();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
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
    
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, pin })
      });
      
      const data = await response.json();
      
      if (response.ok && data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/kyc');
      } else {
        setError(data.error || 'Signup failed');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-primary px-6 text-white relative">
      <button 
        onClick={() => navigate('/')} 
        className="absolute top-8 left-6 flex items-center text-white/80 hover:text-white transition-colors"
      >
        <ArrowLeft02Icon className="w-6 h-6 mr-1" />
        <span className="font-medium">Back</span>
      </button>

      <div className="mb-8 text-center mt-12">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg overflow-hidden p-2">
          {appLogoUrl ? (
             <img src={appLogoUrl} alt="Logo" className="w-full h-full object-contain" />
          ) : (
             <span className="text-primary text-3xl font-bold tracking-tighter">PC</span>
          )}
        </div>
        <h1 className="text-3xl font-bold mb-2">Join PayCam</h1>
        <p className="text-secondary opacity-90">Create your secure account</p>
      </div>

      <form onSubmit={handleSignup} className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-2xl text-dark">
        <h2 className="text-2xl font-semibold mb-6 text-center">Sign Up</h2>
        
        {error && <div className="bg-red-100 text-red-600 p-3 rounded-xl mb-4 text-sm text-center">{error}</div>}
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600 mb-1">Full Name</label>
          <div className="relative">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              placeholder="e.g. John Doe"
              required
            />
            <User className="absolute right-3 top-3.5 text-gray-400" size={20} />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600 mb-1">Phone Number</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            placeholder="e.g. 670000000"
            required
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-600 mb-1">Secure PIN</label>
          <div className="relative">
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              placeholder="•••••"
              maxLength={5} pattern="\d{5}" title="PIN must be exactly 5 digits"
              required
            />
            <Lock className="absolute right-3 top-3.5 text-gray-400" size={20} />
          </div>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white py-3.5 rounded-xl font-semibold text-lg hover:bg-opacity-90 transition-all shadow-md flex justify-center items-center"
        >
          {loading ? 'Creating Account...' : 'Sign Up securely'}
        </button>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Login here
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
