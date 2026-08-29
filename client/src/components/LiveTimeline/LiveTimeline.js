import { useState, useRef, useEffect } from 'react';
import {
  Compass,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Activity,
  ChevronDown,
  ChevronRight,
  Clock,
  Terminal,
} from 'lucide-react';

export default function LiveTimeline({ logs = [], isLive = false }) {
  const [expandedLogs, setExpandedLogs] = useState({});
  const bottomRef = useRef(null);

  useEffect(() => {
    if (isLive) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isLive]);

  const toggleExpand = (id) => {
    setExpandedLogs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getAgentBadge = (agent) => {
    switch (agent) {
      case 'planner':
        return {
          label: 'Planner Agent',
          icon: Compass,
          bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          dot: 'bg-amber-400',
        };
      case 'execution':
        return {
          label: 'Execution Agent',
          icon: Zap,
          bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
          dot: 'bg-indigo-400',
        };
      case 'validation':
        return {
          label: 'Validation Agent',
          icon: CheckCircle2,
          bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          dot: 'bg-emerald-400',
        };
      case 'recovery':
        return {
          label: 'Recovery Agent',
          icon: AlertTriangle,
          bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
          dot: 'bg-rose-400',
        };
      case 'monitoring':
      default:
        return {
          label: 'Monitoring Agent',
          icon: Activity,
          bg: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
          dot: 'bg-purple-400',
        };
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-brand-400" />
          <h3 className="text-sm font-semibold text-slate-200">Agentic Orchestration Timeline</h3>
        </div>
        {isLive && (
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-mono font-semibold text-emerald-400">STREAMING</span>
          </div>
        )}
      </div>

      {/* Timeline Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs">
        {logs.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-xs">Awaiting agent event stream...</p>
          </div>
        ) : (
          logs.map((item, idx) => {
            const agentMeta = getAgentBadge(item.agent);
            const Icon = agentMeta.icon;
            const logId = item.id || item._id || idx;
            const isExpanded = Boolean(expandedLogs[logId]);
            const hasMetadata = item.metadata && Object.keys(item.metadata).length > 0;

            return (
              <div
                key={logId}
                className="p-3 rounded-xl bg-slate-850 border border-slate-800/80 hover:border-slate-700 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start space-x-2.5 min-w-0">
                    <span className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-md border text-[10px] font-semibold shrink-0 ${agentMeta.bg}`}>
                      <Icon className="w-3 h-3" />
                      <span>{agentMeta.label}</span>
                    </span>
                    <p className="text-slate-200 font-sans text-xs leading-relaxed break-words mt-0.5">
                      {item.message}
                    </p>
                  </div>

                  <span className="text-[10px] text-slate-500 shrink-0 font-mono">
                    {item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : ''}
                  </span>
                </div>

                {/* Collapsible Metadata Drawer */}
                {hasMetadata && (
                  <div className="mt-2 pt-2 border-t border-slate-800/60">
                    <button
                      onClick={() => toggleExpand(logId)}
                      className="flex items-center space-x-1 text-[11px] text-brand-400 hover:text-brand-300 font-sans font-medium"
                    >
                      {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                      <span>{isExpanded ? 'Hide Payload' : 'View Payload & Contracts'}</span>
                    </button>

                    {isExpanded && (
                      <pre className="mt-2 p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-[10px] text-slate-300 overflow-x-auto">
                        {JSON.stringify(item.metadata, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
