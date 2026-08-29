import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { PlayCircle, Terminal, Send } from 'lucide-react';

function ActionNode({ data, isSelected }) {
  return (
    <div
      className={`px-4 py-3 rounded-2xl bg-slate-900 border transition-all duration-200 min-w-[210px] shadow-xl ${
        isSelected
          ? 'border-indigo-400 ring-2 ring-indigo-400/30 bg-slate-850'
          : 'border-indigo-500/30 hover:border-indigo-500/60'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-indigo-400 !border-2 !border-slate-950"
      />

      <div className="flex items-center space-x-2.5 mb-1.5">
        <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
          <PlayCircle className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 font-mono">
            Action
          </span>
          <h4 className="text-xs font-semibold text-white truncate">{data.label || 'Action Step'}</h4>
        </div>
      </div>

      <p className="text-[11px] text-slate-400 truncate mt-1">
        {data.action || 'Execute'}
      </p>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-indigo-400 !border-2 !border-slate-950"
      />
    </div>
  );
}

export default memo(ActionNode);
