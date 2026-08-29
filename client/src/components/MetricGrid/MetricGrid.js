import { GitBranch, PlaySquare, CheckCircle, Flame, ShieldAlert, Cpu } from 'lucide-react';

export default function MetricGrid({ metrics = {} }) {
  const cards = [
    {
      title: 'Total Automations',
      value: metrics.totalWorkflows || 0,
      sub: `${metrics.activeWorkflows || 0} active now`,
      icon: GitBranch,
      color: 'from-blue-500/20 to-indigo-500/20',
      iconColor: 'text-indigo-400',
      borderColor: 'border-indigo-500/30',
    },
    {
      title: 'Total Executions',
      value: metrics.totalExecutions || 0,
      sub: `${metrics.completedExecutions || 0} completed`,
      icon: PlaySquare,
      color: 'from-purple-500/20 to-pink-500/20',
      iconColor: 'text-purple-400',
      borderColor: 'border-purple-500/30',
    },
    {
      title: 'Agent Success Rate',
      value: `${metrics.successRate ?? 100}%`,
      sub: `${metrics.failedExecutions || 0} escalations`,
      icon: CheckCircle,
      color: 'from-emerald-500/20 to-teal-500/20',
      iconColor: 'text-emerald-400',
      borderColor: 'border-emerald-500/30',
    },
    {
      title: 'Agentic Substrate',
      value: 'LangGraph Ready',
      sub: '5 Cooperating Agents',
      icon: Cpu,
      color: 'from-amber-500/20 to-orange-500/20',
      iconColor: 'text-amber-400',
      borderColor: 'border-amber-500/30',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`glass-card p-5 rounded-2xl border ${card.borderColor} relative overflow-hidden group`}
          >
            {/* Ambient Background Gradient */}
            <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-gradient-to-br ${card.color} blur-xl group-hover:scale-125 transition duration-500`} />

            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {card.title}
              </span>
              <div className={`p-2 rounded-xl bg-slate-800/80 ${card.iconColor}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold tracking-tight text-white">{card.value}</span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-medium">{card.sub}</p>
          </div>
        );
      })}
    </div>
  );
}
