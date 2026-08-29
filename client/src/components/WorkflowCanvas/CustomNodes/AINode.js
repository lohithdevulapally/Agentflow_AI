import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Sparkles, BrainCircuit, FileText } from 'lucide-react';

function AINode({ data, isSelected }) {
  return (
    <div
      className={`px-4 py-3 rounded-2xl bg-slate-900 border transition-all duration-200 min-w-[220px] shadow-xl ${
        isSelected
          ? 'border-purple-400 ring-2 ring-purple-400/30 bg-slate-850'
          : 'border-purple-500/30 hover:border-purple-500/60'
      }`}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-purple-400 !border-2 !border-slate-950"
      />

      <div className="flex items-center space-x-2.5 mb-1.5">
        <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 font-mono">
            AI Agent
          </span>
          <h4 className="text-xs font-semibold text-white truncate">{data.label || 'AI Transformation'}</h4>
        </div>
      </div>

      <p className="text-[11px] text-slate-400 truncate mt-1">
        {data.action || 'LLM Generation'} {data.config?.model ? `(${data.config.model})` : ''}
      </p>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-purple-400 !border-2 !border-slate-950"
      />
    </div>
  );
}

export default memo(AINode);
