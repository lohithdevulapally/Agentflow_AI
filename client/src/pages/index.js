import Link from 'next/link';
import {
  Zap,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Compass,
  CheckCircle2,
  AlertTriangle,
  Activity,
  PlaySquare,
  Lock,
  GitBranch,
  Table,
  Mail,
  MessageSquare,
} from 'lucide-react';
import useAuthStore from '../store/authStore';

export default function LandingPage() {
  const { isAuthenticated } = useAuthStore();

  const agents = [
    {
      name: 'Planner Agent',
      icon: Compass,
      color: 'from-amber-500 to-orange-500',
      badge: 'Step 1',
      desc: 'Performs topological sort, verifies node inputs, and assigns an execution confidence score.',
    },
    {
      name: 'Execution Agent',
      icon: Zap,
      color: 'from-indigo-500 to-blue-500',
      badge: 'Step 2',
      desc: 'Dispatches payload expressions to Gmail, Slack, Discord, Google Sheets, or AI LLMs.',
    },
    {
      name: 'Validation Agent',
      icon: CheckCircle2,
      color: 'from-emerald-500 to-teal-500',
      badge: 'Step 3',
      desc: 'Validates return contracts, ensures mandatory fields exist, and prevents data corruption.',
    },
    {
      name: 'Recovery Agent',
      icon: AlertTriangle,
      color: 'from-rose-500 to-red-500',
      badge: 'Step 4',
      desc: 'Classifies upstream failures (Rate Limit, Auth Expired, Transient) and orchestrates backoff retries.',
    },
    {
      name: 'Monitoring Agent',
      icon: Activity,
      color: 'from-purple-500 to-indigo-500',
      badge: 'Step 5',
      desc: 'Emits granular telemetry and live Socket.IO timeline updates to the operator console.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-brand-500 selection:text-white">
      {/* Navigation */}
      <header className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between border-b border-slate-800/80">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-brand-500/30 ring-1 ring-white/20">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Agentflow<span className="text-brand-400 font-extrabold">.AI</span>
          </span>
        </div>

        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold shadow-lg shadow-brand-500/20 transition flex items-center space-x-2"
            >
              <span>Operator Console</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold shadow-lg shadow-brand-500/20 transition"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-300 text-xs font-semibold mb-6">
          <Sparkles className="w-4 h-4 text-brand-400" />
          <span>Spec-Driven Agentic Automation Platform</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-[1.15]">
          Turn Natural Language Prompts into{' '}
          <span className="bg-gradient-to-r from-brand-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
            Autonomous Multi-Agent Workflows
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
          Describe what you want to automate. Watch Agentflow convert your words into visual React Flow
          graphs, orchestrated live across 5 cooperating specialized agents with real-time Socket.IO streaming.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href={isAuthenticated ? '/dashboard' : '/register'}
            className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-base shadow-xl shadow-brand-500/25 transition-all hover:scale-[1.02] flex items-center space-x-2"
          >
            <Sparkles className="w-5 h-5" />
            <span>Generate Automations with AI</span>
          </Link>
          <Link
            href="/dashboard"
            className="px-7 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 font-semibold text-base transition flex items-center space-x-2"
          >
            <PlaySquare className="w-5 h-5 text-brand-400" />
            <span>Open Operator Console</span>
          </Link>
        </div>
      </section>

      {/* 5 Cooperating Agents Architecture Showcase */}
      <section className="max-w-7xl mx-auto px-6 py-16 border-t border-slate-850">
        <div className="text-center mb-12">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-brand-400">
            Engine Architecture
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mt-2">
            5-Agent Cooperating Orchestration Chain
          </h2>
          <p className="text-slate-400 text-sm max-w-2xl mx-auto mt-2">
            Every workflow execution is coordinated through a deterministic chain of specialized AI agents.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {agents.map((agent, i) => {
            const Icon = agent.icon;
            return (
              <div
                key={agent.name}
                className="glass-card p-5 rounded-2xl border border-slate-800 flex flex-col justify-between relative overflow-hidden group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-2.5 rounded-xl bg-gradient-to-br ${agent.color} text-white shadow-md`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-slate-500 px-2 py-0.5 rounded-md bg-slate-800">
                      {agent.badge}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white mb-2">{agent.name}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{agent.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Integrated Tools */}
      <section className="max-w-7xl mx-auto px-6 py-16 border-t border-slate-850">
        <div className="text-center mb-10">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-brand-400">
            Native Connectors
          </span>
          <h2 className="text-2xl font-bold text-white mt-2">
            Integrate Real Work Tools with AES Encryption
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <div className="glass-card p-4 rounded-xl border border-slate-800 flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white">Gmail</h4>
              <p className="text-[11px] text-slate-400">Send & Read Mail</p>
            </div>
          </div>

          <div className="glass-card p-4 rounded-xl border border-slate-800 flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white">Slack</h4>
              <p className="text-[11px] text-slate-400">Channel Alerts</p>
            </div>
          </div>

          <div className="glass-card p-4 rounded-xl border border-slate-800 flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white">Discord</h4>
              <p className="text-[11px] text-slate-400">Bot Webhooks</p>
            </div>
          </div>

          <div className="glass-card p-4 rounded-xl border border-slate-800 flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-green-500/10 text-green-400">
              <Table className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white">Google Sheets</h4>
              <p className="text-[11px] text-slate-400">Append & Read Rows</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-850 py-8 px-6 text-center text-xs text-slate-500">
        <p>© 2026 Agentflow.AI Platform. Built with Spec-Driven Development (SDD).</p>
      </footer>
    </div>
  );
}
