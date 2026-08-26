import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  Play,
  Copy,
  Trash2,
  Sliders,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Tag,
} from 'lucide-react';
import ProtectedRoute from '../../components/ProtectedRoute/ProtectedRoute';
import AppShell from '../../components/AppShell/AppShell';
import WorkflowCanvas from '../../components/WorkflowCanvas/WorkflowCanvas';
import NodePalette from '../../components/NodePalette/NodePalette';
import NodeConfigPanel from '../../components/NodeConfigPanel/NodeConfigPanel';
import { useWorkflowStore } from '../../store/workflowStore';
import api from '../../services/api';

export default function WorkflowEditorPage() {
  const router = useRouter();
  const { id } = router.query;
  const { workflow, nodes, edges, setWorkflow, isDirty } = useWorkflowStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDesc, setWorkflowDesc] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  const fetchWorkflow = async (workflowId) => {
    try {
      setLoading(true);
      const res = await api.get(`/workflows/${workflowId}`);
      const wf = res.data.workflow;
      setWorkflow(wf);
      setWorkflowName(wf.name);
      setWorkflowDesc(wf.description || '');
    } catch (err) {
      console.error('Failed to load workflow:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchWorkflow(id);
    }
  }, [id]);

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    setSaveMessage('');
    try {
      const res = await api.put(`/workflows/${id}`, {
        name: workflowName,
        description: workflowDesc,
        nodes,
        edges,
      });
      setWorkflow(res.data.workflow);
      setSaveMessage('Workflow saved');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err) {
      alert('Failed to save workflow changes');
    } finally {
      setSaving(false);
    }
  };

  const handleExecute = async () => {
    if (!id) return;
    setExecuting(true);
    try {
      // If dirty, save first
      if (isDirty) {
        await api.put(`/workflows/${id}`, { name: workflowName, description: workflowDesc, nodes, edges });
      }
      const res = await api.post(`/workflows/${id}/execute`, {
        inputs: { source: 'editor_manual_trigger', triggeredAt: new Date().toISOString() },
      });
      router.push(`/executions/${res.data.execution._id}`);
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to trigger execution run');
    } finally {
      setExecuting(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <AppShell>
          <div className="flex h-[calc(100vh-4rem)] items-center justify-center text-slate-500 text-sm">
            <RefreshCw className="h-5 w-5 animate-spin mr-2 text-indigo-400" />
            <span>Loading visual workflow editor...</span>
          </div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden bg-[#090d16]">
          {/* Top Control Bar */}
          <div className="h-16 px-6 border-b border-slate-800 bg-[#0f172a] flex items-center justify-between z-20">
            <div className="flex items-center gap-4 min-w-0">
              <Link
                href="/workflows"
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div className="min-w-0">
                <input
                  type="text"
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  className="text-sm font-bold text-white bg-transparent border-b border-transparent hover:border-slate-700 focus:border-indigo-500 focus:outline-none transition max-w-xs sm:max-w-md truncate"
                />
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span>Version {workflow?.version || 1}</span>
                  <span>&bull;</span>
                  <span className="text-emerald-400 capitalize">{workflow?.status || 'active'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {saveMessage && (
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {saveMessage}
                </span>
              )}

              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
              >
                {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                <span>Save</span>
              </button>

              <button
                onClick={handleExecute}
                disabled={executing}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
              >
                {executing ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                <span>Execute Graph</span>
              </button>
            </div>
          </div>

          {/* 3-Pane Editor Layout */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left: Node Palette */}
            <NodePalette />

            {/* Center: React Flow Canvas */}
            <div className="flex-1 h-full relative">
              <WorkflowCanvas />
            </div>

            {/* Right: Node Config Panel */}
            <NodeConfigPanel />
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
