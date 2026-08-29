import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  LayoutDashboard,
  GitBranch,
  Sparkles,
  PlaySquare,
  Radio,
  Settings,
  Bell,
  LogOut,
  Cpu,
  Layers,
  ChevronRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import NotificationDrawer from '../Notifications/NotificationDrawer';
import api from '../../services/api';

export default function AppShell({ children, title, subtitle }) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Workflows', href: '/workflows', icon: GitBranch },
    { name: 'AI Builder', href: '/workflows/builder', icon: Sparkles, badge: 'AI' },
    { name: 'Executions', href: '/executions', icon: PlaySquare },
    { name: 'Integrations', href: '/integrations', icon: Radio },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await api.get('/notifications');
        if (res.data.success) {
          const unread = res.data.data.filter((n) => !n.isRead).length;
          setUnreadCount(unread);
        }
      } catch (e) {
        // silent fail
      }
    };
    fetchUnread();
  }, []);

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 antialiased font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900/90 border-r border-slate-800 flex flex-col justify-between backdrop-blur-xl shrink-0">
        <div>
          {/* Brand Logo */}
          <div className="h-16 flex items-center px-6 border-b border-slate-800/80 gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-brand-500/20 ring-1 ring-white/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                Agentflow<span className="text-brand-400 font-extrabold">.AI</span>
              </span>
              <p className="text-[10px] text-brand-300 font-mono font-medium tracking-wider uppercase">
                Operator Console
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 mt-2">
            {navigation.map((item) => {
              const isActive = router.pathname === item.href || (item.href !== '/dashboard' && router.pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                    isActive
                      ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 transition ${isActive ? 'text-brand-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="bg-gradient-to-r from-brand-500 to-purple-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-xs">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Subsystem & User Footer */}
        <div className="p-4 border-t border-slate-800/80 space-y-3 bg-slate-950/40">
          {/* Multi-Agent Status pill */}
          <div className="px-3 py-2 rounded-lg bg-slate-850 border border-slate-800/90 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-300 font-medium">5-Agent Engine</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono font-semibold">ACTIVE</span>
          </div>

          {/* User Profile */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-brand-700 flex items-center justify-center font-bold text-xs text-white uppercase ring-1 ring-white/10">
                {user?.name?.[0] || 'O'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-200 truncate">{user?.name || 'Operator'}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.role || 'operator'}</p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-slate-800/80 px-8 flex items-center justify-between bg-slate-900/60 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center space-x-3">
            <div>
              <h1 className="text-base font-semibold text-slate-100">{title || 'Console'}</h1>
              {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/workflows/builder"
              className="hidden sm:flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md shadow-brand-600/20 transition-all hover:scale-[1.02]"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Prompt Generator</span>
            </Link>

            {/* Notification Bell */}
            <button
              onClick={() => setIsNotifOpen(true)}
              className="relative p-2 rounded-xl text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-extrabold flex items-center justify-center ring-2 ring-slate-900 animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-8 bg-slate-950">
          {children}
        </main>
      </div>

      {/* Notification Drawer */}
      <NotificationDrawer isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
    </div>
  );
}
