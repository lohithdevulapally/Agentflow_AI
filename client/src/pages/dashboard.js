import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Sparkles,
  Plus,
  Play,
  ArrowRight,
  GitBranch,
  PlaySquare,
  Radio,
  Clock,
  CheckCircle2,
  AlertOctagon,
  RefreshCw,
  Zap,
} from 'lucide-react';
import ProtectedRoute from '../components/ProtectedRoute/ProtectedRoute';
import AppShell from '../components/AppShell/AppShell';
import MetricGrid from '../components/MetricGrid/MetricGrid';
import api from '../services/api';
import useWorkflowStore from '../store/workflowStore';

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { triggerExecution } = useWorkflowStore();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/workflows/dashboard');
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (e) {
      console.warn('Error fetching dashboard:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleQuickRun = async (workflowId) => {
    try {
      const res = await api.post(`/workflows/${workflowId}/execute`, {});
      if (res.data.success) {
        const executionId = res.data.data.execution.id || res.data.data.execution._id;
        router.push(`/executions/${executionId}`);
      }
    } catch (e) {
      console.error('Failed to quick run:', e);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">COMPLETED</span>;
      case 'RUNNING':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 animate-pulse">RUNNING</span>;
      case 'RETRYING':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">RETRYING</span>;
      case 'FAILED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">ESCALATED</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">{status}</span>;
    }
  };

  return (
    <ProtectedRoute>
      <AppShell title="Operator Console" subtitle="Autonomous multi-agent automation workspace">
        <div className="space-y-8 max-w-7xl mx-auto">
          {/* Top Metric Grid */}
          <MetricGrid metrics={stats?.metrics} />

          {/* Quick Action Prompt Banner */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-brand-500/30 bg-gradient-to-r from-brand-950/60 via-slate-900/80 to-slate-900 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-brand-500/20 text-brand-300 text-[11px] font-mono font-bold mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Natural Language Workflow Generator</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Describe an automation in plain English
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                Our 3-tier compiler turns your prompt into a drag-and-drop graph configured with Gmail, Slack, Discord, and Google Sheets connectors.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                href="/workflows/builder"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-brand-500/25 transition flex items-center space-x-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Open Prompt Builder</span>
              </Link>
              <Link
                href="/workflows"
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold transition"
              >
                View Catalog
              </Link>
            </div>
          </div>

          {/* Two-Column Grid: Active Workflows & Recent Executions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Automations */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <GitBranch className="w-4 h-4 text-brand-400" />
                    <h3 className="text-sm font-semibold text-white">Active Automations</h3>
                  </div>
                  <Link href="/workflows" className="text-xs text-brand-400 hover:text-brand-300 font-medium">
                    See all
                  </Link>
                </div>

                <div className="space-y-2.5">
                  {stats?.activeWorkflows?.length === 0 && (
                    <div className="text-center py-8 text-slate-500 text-xs">
                      No active workflows found. Create one from the AI builder!
                    </div>
                  )}

                  {stats?.activeWorkflows?.map((wf) => (
                    <div
                      key={wf.id || wf._id}
                      className="p-3.5 rounded-xl bg-slate-850 border border-slate-800/80 hover:border-slate-700 flex items-center justify-between transition"
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        <h4 className="text-xs font-semibold text-white truncate">{wf.name}</h4>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {wf.nodes?.length || 0} nodes • v{wf.version || 1}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleQuickRun(wf.id || wf._id)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold flex items-center space-x-1 transition"
                        >
                          <Play className="w-3 h-3" />
                          <span>Run</span>
                        </button>
                        <Link
                          href={`/workflows/${wf.id || wf._id}`}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition"
                        >
                          Edit
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-800/80">
                <Link
                  href="/workflows/builder"
                  className="w-full py-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center justify-center space-x-1.5 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Workflow</span>
                </Link>
              </div>
            </div>

            {/* Recent Execution Runs */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <PlaySquare className="w-4 h-4 text-purple-400" />
                    <h3 className="text-sm font-semibold text-white">Recent Agent Executions</h3>
                  </div>
                  <Link href="/executions" className="text-xs text-brand-400 hover:text-brand-300 font-medium">
                    View history
                  </Link>
                </div>

                <div className="space-y-2.5">
                  {stats?.recentExecutions?.length === 0 && (
                    <div className="text-center py-8 text-slate-500 text-xs">
                      No executions recorded yet. Trigger a workflow to see live logs!
                    </div>
                  )}

                  {stats?.recentExecutions?.map((exec) => (
                    <Link
                      key={exec.id || exec._id}
                      href={`/executions/${exec.id || exec._id}`}
                      className="p-3.5 rounded-xl bg-slate-850 border border-slate-800/80 hover:border-brand-500/40 flex items-center justify-between transition group"
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-xs font-semibold text-white truncate group-hover:text-brand-300 transition">
                            {exec.workflowName || 'Automation Run'}
                          </h4>
                          {getStatusBadge(exec.status)}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 font-mono">
                          Duration: {exec.duration ? `${(exec.duration / 1000).toFixed(1)}s` : 'active'} • {new Date(exec.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition" />
                    </Link>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-800/80">
                <Link
                  href="/executions"
                  className="w-full py-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center justify-center space-x-1.5 transition"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Open Executions Log</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
