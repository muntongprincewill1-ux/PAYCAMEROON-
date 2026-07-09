import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft01Icon as ArrowLeft, MoonIcon as Moon, Sun01Icon as Sun, ComputerIcon as Monitor, Globe02Icon as Globe, Logout01Icon as LogOut } from 'hugeicons-react';
import { useTranslation } from "react-i18next";
import { useTheme } from "../providers/ThemeProvider";
import CopyPaycamId from "../components/CopyPaycamId";

export default function Settings() {
  const { t, i18n } = useTranslation();
  const [user, setUser] = useState<any>(null);

  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [pinMessage, setPinMessage] = useState({ type: "", text: "" });

  const handleUpdatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinMessage({ type: "", text: "" });
    if (!oldPin || !newPin) {
      setPinMessage({ type: "error", text: "Please enter both old and new PIN." });
      return;
    }
    if (!/^\d{5}$/.test(newPin)) {
      setPinMessage({ type: "error", text: "New PIN must be exactly 5 digits." });
      return;
    }
    
    try {
      const res = await fetch(`/api/user/${user._id}/update-pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPin, newPin })
      });
      const data = await res.json();
      if (res.ok) {
        setPinMessage({ type: "success", text: "PIN updated successfully." });
        setOldPin("");
        setNewPin("");
      } else {
        setPinMessage({ type: "error", text: data.error || "Failed to update PIN." });
      }
    } catch (err) {
      setPinMessage({ type: "error", text: "Network error." });
    }
  };

  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem("i18nextLng", lng);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen pb-20 font-sans transition-colors duration-200">
      <div className="bg-white dark:bg-gray-800 px-6 py-4 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-gray-600 dark:text-gray-300"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          {t("Settings")}
        </h1>
        <div className="w-8"></div>
      </div>

      <div className="p-6 space-y-6">
        {user && (
          <div className="bg-primary px-5 py-6 rounded-2xl shadow-lg flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center border-2 border-white/30 backdrop-blur-sm mb-3">
              <span className="text-white font-bold text-2xl">
                {user.name?.charAt(0) || user.businessName?.charAt(0)}
              </span>
            </div>
            <h2 className="text-white font-bold text-xl">
              {user.name || user.businessName}
            </h2>
            <p className="text-white/80 text-sm mb-3">{user.phone}</p>
            <CopyPaycamId paycamId={user.paycamId} />
          </div>
        )}

        {user && ['user', 'merchant', 'agent'].includes(user.role) && (
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2">
              {t("Transaction Limits")}
            </h3>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden divide-y divide-gray-100 dark:divide-gray-700">
              {user.role === 'user' && (
                <>
                  <div className="p-4 flex justify-between items-center">
                    <span className="text-gray-700 dark:text-gray-300 text-sm">Max Per Transfer</span>
                    <span className="font-bold text-gray-900 dark:text-white">{(user.limits?.maxPerTransfer || 5000000).toLocaleString()} XAF</span>
                  </div>
                  <div className="p-4 flex justify-between items-center">
                    <span className="text-gray-700 dark:text-gray-300 text-sm">Max P2P Transfer</span>
                    <span className="font-bold text-gray-900 dark:text-white">{(user.limits?.maxP2PTransfer || 5000000).toLocaleString()} XAF</span>
                  </div>
                  <div className="p-4 flex justify-between items-center">
                    <span className="text-gray-700 dark:text-gray-300 text-sm">Max Daily Volume</span>
                    <span className="font-bold text-gray-900 dark:text-white">{(user.limits?.maxDaily || 100000000).toLocaleString()} XAF</span>
                  </div>
                  <div className="p-4 flex justify-between items-center">
                    <span className="text-gray-700 dark:text-gray-300 text-sm">Max Monthly Volume</span>
                    <span className="font-bold text-gray-900 dark:text-white">{(user.limits?.maxMonthly || 100000000).toLocaleString()} XAF</span>
                  </div>
                </>
              )}
              {user.role === 'merchant' && (
                <>
                  <div className="p-4 flex justify-between items-center">
                    <span className="text-gray-700 dark:text-gray-300 text-sm">Max Daily Payment</span>
                    <span className="font-bold text-gray-900 dark:text-white">{(user.limits?.maxDailyPayment || 10000000).toLocaleString()} XAF</span>
                  </div>
                  <div className="p-4 flex justify-between items-center">
                    <span className="text-gray-700 dark:text-gray-300 text-sm">Max Holding Amount</span>
                    <span className="font-bold text-gray-900 dark:text-white">{(user.limits?.maxFloat || 100000000).toLocaleString()} XAF</span>
                  </div>
                  <div className="p-4 flex justify-between items-center">
                    <span className="text-gray-700 dark:text-gray-300 text-sm">Max Daily Volume</span>
                    <span className="font-bold text-gray-900 dark:text-white">{(user.limits?.maxDaily || 100000000).toLocaleString()} XAF</span>
                  </div>
                </>
              )}
              {user.role === 'agent' && (
                <>
                  <div className="p-4 flex justify-between items-center">
                    <span className="text-gray-700 dark:text-gray-300 text-sm">Max Float Hold</span>
                    <span className="font-bold text-gray-900 dark:text-white">{(user.limits?.maxFloat || 100000000).toLocaleString()} XAF</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        
        {user && ['user', 'merchant', 'agent'].includes(user.role) && (
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2">
              {t("Security")}
            </h3>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
              <h4 className="font-bold text-gray-900 dark:text-white mb-2">Change PIN</h4>
              <form onSubmit={handleUpdatePin} className="space-y-3">
                {pinMessage.text && (
                  <div className={`p-2 text-sm rounded-lg ${pinMessage.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                    {pinMessage.text}
                  </div>
                )}
                <div>
                  <input
                    type="password"
                    placeholder="Old PIN"
                    value={oldPin}
                    onChange={(e) => setOldPin(e.target.value)}
                    maxLength={5}
                    className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <input
                    type="password"
                    placeholder="New PIN (5 digits)"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    maxLength={5}
                    className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-primary text-white font-bold rounded-xl px-4 py-3 hover:bg-primary-dark transition-colors"
                >
                  Update PIN
                </button>
              </form>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2">
            {t("Theme")}
          </h3>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden divide-y divide-gray-100 dark:divide-gray-700">
            <button
              onClick={() => setTheme("light")}
              className={`w-full flex items-center justify-between p-4 ${theme === "light" ? "bg-blue-50/50 dark:bg-blue-900/20 text-primary" : "text-gray-700 dark:text-gray-300"}`}
            >
              <div className="flex items-center gap-3">
                <Sun size={20} /> {t("Light")}
              </div>
              {theme === "light" && (
                <div className="w-2 h-2 rounded-full bg-primary" />
              )}
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={`w-full flex items-center justify-between p-4 ${theme === "dark" ? "bg-blue-50/50 dark:bg-blue-900/20 text-primary" : "text-gray-700 dark:text-gray-300"}`}
            >
              <div className="flex items-center gap-3">
                <Moon size={20} /> {t("Dark")}
              </div>
              {theme === "dark" && (
                <div className="w-2 h-2 rounded-full bg-primary" />
              )}
            </button>
            <button
              onClick={() => setTheme("system")}
              className={`w-full flex items-center justify-between p-4 ${theme === "system" ? "bg-blue-50/50 dark:bg-blue-900/20 text-primary" : "text-gray-700 dark:text-gray-300"}`}
            >
              <div className="flex items-center gap-3">
                <Monitor size={20} /> {t("System")}
              </div>
              {theme === "system" && (
                <div className="w-2 h-2 rounded-full bg-primary" />
              )}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2">
            {t("Language")}
          </h3>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden divide-y divide-gray-100 dark:divide-gray-700">
            <button
              onClick={() => changeLanguage("en")}
              className={`w-full flex items-center justify-between p-4 ${i18n.language === "en" ? "bg-blue-50/50 dark:bg-blue-900/20 text-primary" : "text-gray-700 dark:text-gray-300"}`}
            >
              <div className="flex items-center gap-3">
                <Globe size={20} /> English
              </div>
              {i18n.language === "en" && (
                <div className="w-2 h-2 rounded-full bg-primary" />
              )}
            </button>
            <button
              onClick={() => changeLanguage("fr")}
              className={`w-full flex items-center justify-between p-4 ${i18n.language === "fr" ? "bg-blue-50/50 dark:bg-blue-900/20 text-primary" : "text-gray-700 dark:text-gray-300"}`}
            >
              <div className="flex items-center gap-3">
                <Globe size={20} /> Français
              </div>
              {i18n.language === "fr" && (
                <div className="w-2 h-2 rounded-full bg-primary" />
              )}
            </button>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 p-4 mt-4 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-2xl font-bold hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
        >
          <LogOut size={20} /> {t("Logout")}
        </button>
      </div>
    </div>
  );
}
