import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  PlayCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  PauseCircle,
  RefreshCw,
  Search,
  Filter,
  ArrowRight,
} from 'lucide-react';
import ProtectedRoute from '../../components/ProtectedRoute/ProtectedRoute';
import AppShell from '../../components/AppShell/AppShell';
import api from '../../services/api';

export default function ExecutionsListPage() {
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchExecutions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/executions', {
        params: { status: statusFilter },
      });
      setExecutions(res.data.executions || []);
    } catch (err) {
      console.error('Failed to load executions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExecutions();
    const interval = setInterval(fetchExecutions, 5000); // Polling for background execution progress
    return () => clearInterval(interval);
  }, [statusFilter]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-3.5 w-3.5" />
            COMPLETED
          </span>
        );
      case 'RUNNING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 animate-pulse">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            RUNNING
          </span>
        );
      case 'RETRYING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="h-3.5 w-3.5" />
            RETRYING
          </span>
        );
      case 'PAUSED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <PauseCircle className="h-3.5 w-3.5" />
            PAUSED
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertCircle className="h-3.5 w-3.5" />
            FAILED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400">
            {status}
          </span>
        );
    }
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">Execution Timeline</h1>
              <p className="text-xs text-slate-400 mt-1">Audit log of all autonomous agent execution runs.</p>
            </div>
            <button
              onClick={fetchExecutions}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center gap-3 bg-[#0f172a] p-3 rounded-2xl border border-slate-800">
            <Filter className="h-4 w-4 text-slate-500 ml-2" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="RUNNING">Running</option>
              <option value="RETRYING">Retrying</option>
              <option value="PAUSED">Paused</option>
              <option value="FAILED">Failed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Executions Table */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 border-b border-slate-800 uppercase tracking-wider text-[11px] text-slate-400">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Workflow Target</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold">Duration</th>
                    <th className="px-6 py-4 font-semibold">Retries</th>
                    <th className="px-6 py-4 font-semibold">Initiated At</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {executions.length === 0 && !loading && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                        No execution runs found.
                      </td>
                    </tr>
                  )}
                  {executions.map((exec) => (
                    <tr key={exec._id} className="hover:bg-slate-850/50 transition">
                      <td className="px-6 py-4 font-semibold text-white">
                        <Link href={`/executions/${exec._id}`} className="hover:text-indigo-400 transition">
                          {exec.snapshot?.name || exec.workflowId?.name || 'Workflow Run'}
                        </Link>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(exec.status)}</td>
                      <td className="px-6 py-4 font-mono text-slate-400">
                        {exec.duration ? `${(exec.duration / 1000).toFixed(2)}s` : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-mono ${exec.retryCount > 0 ? 'bg-amber-500/20 text-amber-300' : 'text-slate-500'}`}>
                          {exec.retryCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {new Date(exec.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/executions/${exec._id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-400 font-semibold transition"
                        >
                          <span>Timeline</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
