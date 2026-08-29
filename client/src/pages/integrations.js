import { useState, useEffect } from 'react';
import {
  Mail,
  MessageSquare,
  Send,
  Table,
  CheckCircle2,
  AlertCircle,
  Link as LinkIcon,
  Unlink,
  Radio,
  ShieldCheck,
  Zap,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import ProtectedRoute from '../components/ProtectedRoute/ProtectedRoute';
import AppShell from '../components/AppShell/AppShell';
import api from '../services/api';

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState([]);
  const [healthStatus, setHealthStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      const [listRes, statusRes] = await Promise.all([
        api.get('/integrations'),
        api.get('/integrations/status'),
      ]);

      if (listRes.data.success) {
        setIntegrations(listRes.data.data);
      }
      if (statusRes.data.success) {
        setHealthStatus(statusRes.data.data);
      }
    } catch (e) {
      console.warn('Failed to load integrations:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const handleConnectSandbox = async (provider) => {
    setActionLoading((prev) => ({ ...prev, [provider]: true }));
    try {
      await api.post('/integrations', {
        provider,
        accessToken: `sandbox_token_${provider}_${Date.now()}`,
        accountEmail: `sandbox.operator@${provider}.internal`,
        accountName: `Sandbox (${provider.toUpperCase()})`,
        isSandbox: true,
      });
      await fetchIntegrations();
    } catch (e) {
      console.error('Failed to connect sandbox:', e);
    } finally {
      setActionLoading((prev) => ({ ...prev, [provider]: false }));
    }
  };

  const handleStartOAuth = async (provider) => {
    setActionLoading((prev) => ({ ...prev, [provider]: true }));
    try {
      const res = await api.get(`/integrations/oauth/${provider}/start`);
      if (res.data.authUrl) {
        window.location.href = res.data.authUrl;
      }
    } catch (e) {
      console.error('Failed to initiate OAuth:', e);
      setActionLoading((prev) => ({ ...prev, [provider]: false }));
    }
  };

  const handleDisconnect = async (provider) => {
    setActionLoading((prev) => ({ ...prev, [provider]: true }));
    try {
      await api.delete(`/integrations/${provider}`);
      await fetchIntegrations();
    } catch (e) {
      console.error('Failed to disconnect:', e);
    } finally {
      setActionLoading((prev) => ({ ...prev, [provider]: false }));
    }
  };

  const getProviderIcon = (provider) => {
    switch (provider) {
      case 'gmail':
        return <Mail className="w-6 h-6 text-rose-400" />;
      case 'slack':
        return <MessageSquare className="w-6 h-6 text-emerald-400" />;
      case 'discord':
        return <Send className="w-6 h-6 text-indigo-400" />;
      case 'google-sheets':
        return <Table className="w-6 h-6 text-green-400" />;
      default:
        return <Radio className="w-6 h-6 text-blue-400" />;
    }
  };

  return (
    <ProtectedRoute>
      <AppShell title="Third-Party Integrations" subtitle="Secure OAuth connectors with AES-256 credential encryption at rest">
        <div className="space-y-8 max-w-7xl mx-auto">
          {/* Security Banner */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between bg-slate-900/60">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">Application-Level AES-256 Encryption</h3>
                <p className="text-[11px] text-slate-400">All access and refresh tokens are encrypted at rest with CREDENTIAL_ENCRYPTION_KEY.</p>
              </div>
            </div>

            <button
              onClick={fetchIntegrations}
              className="px-3.5 py-1.5 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-750 text-xs font-semibold flex items-center space-x-1.5 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Verify Health</span>
            </button>
          </div>

          {/* Integrations Grid */}
          {loading ? (
            <div className="text-center py-20 text-slate-500">
              <Loader2 className="w-8 h-8 mx-auto animate-spin text-brand-500 mb-2" />
              <p className="text-xs">Loading integration providers...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {integrations.map((item) => {
                const isConnected = item.isConnected;
                const isWorking = Boolean(actionLoading[item.provider]);
                const health = healthStatus[item.provider];

                return (
                  <div
                    key={item.provider}
                    className="glass-card p-6 rounded-3xl border border-slate-800 flex flex-col justify-between"
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3.5">
                          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
                            {getProviderIcon(item.provider)}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="text-base font-bold text-white">{item.name}</h3>
                              {isConnected && (
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                                  item.isSandbox
                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                }`}>
                                  {item.isSandbox ? 'SANDBOX SIMULATOR' : 'CONNECTED'}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 mt-1">{item.description}</p>
                          </div>
                        </div>
                      </div>

                      {/* Capabilities pills */}
                      <div className="mt-4 pt-4 border-t border-slate-800/80">
                        <span className="text-[10px] uppercase font-mono font-bold text-slate-500 block mb-2">
                          Available Actions
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {item.actions?.map((act) => (
                            <span
                              key={act.id}
                              className="px-2 py-1 rounded-lg bg-slate-850 border border-slate-800 text-[10px] text-slate-300 font-mono"
                            >
                              {act.label}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Connected Account Details */}
                      {isConnected && (
                        <div className="mt-4 p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Account:</span>
                            <span className="font-mono text-slate-200">{item.accountEmail || 'Connected'}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Card Actions Footer */}
                    <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
                      {isConnected ? (
                        <button
                          onClick={() => handleDisconnect(item.provider)}
                          disabled={isWorking}
                          className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold flex items-center space-x-1.5 transition disabled:opacity-50"
                        >
                          {isWorking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Unlink className="w-3.5 h-3.5" />}
                          <span>Disconnect</span>
                        </button>
                      ) : (
                        <div className="flex items-center space-x-2 w-full">
                          <button
                            onClick={() => handleConnectSandbox(item.provider)}
                            disabled={isWorking}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-brand-600/20 hover:bg-brand-600/30 text-brand-300 border border-brand-500/40 text-xs font-semibold flex items-center justify-center space-x-1.5 transition disabled:opacity-50"
                          >
                            <Zap className="w-3.5 h-3.5 text-brand-400" />
                            <span>Quick Connect (Sandbox)</span>
                          </button>
                          <button
                            onClick={() => handleStartOAuth(item.provider)}
                            disabled={isWorking}
                            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition disabled:opacity-50"
                          >
                            <LinkIcon className="w-3.5 h-3.5" />
                            <span>OAuth</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
