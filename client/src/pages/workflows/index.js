import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  GitBranch,
  Plus,
  Sparkles,
  Search,
  Play,
  Copy,
  Trash2,
  ExternalLink,
  Tag,
  Loader2,
  Clock,
} from 'lucide-react';
import ProtectedRoute from '../../components/ProtectedRoute/ProtectedRoute';
import AppShell from '../../components/AppShell/AppShell';
import api from '../../services/api';

export default function WorkflowsCatalogPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      const res = await api.get('/workflows');
      if (res.data.success) {
        setWorkflows(res.data.workflows);
      }
    } catch (e) {
      console.warn('Failed to fetch workflows:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const handleCreateBlank = async () => {
    try {
      const res = await api.post('/workflows', {
        name: 'Untitled Automation',
        description: 'New workflow graph',
        status: 'draft',
      });
      if (res.data.success) {
        const wfId = res.data.data.id || res.data.data._id;
        router.push(`/workflows/${wfId}`);
      }
    } catch (e) {
      console.error('Failed to create workflow:', e);
    }
  };

  const handleDuplicate = async (id, e) => {
    e.stopPropagation();
    try {
      const res = await api.post(`/workflows/${id}/duplicate`);
      if (res.data.success) {
        fetchWorkflows();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this automation?')) return;
    try {
      await api.delete(`/workflows/${id}`);
      fetchWorkflows();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRun = async (id, e) => {
    e.stopPropagation();
    try {
      const res = await api.post(`/workflows/${id}/execute`, {});
      if (res.data.success) {
        const execId = res.data.data.execution.id || res.data.data.execution._id;
        router.push(`/executions/${execId}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = workflows.filter((w) => {
    const matchesFilter = selectedFilter === 'all' || w.status === selectedFilter;
    const matchesSearch =
      w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <ProtectedRoute>
      <AppShell title="Automations Catalog" subtitle="Manage, version, and monitor all visual workflows">
        <div className="space-y-6 max-w-7xl mx-auto">
          {/* Header Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Search & Filter */}
            <div className="flex items-center space-x-3 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search automations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1">
                {['all', 'active', 'draft'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setSelectedFilter(f)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase transition ${
                      selectedFilter === f
                        ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* CTAs */}
            <div className="flex items-center space-x-3">
              <button
                onClick={handleCreateBlank}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Blank Canvas</span>
              </button>
              <Link
                href="/workflows/builder"
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md shadow-brand-500/20 flex items-center space-x-1.5 transition"
              >
                <Sparkles className="w-4 h-4" />
                <span>AI Prompt Builder</span>
              </Link>
            </div>
          </div>

          {/* Workflows Grid */}
          {loading ? (
            <div className="text-center py-20 text-slate-500">
              <Loader2 className="w-8 h-8 mx-auto animate-spin text-brand-500 mb-2" />
              <p className="text-xs">Loading automations...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 glass-panel rounded-3xl border border-slate-800">
              <GitBranch className="w-10 h-10 mx-auto text-slate-600 mb-3" />
              <h3 className="text-sm font-semibold text-white">No workflows found</h3>
              <p className="text-xs text-slate-400 mt-1 mb-5">Create a blank automation or generate one with AI.</p>
              <Link
                href="/workflows/builder"
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md"
              >
                <Sparkles className="w-4 h-4" />
                <span>Generate with AI</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((wf) => (
                <div
                  key={wf.id || wf._id}
                  onClick={() => router.push(`/workflows/${wf.id || wf._id}`)}
                  className="glass-card p-5 rounded-2xl border border-slate-800 hover:border-brand-500/40 flex flex-col justify-between cursor-pointer group transition duration-150 shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono ${
                          wf.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {wf.status}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">v{wf.version || 1}</span>
                    </div>

                    <h3 className="text-sm font-bold text-white group-hover:text-brand-300 transition truncate">
                      {wf.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {wf.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 font-mono">
                      {wf.nodes?.length || 0} Nodes • {wf.edges?.length || 0} Connections
                    </span>

                    <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => handleRun(wf.id || wf._id, e)}
                        title="Run Now"
                        className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDuplicate(wf.id || wf._id, e)}
                        title="Duplicate"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(wf.id || wf._id, e)}
                        title="Delete"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
