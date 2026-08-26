import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  GitFork,
  PlayCircle,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Plus,
  RefreshCw,
} from 'lucide-react';
import ProtectedRoute from '../components/ProtectedRoute/ProtectedRoute';
import AppShell from '../components/AppShell/AppShell';
import MetricGrid from '../components/MetricGrid/MetricGrid';
import api from '../services/api';

export default function DashboardPage() {
  const [data, setData] = useState({
    metrics: {},
    recentExecutions: [],
    recentWorkflows: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/workflows/dashboard');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">COMPLETED</span>;
      case 'RUNNING':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 animate-pulse">RUNNING</span>;
      case 'RETRYING':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">RETRYING</span>;
      case 'FAILED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">FAILED</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400">{status}</span>;
    }
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-8">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 p-6 rounded-3xl border border-indigo-500/20 shadow-xl">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Operator Overview</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">Multi-Agent Control Center</h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">Monitor autonomous graph executions, retry backoffs, and integration health.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchDashboardData}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700"
                title="Refresh dashboard"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <Link
                href="/workflows/builder"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition"
              >
                <Sparkles className="h-4 w-4" />
                <span>Prompt Generator</span>
              </Link>
            </div>
          </div>

          {/* Metrics Grid */}
          <MetricGrid metrics={data.metrics} />

          {/* Main 2-Column Split: Recent Executions & Active Workflows */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Executions Panel */}
            <div className="p-6 rounded-3xl bg-[#0f172a] border border-slate-800 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <PlayCircle className="h-4 w-4 text-cyan-400" />
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">Recent Executions</h2>
                  </div>
                  <Link href="/executions" className="text-xs text-indigo-400 hover:underline flex items-center gap-1 font-semibold">
                    <span>View All</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>

                <div className="divide-y divide-slate-800/60 mt-2">
                  {data.recentExecutions.length === 0 && (
                    <p className="text-xs text-slate-500 py-8 text-center">No execution runs recorded yet.</p>
                  )}
                  {data.recentExecutions.map((exec) => (
                    <Link
                      key={exec._id}
                      href={`/executions/${exec._id}`}
                      className="py-3.5 flex items-center justify-between hover:bg-slate-850/50 px-2 rounded-xl transition group"
                    >
                      <div className="min-w-0 flex-1 pr-4">
                        <p className="text-xs font-semibold text-white truncate group-hover:text-indigo-400 transition">
                          {exec.snapshot?.name || exec.workflowId?.name || 'Untitled Workflow'}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {exec.duration ? `${(exec.duration / 1000).toFixed(2)}s` : 'In progress'}
                          </span>
                          <span>&bull;</span>
                          <span>{new Date(exec.createdAt).toLocaleTimeString()}</span>
                        </div>
                      </div>
                      <div>{getStatusBadge(exec.status)}</div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Active Workflows Panel */}
            <div className="p-6 rounded-3xl bg-[#0f172a] border border-slate-800 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <GitFork className="h-4 w-4 text-indigo-400" />
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">Active Workflows</h2>
                  </div>
                  <Link href="/workflows" className="text-xs text-indigo-400 hover:underline flex items-center gap-1 font-semibold">
                    <span>Manage</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>

                <div className="divide-y divide-slate-800/60 mt-2">
                  {data.recentWorkflows.length === 0 && (
                    <p className="text-xs text-slate-500 py-8 text-center">No workflows created yet.</p>
                  )}
                  {data.recentWorkflows.map((wf) => (
                    <Link
                      key={wf._id}
                      href={`/workflows/${wf._id}`}
                      className="py-3.5 flex items-center justify-between hover:bg-slate-850/50 px-2 rounded-xl transition group"
                    >
                      <div className="min-w-0 flex-1 pr-4">
                        <p className="text-xs font-semibold text-white truncate group-hover:text-indigo-400 transition">
                          {wf.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-medium px-2 py-0.2 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
                            {wf.nodes?.length || 0} nodes
                          </span>
                          <span className="text-[10px] font-medium px-2 py-0.2 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            v{wf.version || 1}
                          </span>
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-400 capitalize px-2 py-1 rounded-lg bg-slate-900 border border-slate-800">
                        {wf.status}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
