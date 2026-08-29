import { useState, useEffect } from 'react';
import { X, Trash2, Sliders, Info, Sparkles, Check } from 'lucide-react';
import useWorkflowStore from '../../store/workflowStore';

export default function NodeConfigPanel() {
  const { selectedNode, setSelectedNode, updateNodeData, deleteNode, nodes } = useWorkflowStore();
  const [label, setLabel] = useState('');
  const [config, setConfig] = useState({});

  useEffect(() => {
    if (selectedNode) {
      setLabel(selectedNode.data?.label || '');
      setConfig(selectedNode.data?.config || {});
    }
  }, [selectedNode]);

  if (!selectedNode) return null;

  const handleConfigChange = (key, value) => {
    const updated = { ...config, [key]: value };
    setConfig(updated);
    updateNodeData(selectedNode.id, { config: updated });
  };

  const handleLabelChange = (newLabel) => {
    setLabel(newLabel);
    updateNodeData(selectedNode.id, { label: newLabel });
  };

  const insertVariable = (key, varName) => {
    const current = config[key] || '';
    handleConfigChange(key, `${current} {{${varName}}}`);
  };

  const availableVariables = nodes
    .filter((n) => n.id !== selectedNode.id)
    .map((n) => `${n.id}.output`);

  const { data } = selectedNode;
  const category = data?.category || selectedNode.type;
  const provider = data?.provider;

  return (
    <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col h-full shrink-0 shadow-2xl z-20 animate-in slide-in-from-right duration-150">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
        <div className="flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-brand-400" />
          <h3 className="text-sm font-semibold text-white">Node Properties</h3>
        </div>
        <button
          onClick={() => setSelectedNode(null)}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Node ID & Badges */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-mono">{selectedNode.id}</span>
          <span className="px-2 py-0.5 rounded-md bg-brand-500/20 text-brand-300 font-mono text-[10px] font-bold uppercase">
            {provider || category}
          </span>
        </div>

        {/* Node Label */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Step Label</label>
          <input
            type="text"
            value={label}
            onChange={(e) => handleLabelChange(e.target.value)}
            className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
          />
        </div>

        {/* Dynamic Config Fields based on node type */}
        {/* 1. Gmail Fields */}
        {provider === 'gmail' && data?.action === 'send_email' && (
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">To Email Address</label>
              <input
                type="text"
                placeholder="operator@company.com"
                value={config.to || ''}
                onChange={(e) => handleConfigChange('to', e.target.value)}
                className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Subject</label>
              <input
                type="text"
                placeholder="Alert: {{node_1.output}}"
                value={config.subject || ''}
                onChange={(e) => handleConfigChange('subject', e.target.value)}
                className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email Body Content</label>
              <textarea
                rows={4}
                value={config.body || ''}
                onChange={(e) => handleConfigChange('body', e.target.value)}
                className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>
          </div>
        )}

        {/* 2. Slack Fields */}
        {provider === 'slack' && (
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Slack Channel</label>
              <input
                type="text"
                placeholder="#operations-alerts"
                value={config.channel || ''}
                onChange={(e) => handleConfigChange('channel', e.target.value)}
                className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Message Template</label>
              <textarea
                rows={4}
                value={config.message || ''}
                onChange={(e) => handleConfigChange('message', e.target.value)}
                className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>
          </div>
        )}

        {/* 3. Discord Fields */}
        {provider === 'discord' && (
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Message Content</label>
              <textarea
                rows={3}
                value={config.content || ''}
                onChange={(e) => handleConfigChange('content', e.target.value)}
                className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>
          </div>
        )}

        {/* 4. Google Sheets Fields */}
        {provider === 'google-sheets' && (
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Spreadsheet ID</label>
              <input
                type="text"
                placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                value={config.spreadsheetId || ''}
                onChange={(e) => handleConfigChange('spreadsheetId', e.target.value)}
                className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Target Range</label>
              <input
                type="text"
                placeholder="Sheet1!A1"
                value={config.range || ''}
                onChange={(e) => handleConfigChange('range', e.target.value)}
                className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>
        )}

        {/* 5. AI Fields */}
        {(category === 'ai' || provider === 'llm') && (
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">AI Prompt / Instruction</label>
              <textarea
                rows={4}
                value={config.prompt || config.instruction || ''}
                onChange={(e) => handleConfigChange('prompt', e.target.value)}
                className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Model Selection</label>
              <select
                value={config.model || 'gemini-1.5-flash'}
                onChange={(e) => handleConfigChange('model', e.target.value)}
                className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              >
                <option value="gemini-1.5-flash">Google Gemini 1.5 Flash</option>
                <option value="claude-3.5-sonnet">Claude 3.5 Sonnet (OpenRouter)</option>
                <option value="gpt-4o-mini">GPT-4o Mini</option>
              </select>
            </div>
          </div>
        )}

        {/* 6. Logic / Condition */}
        {category === 'logic' && (
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Condition Expression</label>
              <input
                type="text"
                placeholder="{{node_1.output}} !== null"
                value={config.condition || ''}
                onChange={(e) => handleConfigChange('condition', e.target.value)}
                className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>
          </div>
        )}

        {/* Variable Reference Helper */}
        {availableVariables.length > 0 && (
          <div className="pt-2 border-t border-slate-800">
            <div className="flex items-center space-x-1.5 mb-1.5 text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              <span className="text-[11px] font-semibold">Available Upstream Outputs</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {availableVariables.map((v) => (
                <button
                  key={v}
                  onClick={() => {
                    const firstKey = Object.keys(config)[0] || 'prompt';
                    insertVariable(firstKey, v);
                  }}
                  className="px-2 py-1 bg-slate-800 hover:bg-brand-600/30 text-brand-300 border border-slate-700 rounded-lg text-[10px] font-mono transition"
                >
                  +{`{{${v}}}`}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer / Delete */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <button
          onClick={() => deleteNode(selectedNode.id)}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete Node</span>
        </button>
      </div>
    </div>
  );
}
