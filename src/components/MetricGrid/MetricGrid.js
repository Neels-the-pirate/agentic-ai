import { GitFork, PlayCircle, CheckCircle2, AlertTriangle, Activity, Zap } from 'lucide-react';

export default function MetricGrid({ metrics = {} }) {
  const items = [
    {
      title: 'Total Workflows',
      value: metrics.totalWorkflows || 0,
      subtext: `${metrics.activeWorkflows || 0} active in production`,
      icon: GitFork,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10 border-indigo-500/20',
    },
    {
      title: 'Total Executions',
      value: metrics.totalExecutions || 0,
      subtext: `${metrics.runningExecutions || 0} currently running`,
      icon: PlayCircle,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10 border-cyan-500/20',
    },
    {
      title: 'Execution Success Rate',
      value: `${metrics.successRate || 100}%`,
      subtext: `${metrics.successfulExecutions || 0} succeeded`,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
    },
    {
      title: 'Failures & Escalations',
      value: metrics.failedExecutions || 0,
      subtext: 'Auto-recovered or alerted',
      icon: AlertTriangle,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10 border-rose-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item, idx) => {
        const Icon = item.icon;
        return (
          <div
            key={idx}
            className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 shadow-lg relative overflow-hidden group hover:border-slate-700 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 tracking-wide uppercase">{item.title}</span>
              <div className={`p-2 rounded-xl border ${item.bg}`}>
                <Icon className={`h-4 w-4 ${item.color}`} />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white tracking-tight">{item.value}</span>
            </div>
            <p className="mt-1 text-xs text-slate-400">{item.subtext}</p>
          </div>
        );
      })}
    </div>
  );
}
