import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useSettings } from '../hooks/useSettings';
import { Shield01Icon as ShieldCheck, FlashIcon as Zap, Globe02Icon as Globe2, UserIcon, Store01Icon } from 'hugeicons-react';

export default function Landing() {
  const navigate = useNavigate();
  const { appLogoUrl } = useSettings();
  const [showRoles, setShowRoles] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-secondary/20 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="z-10 flex flex-col items-center max-w-md w-full"
      >
        <div className="w-32 h-32 mb-8 bg-white rounded-2xl shadow-xl flex items-center justify-center p-2 overflow-hidden">
          {appLogoUrl ? (
            <img src={appLogoUrl} alt="App Logo" className="w-full h-full object-contain" />
          ) : (
            <div className="text-3xl font-bold text-primary tracking-tighter">PC</div>
          )}
        </div>

        <h1 className="text-4xl font-extrabold text-dark text-center mb-4 tracking-tight leading-tight">
          Secure Transactions For Cameroon
        </h1>
        
        <p className="text-gray-600 text-center mb-10 text-lg">
          The most reliable, instant, and secure way to manage your money across Cameroon.
        </p>

        <div className="w-full relative min-h-[300px]">
          <AnimatePresence mode="wait">
            {!showRoles ? (
              <motion.div
                key="features"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="w-full flex flex-col"
              >
                <div className="w-full space-y-4 mb-12">
                  <div className="flex items-center space-x-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Zap className="text-primary w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-dark">Instant Transfers</h3>
                      <p className="text-sm text-gray-500">Send money in seconds</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="p-2 bg-green-500/10 rounded-lg">
                      <ShieldCheck className="text-green-600 w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-dark">Bank-grade Security</h3>
                      <p className="text-sm text-gray-500">Your funds are protected</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="p-2 bg-secondary/10 rounded-lg">
                      <Globe2 className="text-secondary w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-dark">Nationwide</h3>
                      <p className="text-sm text-gray-500">Transact across Cameroon easily</p>
                    </div>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowRoles(true)}
                  className="w-full bg-primary text-white py-4 rounded-full font-bold text-lg shadow-lg hover:bg-primary/90 transition-colors"
                >
                  Get Started
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                key="roles"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="w-full flex flex-col space-y-4"
              >
                <h2 className="text-2xl font-bold text-dark mb-2 text-center">Choose Account Type</h2>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/signup')}
                  className="flex items-center p-6 bg-white rounded-2xl shadow-sm border border-gray-200 hover:border-primary transition-all text-left group"
                >
                  <div className="p-4 bg-blue-50 text-blue-600 rounded-full mr-4 group-hover:bg-primary group-hover:text-white transition-colors">
                    <UserIcon className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-dark">Standard User</h3>
                    <p className="text-gray-500 text-sm mt-1">Send, receive, and manage your personal funds securely.</p>
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/merchant/register')}
                  className="flex items-center p-6 bg-white rounded-2xl shadow-sm border border-gray-200 hover:border-secondary transition-all text-left group"
                >
                  <div className="p-4 bg-orange-50 text-orange-600 rounded-full mr-4 group-hover:bg-secondary group-hover:text-white transition-colors">
                    <Store01Icon className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-dark">Merchant</h3>
                    <p className="text-gray-500 text-sm mt-1">Accept payments, manage stores, and track business analytics.</p>
                  </div>
                </motion.button>

                <button
                  onClick={() => setShowRoles(false)}
                  className="mt-6 text-gray-500 hover:text-dark font-medium transition-colors"
                >
                  Back
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="mt-6 text-sm text-gray-500">
          Already have an account?{' '}
          <button onClick={() => navigate('/login')} className="text-primary font-semibold hover:underline">
            Log in
          </button>
        </p>
      </motion.div>
    </div>
  );
}
