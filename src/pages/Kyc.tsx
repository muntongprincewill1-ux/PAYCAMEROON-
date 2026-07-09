import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield01Icon as ShieldCheck, ArrowRight01Icon as ArrowRight, CloudUploadIcon as UploadCloud, CheckmarkCircle02Icon as CheckCircle2, Logout01Icon as LogOut } from 'hugeicons-react';

import { useEffect } from 'react';

export default function Kyc() {
  const [loading, setLoading] = useState(false);
  const [docType, setDocType] = useState('ID Card');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  
  const user = (() => { try { const u = localStorage.getItem('user'); return u && u !== 'undefined' ? JSON.parse(u) : {}; } catch(e) { return {}; } })();

  useEffect(() => {
    if (user && (user.kycVerified || ['agent', 'merchant'].includes(user.role))) {
       if (user.role === 'merchant') {
          navigate('/merchant/dashboard');
       } else if (user.role === 'agent') {
          navigate('/agent/dashboard');
       } else {
          navigate('/home');
       }
    }
  }, [navigate, user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selected);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleKycComplete = () => {
    user.kycVerified = true;
    localStorage.setItem('user', JSON.stringify(user));
    if (user.role === 'merchant') {
       navigate('/merchant/dashboard');
    } else if (user.role === 'agent') {
       navigate('/agent/dashboard');
    } else {
       navigate('/home');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !preview) {
      setErrorMsg("Please select a document image.");
      return;
    }
    
    setLoading(true);
    setErrorMsg('');
    
    try {
      const response = await fetch('/api/compliance/kyc/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user._id,
          name: user.name,
          documentType: docType,
          image: preview 
        })
      });
      
      const data = await response.json();
      if (response.ok) {
        setSuccess(true);
        setTimeout(() => handleKycComplete(), 2000);
      } else {
        setErrorMsg(data.error || "Verification failed");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-6">
          <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-xl text-center">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={40} className="text-emerald-500" />
            </div>
            <h1 className="text-2xl font-bold text-dark mb-2">Identity Verified!</h1>
            <p className="text-gray-500 mb-8">
              Your document has been verified successfully. Redirecting...
            </p>
          </div>
        </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-6 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-xl relative">
        <button onClick={handleLogout} className="absolute top-6 right-6 text-gray-400 hover:text-red-500 transition-colors" title="Logout">
           <LogOut size={24} />
        </button>
        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 mt-2">
          <ShieldCheck size={40} className="text-primary" />
        </div>
        
        <h1 className="text-2xl font-bold text-center text-dark mb-2">Verify Your Identity</h1>
        <p className="text-center text-gray-500 mb-8">
          To keep your account secure and comply with regulations, we need to verify your identity.
        </p>

        {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100 text-center">
              {errorMsg}
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Document Type</label>
                <select 
                   value={docType}
                   onChange={e => setDocType(e.target.value)}
                   className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition outline-none bg-gray-50 text-gray-900"
                >
                    <option value="ID Card">National ID Card</option>
                    <option value="Passport">Passport</option>
                    <option value="Driver's License">Driver's License</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Upload Document</label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:bg-gray-50 transition cursor-pointer relative group">
                    <input 
                       type="file"
                       accept="image/*"
                       onChange={handleFileChange}
                       className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    {preview ? (
                        <div className="flex flex-col items-center">
                            <img src={preview} alt="Document Preview" className="max-h-48 object-contain rounded-lg shadow-sm mb-4" />
                            <p className="text-sm text-primary font-bold">Tap to change image</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center">
                            <div className="w-12 h-12 bg-blue-50 text-primary rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <UploadCloud size={24} />
                            </div>
                            <p className="text-sm font-bold text-gray-700 mb-1">Select File</p>
                            <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                        </div>
                    )}
                </div>
            </div>

            <button 
                type="submit" 
                disabled={loading || !file}
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
                {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                    <>Verify Document <ArrowRight size={18} /></>
                )}
            </button>
        </form>
      </div>
    </div>
  );
}
