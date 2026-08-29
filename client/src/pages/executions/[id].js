import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  ArrowLeft,
  Play,
  Pause,
  Square,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Terminal,
  Activity,
  Layers,
  Cpu,
} from 'lucide-react';
import ProtectedRoute from '../../components/ProtectedRoute/ProtectedRoute';
import AppShell from '../../components/AppShell/AppShell';
import LiveTimeline from '../../components/LiveTimeline/LiveTimeline';
import api from '../../services/api';
import { joinExecutionRoom, leaveExecutionRoom, getSocket } from '../../services/socket';

export default function ExecutionDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const [execution, setExecution] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('timeline'); // 'timeline' | 'outputs' | 'snapshot'

  const fetchExecutionData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [execRes, timelineRes] = await Promise.all([
        api.get(`/executions/${id}`),
        api.get(`/executions/${id}/timeline`),
      ]);

      if (execRes.data.success) {
        setExecution(execRes.data.data);
      }
      if (timelineRes.data.success) {
        setLogs(timelineRes.data.data);
      }
    } catch (e) {
      console.warn('Failed to load execution detail:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchExecutionData();
      joinExecutionRoom(id);

      const socket = getSocket();
      if (socket) {
        const handleAgentEvent = (event) => {
          setLogs((prev) => [...prev, event]);
        };

        const handleExecutionUpdate = (update) => {
          setExecution((prev) => ({ ...prev, ...update }));
        };

        socket.on('agent_event', handleAgentEvent);
        socket.on('execution_update', handleExecutionUpdate);

        return () => {
          leaveExecutionRoom(id);
          socket.off('agent_event', handleAgentEvent);
          socket.off('execution_update', handleExecutionUpdate);
        };
      }
    }
  }, [id]);

  const handlePause = async () => {
    try {
      await api.post(`/executions/${id}/pause`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleResume = async () => {
    try {
      await api.post(`/executions/${id}/resume`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCancel = async () => {
    try {
      await api.post(`/executions/${id}/cancel`);
    } catch (e) {
      console.error(e);
    }
  };

  const isLive = execution?.status === 'RUNNING' || execution?.status === 'RETRYING';

  return (
    <ProtectedRoute>
      <AppShell title="Live Execution Monitor" subtitle={`Run ID: ${id}`}>
        <div className="space-y-6 max-w-7xl mx-auto h-[calc(100vh-140px)] flex flex-col">
          {/* Top Control Bar */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
            <div className="flex items-center space-x-3">
              <Link
                href="/executions"
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>

              <div>
                <div className="flex items-center space-x-2.5">
                  <h2 className="text-base font-bold text-white">
                    {execution?.workflowName || 'Workflow Execution'}
                  </h2>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      execution?.status === 'COMPLETED'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : execution?.status === 'RUNNING'
                        ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 animate-pulse'
                        : execution?.status === 'PAUSED'
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                        : execution?.status === 'FAILED'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {execution?.status || 'PENDING'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                  Started: {execution?.startTime ? new Date(execution.startTime).toLocaleTimeString() : 'N/A'} • Duration: {execution?.duration ? `${(execution.duration / 1000).toFixed(2)}s` : 'active'}
                </p>
              </div>
            </div>

            {/* Runtime Actions (Pause, Resume, Cancel) */}
            <div className="flex items-center space-x-2">
              {execution?.status === 'RUNNING' && (
                <button
                  onClick={handlePause}
                  className="px-3.5 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold flex items-center space-x-1.5 transition"
                >
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause</span>
                </button>
              )}

              {execution?.status === 'PAUSED' && (
                <button
                  onClick={handleResume}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center space-x-1.5 transition"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Resume</span>
                </button>
              )}

              {['RUNNING', 'PAUSED', 'RETRYING'].includes(execution?.status) && (
                <button
                  onClick={handleCancel}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold flex items-center space-x-1.5 transition"
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
              )}

              {/* View in Editor shortcut */}
              {execution?.workflowId && (
                <Link
                  href={`/workflows/${execution.workflowId}`}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold transition"
                >
                  Edit Flow
                </Link>
              )}
            </div>
          </div>

          {/* Tab Selection */}
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 shrink-0">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 ${
                activeTab === 'timeline'
                  ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Live Agent Timeline ({logs.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('outputs')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 ${
                activeTab === 'outputs'
                  ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Outputs & Step Data</span>
            </button>
            <button
              onClick={() => setActiveTab('snapshot')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 ${
                activeTab === 'snapshot'
                  ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Runtime Graph Snapshot</span>
            </button>
          </div>

          {/* Main Display Body */}
          <div className="flex-1 min-h-0">
            {activeTab === 'timeline' && (
              <LiveTimeline logs={logs} isLive={isLive} />
            )}

            {activeTab === 'outputs' && (
              <div className="h-full glass-panel p-5 rounded-2xl border border-slate-800 overflow-y-auto">
                <h4 className="text-xs font-mono font-bold uppercase text-slate-400 mb-3">
                  Step Execution Results
                </h4>
                <pre className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 text-xs font-mono text-slate-200 overflow-x-auto">
                  {JSON.stringify(execution?.outputs || {}, null, 2)}
                </pre>
              </div>
            )}

            {activeTab === 'snapshot' && (
              <div className="h-full glass-panel p-5 rounded-2xl border border-slate-800 overflow-y-auto space-y-4">
                <h4 className="text-xs font-mono font-bold uppercase text-slate-400">
                  Immutable Runtime Graph Snapshot (v{execution?.workflowSnapshot?.version || 1})
                </h4>
                <pre className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 text-xs font-mono text-slate-200 overflow-x-auto">
                  {JSON.stringify(execution?.workflowSnapshot || {}, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
