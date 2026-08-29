import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  PlaySquare,
  Search,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ArrowRight,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import ProtectedRoute from '../../components/ProtectedRoute/ProtectedRoute';
import AppShell from '../../components/AppShell/AppShell';
import api from '../../services/api';

export default function ExecutionsHistoryPage() {
  const router = useRouter();
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [search, setSearch] = useState('');

  const fetchExecutions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/executions');
      if (res.data.success) {
        setExecutions(res.data.executions);
      }
    } catch (e) {
      console.warn('Failed to fetch executions:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExecutions();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">COMPLETED</span>;
      case 'RUNNING':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 animate-pulse">RUNNING</span>;
      case 'RETRYING':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">RETRYING</span>;
      case 'PAUSED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">PAUSED</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-700 text-slate-300 border border-slate-600">CANCELLED</span>;
      case 'FAILED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">ESCALATED</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400">{status}</span>;
    }
  };

  const filtered = executions.filter((e) => {
    const matchStatus = selectedStatus === 'all' || e.status === selectedStatus;
    const matchSearch = (e.workflowName || '').toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <ProtectedRoute>
      <AppShell title="Agent Execution History" subtitle="Live runs, duration benchmarks, and operator audit trail">
        <div className="space-y-6 max-w-7xl mx-auto">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search execution runs..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-brand-500"
              >
                <option value="all">All Statuses</option>
                <option value="COMPLETED">Completed</option>
                <option value="RUNNING">Running</option>
                <option value="RETRYING">Retrying</option>
                <option value="PAUSED">Paused</option>
                <option value="FAILED">Escalated / Failed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <button
              onClick={fetchExecutions}
              className="px-4 py-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-750 text-xs font-semibold flex items-center space-x-1.5 transition self-start sm:self-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          {/* Executions Table */}
          {loading ? (
            <div className="text-center py-20 text-slate-500">
              <Loader2 className="w-8 h-8 mx-auto animate-spin text-brand-500 mb-2" />
              <p className="text-xs">Loading execution history...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 glass-panel rounded-3xl border border-slate-800">
              <PlaySquare className="w-10 h-10 mx-auto text-slate-600 mb-3" />
              <h3 className="text-sm font-semibold text-white">No execution runs found</h3>
              <p className="text-xs text-slate-400 mt-1 mb-4">Trigger an automation to stream multi-agent events.</p>
              <Link
                href="/workflows"
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold"
              >
                <span>Browse Workflows</span>
              </Link>
            </div>
          ) : (
            <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase">
                  <tr>
                    <th className="px-5 py-3.5 font-bold">Automation</th>
                    <th className="px-5 py-3.5 font-bold">Status</th>
                    <th className="px-5 py-3.5 font-bold">Started</th>
                    <th className="px-5 py-3.5 font-bold">Duration</th>
                    <th className="px-5 py-3.5 font-bold">Retries</th>
                    <th className="px-5 py-3.5 font-bold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filtered.map((exec) => {
                    const execId = exec.id || exec._id;
                    return (
                      <tr
                        key={execId}
                        onClick={() => router.push(`/executions/${execId}`)}
                        className="hover:bg-slate-850/60 transition cursor-pointer group"
                      >
                        <td className="px-5 py-4 font-semibold text-white group-hover:text-brand-300 transition">
                          {exec.workflowName || 'Workflow Execution'}
                        </td>
                        <td className="px-5 py-4">{getStatusBadge(exec.status)}</td>
                        <td className="px-5 py-4 text-slate-400 font-mono">
                          {new Date(exec.createdAt).toLocaleString()}
                        </td>
                        <td className="px-5 py-4 text-slate-300 font-mono">
                          {exec.duration ? `${(exec.duration / 1000).toFixed(2)}s` : 'Active'}
                        </td>
                        <td className="px-5 py-4 text-slate-400 font-mono">
                          {exec.retryCount || 0}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="inline-flex items-center space-x-1 text-xs text-brand-400 font-medium group-hover:underline">
                            <span>Inspect Timeline</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
