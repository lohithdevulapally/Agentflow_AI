import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Zap, Clock, Globe, ArrowRight } from 'lucide-react';

function TriggerNode({ data, isSelected }) {
  const getIcon = () => {
    if (data?.provider === 'gmail') return <Globe className="w-4 h-4 text-rose-400" />;
    if (data?.action === 'schedule') return <Clock className="w-4 h-4 text-amber-400" />;
    return <Zap className="w-4 h-4 text-amber-400" />;
  };

  return (
    <div
      className={`px-4 py-3 rounded-2xl bg-slate-900 border transition-all duration-200 min-w-[210px] shadow-xl ${
        isSelected
          ? 'border-amber-400 ring-2 ring-amber-400/30 bg-slate-850'
          : 'border-amber-500/30 hover:border-amber-500/60'
      }`}
    >
      <div className="flex items-center space-x-2.5 mb-1.5">
        <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
          {getIcon()}
        </div>
        <div className="min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 font-mono">
            Trigger
          </span>
          <h4 className="text-xs font-semibold text-white truncate">{data.label || 'Workflow Trigger'}</h4>
        </div>
      </div>

      <p className="text-[11px] text-slate-400 truncate mt-1">
        {data.provider || 'System'} • {data.action || 'manual'}
      </p>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-amber-400 !border-2 !border-slate-950"
      />
    </div>
  );
}

export default memo(TriggerNode);
