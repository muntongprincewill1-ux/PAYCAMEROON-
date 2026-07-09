import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home01Icon as Home, SentIcon as Send, BarChartIcon as BarChart2, ShoppingBag01Icon as ShoppingBag, Message01Icon as MessageSquare } from 'hugeicons-react';
import { useTranslation } from 'react-i18next';

export default function BottomNav() {
  const location = useLocation();
  const { t } = useTranslation();
  
  const userRole = (() => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr || userStr === 'undefined') return null;
      const user = JSON.parse(userStr);
      return user?.role || null;
    } catch (e) {
      return null;
    }
  })();

  const navItems = [
    { path: '/home', icon: <Home size={24} />, label: t('Home Nav', 'Home') },
    { path: '/transfer', icon: <Send size={24} />, label: t('Send Nav', 'Send') },
    { path: '/compare', icon: <BarChart2 size={24} />, label: t('Rates Nav', 'Rates') },
    { path: '/store', icon: <ShoppingBag size={24} />, label: t('Store Nav', 'Store') },
    { path: '/support', icon: <MessageSquare size={24} />, label: t('PayChat Nav', 'PayChat') },
  ];

  if (userRole && userRole !== 'user') return null;

  if (
    location.pathname === '/' || 
    location.pathname === '/login' || 
    location.pathname === '/signup' || 
    location.pathname === '/kyc' ||
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/merchant') ||
    location.pathname.startsWith('/agent') ||
    location.pathname.startsWith('/support-dashboard') ||
    location.pathname.startsWith('/compliance')
  ) return null;

  return (
    <div className="fixed bottom-0 w-full max-w-[480px] bg-white border-t border-gray-200 flex justify-around items-center py-3 px-2 z-50 rounded-t-2xl shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
      {navItems.map((item) => {
        const isActive = location.pathname.startsWith(item.path);
        
        const isBlocked = () => {
          try {
            const user = (() => { try { const u = localStorage.getItem('user'); return u && u !== 'undefined' ? JSON.parse(u) : {}; } catch(e) { return {}; } })();
            if (user?.status === 'blocked_temporal') {
              if (item.path !== '/home' && item.path !== '/support') {
                 return true;
              }
            }
          } catch(e) {}
          return false;
        };

        const handleClick = (e: React.MouseEvent) => {
          if (isBlocked()) {
            e.preventDefault();
            alert('Your account is blocked. Please contact support.');
          }
        };

        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={handleClick}
            className={`flex flex-col items-center justify-center w-16 transition-colors duration-200 ${
              isActive ? 'text-primary dark:text-blue-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
          >
            <div className={`mb-1 ${isActive ? 'scale-110 transition-transform' : ''}`}>
              {item.icon}
            </div>
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
