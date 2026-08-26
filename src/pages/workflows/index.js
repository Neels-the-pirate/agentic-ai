import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  GitFork,
  Plus,
  Sparkles,
  Search,
  Copy,
  Trash2,
  Play,
  ArrowRight,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import ProtectedRoute from '../../components/ProtectedRoute/ProtectedRoute';
import AppShell from '../../components/AppShell/AppShell';
import api from '../../services/api';

export default function WorkflowsListPage() {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      const res = await api.get('/workflows', {
        params: { search, status: statusFilter },
      });
      setWorkflows(res.data.workflows || []);
    } catch (err) {
      console.error('Failed to load workflows:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, [search, statusFilter]);

  const handleDuplicate = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await api.post(`/workflows/${id}/duplicate`);
      fetchWorkflows();
    } catch (err) {
      alert('Failed to duplicate workflow');
    }
  };

  const handleDelete = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this workflow?')) return;
    try {
      await api.delete(`/workflows/${id}`);
      fetchWorkflows();
    } catch (err) {
      alert('Failed to delete workflow');
    }
  };

  const handleExecute = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await api.post(`/workflows/${id}/execute`, { inputs: { triggeredVia: 'workflows_table' } });
      window.location.href = `/executions/${res.data.execution._id}`;
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to trigger execution');
    }
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">Automation Workflows</h1>
              <p className="text-xs text-slate-400 mt-1">Manage, trigger, and edit visual graph automations.</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/workflows/builder"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition"
              >
                <Sparkles className="h-4 w-4" />
                <span>AI Prompt Builder</span>
              </Link>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row items-center gap-3 bg-[#0f172a] p-3 rounded-2xl border border-slate-800">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search workflows by name or description..."
                className="w-full rounded-xl bg-slate-900 border border-slate-800 pl-10 pr-4 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-44 rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="paused">Paused</option>
            </select>
          </div>

          {/* Workflows Grid / Table */}
          {loading ? (
            <div className="text-center py-20 text-slate-500 text-sm">Loading workflows...</div>
          ) : workflows.length === 0 ? (
            <div className="p-12 text-center bg-[#0f172a] rounded-3xl border border-slate-800 text-slate-500">
              <GitFork className="h-10 w-10 mx-auto mb-3 opacity-30 text-indigo-400" />
              <p className="text-sm font-semibold text-white">No workflows found</p>
              <p className="text-xs text-slate-400 mt-1">Generate your first workflow from a prompt or create one on the canvas.</p>
              <Link
                href="/workflows/builder"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 transition"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Create with AI</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {workflows.map((wf) => (
                <div
                  key={wf._id}
                  className="p-6 rounded-3xl bg-[#0f172a] border border-slate-800 hover:border-indigo-500/40 shadow-xl flex flex-col justify-between transition duration-200 group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wider">
                        v{wf.version || 1} &bull; {wf.status}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {new Date(wf.updatedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white mt-3 group-hover:text-indigo-400 transition truncate">
                      {wf.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {wf.description || 'No description provided.'}
                    </p>

                    <div className="flex flex-wrap gap-1.5 mt-4">
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-400">
                        {wf.nodes?.length || 0} nodes
                      </span>
                      {wf.tags?.map((t, idx) => (
                        <span key={idx} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-500">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => handleExecute(e, wf._id)}
                        title="Trigger Execution"
                        className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition"
                      >
                        <Play className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDuplicate(e, wf._id)}
                        title="Duplicate"
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, wf._id)}
                        title="Delete"
                        className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <Link
                      href={`/workflows/${wf._id}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-400 text-xs font-semibold transition"
                    >
                      <span>Edit Canvas</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
