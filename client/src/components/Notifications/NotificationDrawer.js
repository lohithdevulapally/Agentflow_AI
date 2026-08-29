import { useState, useEffect } from 'react';
import { X, CheckCheck, Bell, AlertTriangle, AlertOctagon, CheckCircle2, Info } from 'lucide-react';
import api from '../../services/api';
import { getSocket } from '../../services/socket';

export default function NotificationDrawer({ isOpen, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.data);
      }
    } catch (e) {
      console.warn('Failed to fetch notifications:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    const socket = getSocket();
    if (socket) {
      const handleNewNotification = (notif) => {
        setNotifications((prev) => [notif, ...prev]);
      };
      socket.on('notification', handleNewNotification);
      socket.on('global_notification', handleNewNotification);

      return () => {
        socket.off('notification', handleNewNotification);
        socket.off('global_notification', handleNewNotification);
      };
    }
  }, []);

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'escalation':
      case 'error':
        return <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
      default:
        return <Info className="w-5 h-5 text-sky-400 shrink-0" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-all duration-300">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-brand-400" />
            <h2 className="text-base font-semibold text-slate-100">Operator Alerts</h2>
            <span className="bg-brand-500/20 text-brand-300 text-xs px-2 py-0.5 rounded-full font-medium">
              {notifications.filter((n) => !n.isRead).length} new
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={markAllRead}
              title="Mark all as read"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            >
              <CheckCheck className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading && (
            <div className="text-center py-10 text-slate-500 text-sm">
              Loading alerts...
            </div>
          )}

          {!loading && notifications.length === 0 && (
            <div className="text-center py-16 text-slate-500">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No notifications yet.</p>
              <p className="text-xs text-slate-600 mt-1">Execution alerts and escalations will appear here.</p>
            </div>
          )}

          {notifications.map((notif) => (
            <div
              key={notif.id || notif._id}
              className={`p-3.5 rounded-xl border transition ${
                notif.isRead
                  ? 'bg-slate-850/40 border-slate-800/60 text-slate-400'
                  : 'bg-slate-850 border-slate-700 text-slate-200 shadow-sm'
              }`}
            >
              <div className="flex items-start space-x-3">
                {getIcon(notif.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-xs font-semibold text-slate-100 truncate">{notif.title}</h4>
                    <span className="text-[10px] text-slate-500 ml-2 whitespace-nowrap">
                      {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">{notif.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
