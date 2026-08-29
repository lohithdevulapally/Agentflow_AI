import { useState } from 'react';
import {
  Zap,
  Clock,
  Sparkles,
  BrainCircuit,
  FileText,
  Mail,
  MessageSquare,
  Send,
  Table,
  GitFork,
  Filter,
  Plus,
  Layers,
  Search,
} from 'lucide-react';
import useWorkflowStore from '../../store/workflowStore';

const nodeTemplates = [
  // Triggers
  {
    type: 'trigger',
    category: 'trigger',
    provider: 'system',
    action: 'webhook',
    label: 'Webhook Trigger',
    icon: Zap,
    description: 'Trigger automation on inbound HTTP POST webhook payload',
    defaultConfig: { endpoint: '/api/v1/webhooks/custom', method: 'POST' },
  },
  {
    type: 'trigger',
    category: 'trigger',
    provider: 'system',
    action: 'schedule',
    label: 'Cron Schedule',
    icon: Clock,
    description: 'Trigger automation at regular intervals or fixed times',
    defaultConfig: { cron: '0 9 * * *', timezone: 'UTC' },
  },
  {
    type: 'trigger',
    category: 'trigger',
    provider: 'gmail',
    action: 'read_inbox',
    label: 'New Gmail Arrival',
    icon: Mail,
    description: 'Triggers on new matching emails in your inbox',
    defaultConfig: { filter: 'is:unread label:inbox' },
  },

  // AI Agents
  {
    type: 'ai',
    category: 'ai',
    provider: 'llm',
    action: 'generate_text',
    label: 'AI Reasoning Agent',
    icon: Sparkles,
    description: 'Execute multi-step prompt reasoning using Gemini or Claude',
    defaultConfig: { prompt: 'Analyze context and formulate structured response:', model: 'gemini-1.5-flash' },
  },
  {
    type: 'ai',
    category: 'ai',
    provider: 'llm',
    action: 'classify',
    label: 'AI Intent Classifier',
    icon: BrainCircuit,
    description: 'Classify text or incidents into categories with confidence',
    defaultConfig: { categories: ['Urgent', 'Inquiry', 'Spam'], threshold: 0.8 },
  },
  {
    type: 'ai',
    category: 'ai',
    provider: 'llm',
    action: 'extract_entities',
    label: 'AI Data & Invoice Extractor',
    icon: FileText,
    description: 'Extract structured JSON entities from unstructured text',
    defaultConfig: { prompt: 'Extract vendor, amount, invoice_number, due_date' },
  },

  // Integrations
  {
    type: 'integration',
    category: 'integration',
    provider: 'slack',
    action: 'post_message',
    label: 'Slack Notification',
    icon: MessageSquare,
    description: 'Post automated message or alert to a Slack channel',
    defaultConfig: { channel: '#operations-alerts', message: 'Workflow Event: {{node_1.output}}' },
  },
  {
    type: 'integration',
    category: 'integration',
    provider: 'gmail',
    action: 'send_email',
    label: 'Send Gmail Message',
    icon: Mail,
    description: 'Dispatch automated email from connected Gmail account',
    defaultConfig: { to: 'operator@company.com', subject: 'Automated Agent Alert', body: 'Report payload: {{node_1.output}}' },
  },
  {
    type: 'integration',
    category: 'integration',
    provider: 'discord',
    action: 'send_message',
    label: 'Discord Webhook Bot',
    icon: Send,
    description: 'Stream status alerts and error warnings to Discord channel',
    defaultConfig: { content: '⚡ Alert: {{node_1.output}}', username: 'Agentflow Bot' },
  },
  {
    type: 'integration',
    category: 'integration',
    provider: 'google-sheets',
    action: 'append_row',
    label: 'Google Sheets Row',
    icon: Table,
    description: 'Append automated audit logs or parsed records to sheet',
    defaultConfig: { spreadsheetId: '', range: 'Sheet1!A1', values: ['{{now}}', '{{node_1.output}}'] },
  },

  // Logic
  {
    type: 'logic',
    category: 'logic',
    provider: 'system',
    action: 'condition',
    label: 'Condition / Filter',
    icon: GitFork,
    description: 'Branch workflow execution based on variable conditions',
    defaultConfig: { condition: '{{node_1.output}} !== null' },
  },
];

export default function NodePalette() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { addNodeFromPalette } = useWorkflowStore();

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'trigger', label: 'Triggers' },
    { id: 'ai', label: 'AI' },
    { id: 'integration', label: 'Tools' },
    { id: 'logic', label: 'Logic' },
  ];

  const filtered = nodeTemplates.filter((n) => {
    const matchesCat = selectedCategory === 'all' || n.category === selectedCategory;
    const matchesSearch =
      n.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const onDragStart = (event, template) => {
    event.dataTransfer.setData('application/agentflow-node', JSON.stringify(template));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col h-full shrink-0 select-none">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/40">
        <div className="flex items-center space-x-2 mb-3">
          <Layers className="w-4 h-4 text-brand-400" />
          <h3 className="text-sm font-semibold text-white">Node Palette</h3>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search nodes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-850 border border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>

        {/* Categories Tab */}
        <div className="flex space-x-1 mt-3 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition shrink-0 ${
                selectedCategory === cat.id
                  ? 'bg-brand-500/20 text-brand-300 border border-brand-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Nodes List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <p className="text-[10px] text-slate-500 uppercase font-mono px-1 font-semibold">
          Drag to Canvas or Click to Add
        </p>

        {filtered.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              draggable
              onDragStart={(e) => onDragStart(e, item)}
              onClick={() => addNodeFromPalette(item)}
              className="p-3 rounded-xl bg-slate-850 border border-slate-800/80 hover:border-brand-500/50 hover:bg-slate-800 transition cursor-grab active:cursor-grabbing group shadow-sm"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-700/60 text-brand-400 group-hover:text-brand-300">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-semibold text-slate-200 group-hover:text-white">
                    {item.label}
                  </span>
                </div>
                <Plus className="w-3.5 h-3.5 text-slate-500 opacity-0 group-hover:opacity-100 transition" />
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                {item.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
