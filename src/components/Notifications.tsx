import React, { useState, useEffect } from 'react';
import { Notification01Icon as Bell, CheckmarkBadge01Icon as Check } from 'hugeicons-react';
import { motion, AnimatePresence } from 'framer-motion';

export function NotificationsPopover({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000); // Polling every 5s for real-time feel
    return () => clearInterval(interval);
  }, [userId]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`/api/users/${userId}/notifications`);
      const data = await res.json();
      if (data.notifications) {
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const markAsRead = async (notificationId: string) => {
    setNotifications(prev => prev.map(n => n._id === notificationId ? { ...n, read: true } : n));
    try {
      await fetch(`/api/notifications/${notificationId}/read`, { method: 'POST' });
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="relative p-2 rounded-full hover:bg-white/10 transition-colors"
      >
        <Bell className="text-white" size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#1E1B4B]"></span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-[999] overflow-hidden"
          >
            <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">Notifications</h3>
              {unreadCount > 0 && <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-medium">{unreadCount} new</span>}
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-gray-400 text-sm">No notifications yet</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {notifications.map(notification => (
                    <div key={notification._id} className={`p-4 ${notification.read ? 'opacity-60 bg-white' : 'bg-indigo-50/30'}`}>
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h4 className="font-medium text-sm text-gray-800">{notification.title}</h4>
                          <p className="text-xs text-gray-500 mt-1 leading-relaxed">{notification.message}</p>
                          <span className="text-[10px] text-gray-400 mt-2 block">
                             {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {!notification.read && (
                          <button 
                            onClick={() => markAsRead(notification._id)}
                            className="text-indigo-600 hover:text-indigo-700 p-1 rounded-full hover:bg-indigo-50"
                            title="Mark as read"
                          >
                            <Check size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
