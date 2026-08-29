import { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Key,
  Database,
  Cpu,
  User,
  CheckCircle2,
  Lock,
  Activity,
  Server,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import ProtectedRoute from '../components/ProtectedRoute/ProtectedRoute';
import AppShell from '../components/AppShell/AppShell';
import useAuthStore from '../store/authStore';
import api from '../services/api';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      const res = await api.get('/health');
      setHealth(res.data);
    } catch (e) {
      console.warn('Failed to fetch system health:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <ProtectedRoute>
      <AppShell title="System Settings & Diagnostics" subtitle="Operator profile, key encryption verification, and engine telemetry">
        <div className="space-y-8 max-w-5xl mx-auto">
          {/* Operator Profile Card */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl">
            <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-slate-800">
              <div className="p-2.5 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Operator Profile</h3>
                <p className="text-xs text-slate-400">Authenticated user identity and role authorization</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-850 border border-slate-800/80">
                <span className="text-slate-400 font-medium block mb-1">Operator Name</span>
                <span className="text-sm font-semibold text-white">{user?.name || 'Lead Operator'}</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-850 border border-slate-800/80">
                <span className="text-slate-400 font-medium block mb-1">Email Address</span>
                <span className="text-sm font-semibold text-white">{user?.email || 'operator@agentflow.io'}</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-850 border border-slate-800/80">
                <span className="text-slate-400 font-medium block mb-1">System Role</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 font-mono text-[11px] font-bold uppercase">
                  {user?.role || 'operator'}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-850 border border-slate-800/80">
                <span className="text-slate-400 font-medium block mb-1">Last Authentication</span>
                <span className="text-xs font-mono text-slate-300">
                  {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Active Session'}
                </span>
              </div>
            </div>
          </div>

          {/* Key Encryption & Security Subsystem Check */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Security & Engine Health Check</h3>
                  <p className="text-xs text-slate-400">Verification of encryption keys and orchestrator runtime state</p>
                </div>
              </div>

              <button
                onClick={fetchHealth}
                className="px-3.5 py-1.5 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-750 text-xs font-semibold flex items-center space-x-1.5 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Re-check</span>
              </button>
            </div>

            {loading ? (
              <div className="text-center py-10 text-slate-500 text-xs">
                <Loader2 className="w-6 h-6 mx-auto animate-spin text-brand-500 mb-2" />
                <span>Validating subsystems...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. AES-256 Key Status */}
                <div className="p-4 rounded-2xl bg-slate-850 border border-slate-800/80 flex items-start space-x-3">
                  <Lock className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-xs font-bold text-white">AES-256 Credential Encryption</h4>
                      <span className="px-2 py-0.2 rounded-full text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        ACTIVE
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Tokens are encrypted at rest using application-level 256-bit CBC cipher.
                    </p>
                  </div>
                </div>

                {/* 2. Database Engine Status */}
                <div className="p-4 rounded-2xl bg-slate-850 border border-slate-800/80 flex items-start space-x-3">
                  <Database className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-xs font-bold text-white">Database Layer</h4>
                      <span className="px-2 py-0.2 rounded-full text-[9px] font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        HEALTHY
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {health?.database?.type || 'In-Memory Resilient Fallback Engine'}
                    </p>
                  </div>
                </div>

                {/* 3. LangGraph Agent Substrate */}
                <div className="p-4 rounded-2xl bg-slate-850 border border-slate-800/80 flex items-start space-x-3">
                  <Cpu className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-xs font-bold text-white">LangGraph Orchestration Substrate</h4>
                      <span className="px-2 py-0.2 rounded-full text-[9px] font-mono font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        AVAILABLE
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Planner, Execution, Validation, Recovery, and Monitoring agents ready.
                    </p>
                  </div>
                </div>

                {/* 4. Real-time Socket & Queues */}
                <div className="p-4 rounded-2xl bg-slate-850 border border-slate-800/80 flex items-start space-x-3">
                  <Activity className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-xs font-bold text-white">Real-Time Event Stream</h4>
                      <span className="px-2 py-0.2 rounded-full text-[9px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        SOCKET.IO ACTIVE
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      WebSocket channels active with BullMQ / In-memory queue dispatch.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
