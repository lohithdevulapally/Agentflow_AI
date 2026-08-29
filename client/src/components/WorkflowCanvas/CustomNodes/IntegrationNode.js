import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Mail, MessageSquare, Send, Table, Globe } from 'lucide-react';

function IntegrationNode({ data, isSelected }) {
  const getProviderIcon = (provider) => {
    switch (provider) {
      case 'gmail':
        return <Mail className="w-4 h-4 text-rose-400" />;
      case 'slack':
        return <MessageSquare className="w-4 h-4 text-emerald-400" />;
      case 'discord':
        return <Send className="w-4 h-4 text-indigo-400" />;
      case 'google-sheets':
        return <Table className="w-4 h-4 text-green-400" />;
      default:
        return <Globe className="w-4 h-4 text-blue-400" />;
    }
  };

  const getBorderColor = (provider) => {
    switch (provider) {
      case 'gmail':
        return 'border-rose-500/40 hover:border-rose-400';
      case 'slack':
        return 'border-emerald-500/40 hover:border-emerald-400';
      case 'discord':
        return 'border-indigo-500/40 hover:border-indigo-400';
      case 'google-sheets':
        return 'border-green-500/40 hover:border-green-400';
      default:
        return 'border-blue-500/40 hover:border-blue-400';
    }
  };

  return (
    <div
      className={`px-4 py-3 rounded-2xl bg-slate-900 border transition-all duration-200 min-w-[220px] shadow-xl ${
        isSelected
          ? 'border-brand-400 ring-2 ring-brand-400/40 bg-slate-850'
          : getBorderColor(data.provider)
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-brand-400 !border-2 !border-slate-950"
      />

      <div className="flex items-center space-x-2.5 mb-1.5">
        <div className="p-1.5 rounded-lg bg-slate-800 border border-slate-700">
          {getProviderIcon(data.provider)}
        </div>
        <div className="min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
            {data.provider || 'Integration'}
          </span>
          <h4 className="text-xs font-semibold text-white truncate">{data.label || 'Tool Action'}</h4>
        </div>
      </div>

      <p className="text-[11px] text-slate-400 truncate mt-1">
        {data.action || 'Execute'} {data.config?.channel || data.config?.to ? `(${data.config.channel || data.config.to})` : ''}
      </p>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-brand-400 !border-2 !border-slate-950"
      />
    </div>
  );
}

export default memo(IntegrationNode);
