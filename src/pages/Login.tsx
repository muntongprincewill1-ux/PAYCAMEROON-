import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FingerPrintAddIcon as Fingerprint, LockIcon as Lock } from 'hugeicons-react';
import { useSettings } from '../hooks/useSettings';
import { isValidCameroonNumber } from '../utils/phoneValidation';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isForgotPin, setIsForgotPin] = useState(false);
  const [resetName, setResetName] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const navigate = useNavigate();
  const { appLogoUrl } = useSettings();

  
  const handleResetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (pin.length !== 5 || !/^\d{5}$/.test(pin)) {
      setError('New PIN must be exactly 5 digits');
      setLoading(false);
      return;
    }
    
    try {
      const response = await fetch('/api/auth/forgot-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, name: resetName, newPin: pin })
      });
      
      const data = await response.json();
      if (response.ok) {
        setResetSuccess(true);
        setTimeout(() => {
          setIsForgotPin(false);
          setResetSuccess(false);
          setPin('');
        }, 3000);
      } else {
        setError(data.error || 'Failed to reset PIN');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    
    if (pin.length !== 5 || !/^\d{5}$/.test(pin)) {
      setError('PIN must be exactly 5 digits');
      setLoading(false);
      return;
    }
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, pin })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
          
          const role = data.user?.role || 'user';
          if (!data.user.kycVerified && ['user'].includes(role)) {
             navigate('/kyc');
          } else {
            if (role === 'admin') {
              navigate('/admin');
            } else if (role === 'finance') {
              navigate('/finance');
            } else if (role === 'merchant') {
              navigate('/merchant/dashboard');
            } else if (role === 'agent') {
              navigate('/agent/dashboard');
            } else if (role === 'support') {
              navigate('/support-dashboard');
            } else if (role === 'compliance') {
              navigate('/compliance');
            } else {
              navigate('/home');
            }
          }
        } else {
          setError('Login failed: user data missing');
        }
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-primary px-6 text-white">
      <div className="mb-12 text-center">
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg overflow-hidden p-2">
          {appLogoUrl ? (
             <img src={appLogoUrl} alt="Logo" className="w-full h-full object-contain" />
          ) : (
             <span className="text-primary text-4xl font-bold tracking-tighter">PC</span>
          )}
        </div>
        <h1 className="text-4xl font-bold mb-2">PayCam</h1>
        <p className="text-secondary opacity-90">Unified Mobile Payments</p>
      </div>

      <form onSubmit={isForgotPin ? handleResetPin : handleLogin} className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-2xl text-dark">
        <h2 className="text-2xl font-semibold mb-6 text-center">Welcome Back</h2>
        
        {error && <div className="bg-red-100 text-red-600 p-3 rounded-xl mb-4 text-sm text-center">{error}</div>}
        
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
        
        
        {isForgotPin && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-600 mb-1">Full Legal Name</label>
            <input
              type="text"
              value={resetName}
              onChange={(e) => setResetName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              placeholder="As on your ID card"
              required={isForgotPin}
            />
          </div>
        )}
        <div className="mb-6">

          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium text-gray-600">{!isForgotPin ? 'Secure PIN' : 'New Secure PIN'}</label>
            {!isForgotPin && (
              <button type="button" onClick={() => { setIsForgotPin(true); setError(''); setPin(''); }} className="text-xs text-primary font-semibold hover:underline">
                Forgot PIN?
              </button>
            )}
          </div>
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
          {loading ? (isForgotPin ? 'Resetting...' : 'Authenticating...') : (isForgotPin ? 'Reset PIN' : 'Login securely')}
        </button>
        
        <div className="mt-6 flex flex-col items-center">
          <p className="text-sm text-gray-500 mb-3">Or login with biometrics</p>
          <button type="button" className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center border border-gray-200 hover:bg-gray-100 transition-colors">
            <Fingerprint className="text-primary" size={28} />
          </button>
        </div>

        <div className="mt-6">
          <div className="bg-blue-50 p-3 rounded-xl mb-4 border border-blue-100 flex flex-col gap-2">
            <p className="text-xs text-blue-800 font-semibold mb-1">Quick Demo Logins:</p>
            <button type="button" onClick={() => { setPhone('123456789'); setPin('12345'); }} className="text-xs text-left bg-white text-blue-700 px-3 py-2 rounded-lg border border-blue-200">Standard User: 123456789 / 12345</button>
            <button type="button" onClick={() => { setPhone('111111111'); setPin('11111'); }} className="text-xs text-left bg-white text-blue-700 px-3 py-2 rounded-lg border border-blue-200">Merchant User: 111111111 / 11111</button>
            <button type="button" onClick={() => { setPhone('444444444'); setPin('44444'); }} className="text-xs text-left bg-white text-blue-700 px-3 py-2 rounded-lg border border-blue-200">Mobile Agent: 444444444 / 44444</button>
            <button type="button" onClick={() => { setPhone('000000000'); setPin('00000'); }} className="text-xs text-left bg-white text-blue-700 px-3 py-2 rounded-lg border border-blue-200">Admin User: 000000000 / 00000</button>
            <button type="button" onClick={() => { setPhone('222222221'); setPin('22221'); }} className="text-xs text-left bg-white text-blue-700 px-3 py-2 rounded-lg border border-blue-200">Support L1: 222222221 / 22221</button>
            <button type="button" onClick={() => { setPhone('222222222'); setPin('22222'); }} className="text-xs text-left bg-white text-blue-700 px-3 py-2 rounded-lg border border-blue-200">Support L2: 222222222 / 22222</button>
            <button type="button" onClick={() => { setPhone('222222223'); setPin('22223'); }} className="text-xs text-left bg-white text-blue-700 px-3 py-2 rounded-lg border border-blue-200">Support L3: 222222223 / 22223</button>
            <button type="button" onClick={() => { setPhone('333333333'); setPin('33333'); }} className="text-xs text-left bg-white text-blue-700 px-3 py-2 rounded-lg border border-blue-200">Compliance: 333333333 / 33333</button>
            <button type="button" onClick={() => { setPhone('999999999'); setPin('99999'); }} className="text-xs text-left bg-white text-blue-700 px-3 py-2 rounded-lg border border-blue-200">Finance: 999999999 / 99999</button>
          </div>
        </div>

        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-gray-500">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary font-semibold hover:underline">
              Sign up here
            </Link>
          </p>
          <p className="text-sm text-gray-500">
            <Link to="/merchant/register" className="text-secondary font-semibold hover:underline">
              Register as a Merchant
            </Link>
          </p>
        </div>
      </form>
        {isForgotPin && (
          <button type="button" onClick={() => { setIsForgotPin(false); setError(''); }} className="w-full mt-4 text-sm text-gray-500 hover:text-gray-800 text-center">
            Back to Login
          </button>
        )}
        {resetSuccess && (
          <div className="mt-4 p-3 bg-green-50 text-green-700 text-sm text-center rounded-xl border border-green-200">
            PIN successfully reset! You can now log in.
          </div>
        )}
    </div>
  );
}
