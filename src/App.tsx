/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Kyc from './pages/Kyc';
import Home from './pages/Home';
import Transfer from './pages/Transfer';
import Scan from './pages/Scan';
import Deposit from './pages/Deposit';
import Withdraw from './pages/Withdraw';
import Compare from './pages/Compare';
import Store from './pages/Store';
import SupportUser from './pages/SupportUser';
import SupportDashboard from './pages/SupportDashboard';
import AdminDashboard from './pages/AdminDashboard';
import FinanceDashboard from './pages/FinanceDashboard';
import MerchantRegister from './pages/MerchantRegister';
import MerchantDashboard from './pages/MerchantDashboard';
import Settings from './pages/Settings';
import PendingTransactions from './pages/PendingTransactions';
import Statements from './pages/Statements';
import ComplianceDashboard from './pages/ComplianceDashboard';
import AgentDashboard from './pages/AgentDashboard';

function MobileLayout() {
  const location = useLocation();
  const hideNav = ['/', '/login', '/signup'].includes(location.pathname);

  return (
    <div className="app-container">
      <div className={hideNav ? "" : "content-area"}>
        <Outlet />
      </div>
      {!hideNav && <BottomNav />}
    </div>
  );
}

function DesktopLayout() {
  return (
    <div className="w-full min-h-screen bg-gray-50 dark:bg-gray-900 text-dark dark:text-white">
      <Outlet />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<MobileLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/kyc" element={<Kyc />} />
          <Route path="/home" element={<Home />} />
          <Route path="/transfer" element={<Transfer />} />
          <Route path="/scan" element={<Scan />} />
          <Route path="/deposit" element={<Deposit />} />
          <Route path="/withdraw" element={<Withdraw />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/store" element={<Store />} />
          <Route path="/support" element={<SupportUser />} />
          <Route path="/merchant/register" element={<MerchantRegister />} />
          <Route path="/merchant/dashboard" element={<MerchantDashboard />} />
          <Route path="/agent/dashboard" element={<AgentDashboard />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/pending-transactions" element={<PendingTransactions />} />
          <Route path="/statements" element={<Statements />} />
        </Route>

        <Route element={<DesktopLayout />}>
          <Route path="/support-dashboard" element={<SupportDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/finance" element={<FinanceDashboard />} />
          <Route path="/compliance" element={<ComplianceDashboard />} />
        </Route>
      </Routes>
    </Router>
  );
}
