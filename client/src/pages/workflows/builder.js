import { useState } from 'react';
import { useRouter } from 'next/router';
import {
  Sparkles,
  ArrowRight,
  Loader2,
  GitBranch,
  Zap,
  CheckCircle2,
  Layers,
  Wand2,
  Copy,
  Terminal,
} from 'lucide-react';
import ProtectedRoute from '../../components/ProtectedRoute/ProtectedRoute';
import AppShell from '../../components/AppShell/AppShell';
import api from '../../services/api';

export default function AIWorkflowBuilderPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState(
    'When a new invoice arrives via Gmail, extract the total amount and vendor name with AI, post an alert in Slack channel #finance-alerts, and append an audit row to Google Sheets.'
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedGraph, setGeneratedGraph] = useState(null);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const presets = [
    {
      title: 'Invoice Extraction & Multi-Channel Alert',
      prompt: 'When a new invoice arrives via Gmail, extract the total amount and vendor name with AI, post an alert in Slack channel #finance-alerts, and append an audit row to Google Sheets.',
    },
    {
      title: 'Customer Feedback Sentiment & Escalation',
      prompt: 'Listen for new customer webhook events, run AI sentiment classification, and if negative send an urgent escalation to Discord and dispatch an email to the support manager.',
    },
    {
      title: 'Gmail to Slack Operations Digest',
      prompt: 'Monitor incoming Gmail messages matching label:inbox, summarize key action items using AI, and broadcast the digest into Slack #operations.',
    },
    {
      title: 'Scheduled Audit & Sheet Logger',
      prompt: 'Run every day at 9:00 AM on schedule, compile daily system telemetry, and append the status record into Google Sheets.',
    },
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setError(null);
    try {
      const res = await api.post('/workflows/generate', { prompt });
      if (res.data.success) {
        setGeneratedGraph(res.data.data);
      }
    } catch (e) {
      setError(e.response?.data?.error?.message || 'Failed to generate workflow. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveAndOpen = async () => {
    if (!generatedGraph) return;
    setIsSaving(true);
    try {
      const res = await api.post('/workflows', {
        name: generatedGraph.name || 'AI Generated Automation',
        description: generatedGraph.description || `Prompt: ${prompt}`,
        nodes: generatedGraph.nodes || [],
        edges: generatedGraph.edges || [],
        tags: generatedGraph.tags || ['ai-generated'],
        status: 'active',
      });
      if (res.data.success) {
        const wfId = res.data.data.id || res.data.data._id;
        router.push(`/workflows/${wfId}`);
      }
    } catch (e) {
      setError(e.response?.data?.error?.message || 'Failed to save workflow.');
      setIsSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <AppShell title="AI Workflow Generator" subtitle="Compile natural language descriptions into executable graphs">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Top Prompt Section */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-brand-500/30 shadow-2xl">
            <div className="flex items-center space-x-2 mb-3">
              <Sparkles className="w-5 h-5 text-brand-400" />
              <h2 className="text-base font-bold text-white">Describe Your Automation</h2>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Our 3-tier compiler processes your prompt through OpenRouter, Google Gemini, or the deterministic compiler fallback.
            </p>

            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. When a support email arrives, summarize it and post to Slack..."
              className="w-full bg-slate-900 border border-slate-700/80 rounded-2xl p-4 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition shadow-inner font-sans"
            />

            {/* Presets Chips */}
            <div className="mt-4 flex flex-wrap gap-2 items-center">
              <span className="text-[11px] text-slate-500 font-semibold uppercase">Presets:</span>
              {presets.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => setPrompt(preset.prompt)}
                  className="px-3 py-1.5 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-750 text-[11px] font-medium transition"
                >
                  {preset.title}
                </button>
              ))}
            </div>

            {/* Generate Action Button */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-brand-500/25 transition flex items-center space-x-2 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Compiling Multi-Agent Graph...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    <span>Generate Graph with AI</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Error display */}
          {error && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Generated Result Preview */}
          {generatedGraph && (
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center space-x-3">
                    <h3 className="text-base font-bold text-white">{generatedGraph.name}</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30">
                      {generatedGraph.generatorSource || 'AI Compiler'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{generatedGraph.description}</p>
                </div>

                <button
                  onClick={handleSaveAndOpen}
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/20 transition flex items-center space-x-2 shrink-0 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving to Canvas...</span>
                    </>
                  ) : (
                    <>
                      <span>Open in Visual Canvas</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {/* Generated Nodes Flow Pipeline Display */}
              <div>
                <h4 className="text-xs font-semibold uppercase text-slate-400 font-mono mb-3">
                  Compiled Graph Sequence ({generatedGraph.nodes?.length || 0} Nodes)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {generatedGraph.nodes?.map((node, i) => (
                    <div
                      key={node.id}
                      className="p-4 rounded-2xl bg-slate-850 border border-slate-800 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-mono font-bold text-slate-500">
                            STEP {i + 1}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] font-mono font-semibold text-brand-300 uppercase">
                            {node.data?.category || node.type}
                          </span>
                        </div>
                        <h5 className="text-xs font-semibold text-white">{node.data?.label || node.id}</h5>
                        <p className="text-[11px] text-slate-400 mt-1">
                          {node.data?.provider} • {node.data?.action}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Raw JSON Inspect */}
              <div className="pt-4 border-t border-slate-800">
                <div className="flex items-center space-x-2 text-slate-400 text-xs mb-2">
                  <Terminal className="w-3.5 h-3.5" />
                  <span className="font-mono font-semibold">Graph JSON Definition</span>
                </div>
                <pre className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-48">
                  {JSON.stringify(generatedGraph, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
