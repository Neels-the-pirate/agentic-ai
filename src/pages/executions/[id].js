import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  ArrowLeft,
  Play,
  Pause,
  XCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Activity,
  Layers,
  Zap,
  ShieldCheck,
  Bot,
  RefreshCw,
  Terminal,
} from 'lucide-react';
import ProtectedRoute from '../../components/ProtectedRoute/ProtectedRoute';
import AppShell from '../../components/AppShell/AppShell';
import WorkflowCanvas from '../../components/WorkflowCanvas/WorkflowCanvas';
import { useWorkflowStore } from '../../store/workflowStore';
import { getSocket, joinExecutionRoom, leaveExecutionRoom } from '../../services/socket';
import api from '../../services/api';

const agentBadges = {
  planner: { label: 'PLANNER', bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30', icon: Layers },
  execution: { label: 'EXECUTION', bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30', icon: Zap },
  validation: { label: 'VALIDATION', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', icon: ShieldCheck },
  recovery: { label: 'RECOVERY', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30', icon: Bot },
  monitoring: { label: 'MONITORING', bg: 'bg-purple-500/10 text-purple-400 border-purple-500/30', icon: Activity },
  orchestrator: { label: 'ORCHESTRATOR', bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30', icon: Terminal },
};

export default function ExecutionDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [execution, setExecution] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const { setWorkflow } = useWorkflowStore();

  const fetchExecutionAndTimeline = async (execId) => {
    try {
      const [execRes, timelineRes] = await Promise.all([
        api.get(`/executions/${execId}`),
        api.get(`/executions/${execId}/timeline`),
      ]);
      setExecution(execRes.data.execution);
      setTimeline(timelineRes.data.timeline || []);

      // Load snapshot graph into canvas
      if (execRes.data.execution?.snapshot) {
        setWorkflow(execRes.data.execution.snapshot);
      }
    } catch (err) {
      console.error('Failed to load execution details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchExecutionAndTimeline(id);
      joinExecutionRoom(id);

      const socket = getSocket();
      if (socket) {
        const handleEvent = (newEvent) => {
          setTimeline((prev) => [...prev, newEvent]);
        };

        const handleStatus = (statusUpdate) => {
          setExecution((prev) => (prev ? { ...prev, status: statusUpdate.status } : null));
        };

        socket.on('execution:event', handleEvent);
        socket.on('execution:status', handleStatus);

        return () => {
          socket.off('execution:event', handleEvent);
          socket.off('execution:status', handleStatus);
          leaveExecutionRoom(id);
        };
      }
    }
  }, [id]);

  const handlePause = async () => {
    try {
      const res = await api.post(`/executions/${id}/pause`);
      setExecution(res.data.execution);
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to pause');
    }
  };

  const handleResume = async () => {
    try {
      const res = await api.post(`/executions/${id}/resume`);
      setExecution(res.data.execution);
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to resume');
    }
  };

  const handleCancel = async () => {
    try {
      const res = await api.post(`/executions/${id}/cancel`);
      setExecution(res.data.execution);
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to cancel');
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <AppShell>
          <div className="flex h-[calc(100vh-4rem)] items-center justify-center text-slate-500 text-sm">
            <RefreshCw className="h-5 w-5 animate-spin mr-2 text-indigo-400" />
            <span>Loading execution telemetry...</span>
          </div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden bg-[#090d16]">
          {/* Top Info Bar */}
          <div className="h-16 px-6 border-b border-slate-800 bg-[#0f172a] flex items-center justify-between z-10">
            <div className="flex items-center gap-4 min-w-0">
              <Link
                href="/executions"
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div className="min-w-0">
                <h1 className="text-sm font-bold text-white truncate">
                  {execution?.snapshot?.name || execution?.workflowId?.name || 'Execution Run'}
                </h1>
                <div className="flex items-center gap-2.5 text-[11px] text-slate-400">
                  <span className="font-mono">{id}</span>
                  <span>&bull;</span>
                  <span>{execution?.duration ? `${(execution.duration / 1000).toFixed(2)}s` : 'Active'}</span>
                </div>
              </div>
            </div>

            {/* Run Controls */}
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                execution?.status === 'COMPLETED'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : execution?.status === 'RUNNING'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 animate-pulse'
                  : execution?.status === 'FAILED'
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {execution?.status}
              </span>

              {execution?.status === 'RUNNING' && (
                <button
                  onClick={handlePause}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 text-xs font-semibold transition"
                >
                  <Pause className="h-3.5 w-3.5" />
                  <span>Pause</span>
                </button>
              )}

              {execution?.status === 'PAUSED' && (
                <button
                  onClick={handleResume}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-semibold transition"
                >
                  <Play className="h-3.5 w-3.5" />
                  <span>Resume</span>
                </button>
              )}

              {['RUNNING', 'PAUSED', 'RETRYING'].includes(execution?.status) && (
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold transition"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  <span>Cancel</span>
                </button>
              )}
            </div>
          </div>

          {/* 2-Pane Split: Frozen Canvas (Left) + Live Agent Logs (Right) */}
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            {/* Frozen Canvas */}
            <div className="flex-1 h-1/2 lg:h-full relative border-b lg:border-b-0 lg:border-r border-slate-800">
              <WorkflowCanvas readonly={true} />
            </div>

            {/* Live Agent Timeline Stream */}
            <div className="w-full lg:w-[480px] h-1/2 lg:h-full bg-[#0f172a] flex flex-col overflow-hidden">
              <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-indigo-400" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-white">Agent Telemetry Stream</h2>
                </div>
                <span className="text-[10px] font-mono text-slate-500">{timeline.length} events</span>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs">
                {timeline.length === 0 && (
                  <div className="text-center py-12 text-slate-500">Waiting for agent events...</div>
                )}
                {timeline.map((event, idx) => {
                  const agentInfo = agentBadges[event.agent] || agentBadges.orchestrator;
                  const Icon = agentInfo.icon;
                  return (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 transition space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase ${agentInfo.bg}`}>
                          <Icon className="h-3 w-3" />
                          {agentInfo.label}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(event.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 })}
                        </span>
                      </div>
                      <p className={`text-[11px] leading-relaxed ${
                        event.level === 'error' ? 'text-rose-400' : event.level === 'warning' ? 'text-amber-400' : 'text-slate-300'
                      }`}>
                        {event.message}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
