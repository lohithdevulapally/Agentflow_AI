import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  Save,
  Play,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Sparkles,
  Layers,
  ChevronLeft,
  ChevronRight,
  Sliders,
  Radio,
  FileCode,
} from 'lucide-react';
import ProtectedRoute from '../../components/ProtectedRoute/ProtectedRoute';
import WorkflowCanvas from '../../components/WorkflowCanvas/WorkflowCanvas';
import NodePalette from '../../components/NodePalette/NodePalette';
import NodeConfigPanel from '../../components/NodeConfigPanel/NodeConfigPanel';
import useWorkflowStore from '../../store/workflowStore';

export default function WorkflowEditorPage() {
  const router = useRouter();
  const { id } = router.query;
  const {
    workflow,
    loadWorkflow,
    saveWorkflow,
    triggerExecution,
    isLoading,
    isSaving,
    isExecuting,
    selectedNode,
  } = useWorkflowStore();

  const [workflowName, setWorkflowName] = useState('');
  const [workflowStatus, setWorkflowStatus] = useState('draft');
  const [isPaletteOpen, setIsPaletteOpen] = useState(true);
  const [saveToast, setSaveToast] = useState(false);

  useEffect(() => {
    if (id) {
      loadWorkflow(id).then((wf) => {
        if (wf) {
          setWorkflowName(wf.name);
          setWorkflowStatus(wf.status || 'draft');
        }
      });
    }
  }, [id, loadWorkflow]);

  const handleSave = async () => {
    const updated = await saveWorkflow({
      name: workflowName,
      status: workflowStatus,
    });
    if (updated) {
      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 2500);
    }
  };

  const handleExecute = async () => {
    const execution = await triggerExecution({});
    if (execution) {
      const execId = execution.id || execution._id;
      router.push(`/executions/${execId}`);
    }
  };

  return (
    <ProtectedRoute>
      <div className="h-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans select-none">
        {/* Editor Top Navigation Bar */}
        <header className="h-16 bg-slate-900/90 border-b border-slate-800/80 px-5 flex items-center justify-between backdrop-blur-xl shrink-0 z-30">
          <div className="flex items-center space-x-4">
            <Link
              href="/workflows"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Back to Catalog"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div className="flex items-center space-x-3">
              <input
                type="text"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                placeholder="Workflow Name"
                className="bg-transparent font-bold text-sm text-white focus:outline-none focus:bg-slate-850 px-2.5 py-1 rounded-lg border border-transparent focus:border-brand-500/50 transition w-64 truncate"
              />

              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 font-mono text-[11px]">
                v{workflow?.version || 1}
              </span>

              <select
                value={workflowStatus}
                onChange={(e) => setWorkflowStatus(e.target.value)}
                className="bg-slate-850 border border-slate-700 text-slate-300 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-brand-500"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            {saveToast && (
              <span className="flex items-center space-x-1 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 animate-in fade-in">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Saved</span>
              </span>
            )}

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Save</span>
            </button>

            <button
              onClick={handleExecute}
              disabled={isExecuting}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 flex items-center space-x-1.5 transition disabled:opacity-50"
            >
              {isExecuting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              <span>Execute Flow</span>
            </button>
          </div>
        </header>

        {/* Editor Main Canvas Body */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Collapsible Left Node Palette */}
          {isPaletteOpen && <NodePalette />}

          {/* Palette Toggle Button */}
          <button
            onClick={() => setIsPaletteOpen(!isPaletteOpen)}
            className="absolute left-2 top-4 z-20 p-1.5 rounded-lg bg-slate-800/90 text-slate-400 hover:text-white border border-slate-700 shadow-md backdrop-blur-md transition"
            title={isPaletteOpen ? 'Collapse Palette' : 'Open Palette'}
          >
            {isPaletteOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>

          {/* Center React Flow Canvas */}
          <main className="flex-1 h-full relative">
            {isLoading ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-brand-500 mb-2" />
                <p className="text-xs">Loading workflow graph...</p>
              </div>
            ) : (
              <WorkflowCanvas />
            )}
          </main>

          {/* Right Selected Node Config Panel */}
          {selectedNode && <NodeConfigPanel />}
        </div>
      </div>
    </ProtectedRoute>
  );
}
