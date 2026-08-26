import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  Cpu,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Bot,
  Zap,
  Workflow,
  CheckCircle2,
  Lock,
  Layers,
  Activity,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, token } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && token) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, token, router]);

  const agentPillars = [
    {
      title: 'Planner Agent',
      desc: 'Parses graph dependencies, resolves topological order, and calculates execution confidence.',
      icon: Layers,
      color: 'from-indigo-500 to-indigo-700',
    },
    {
      title: 'Execution Agent',
      desc: 'Invokes real-world OAuth integrations (Gmail, Slack, Sheets) and AI models.',
      icon: Zap,
      color: 'from-cyan-500 to-blue-700',
    },
    {
      title: 'Validation Agent',
      desc: 'Verifies data contracts and asserts required output schemas at every stage.',
      icon: ShieldCheck,
      color: 'from-emerald-500 to-emerald-700',
    },
    {
      title: 'Recovery Agent',
      desc: 'Auto-classifies errors and chooses between exponential backoff or escalation.',
      icon: Bot,
      color: 'from-amber-500 to-orange-700',
    },
    {
      title: 'Monitoring Agent',
      desc: 'Emits granular telemetry and streams real-time Socket.IO execution events.',
      icon: Activity,
      color: 'from-purple-500 to-pink-700',
    },
  ];

  return (
    <div className="min-h-screen bg-[#090d16] text-white selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-[#0f172a]/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 shadow-lg shadow-indigo-500/25">
              <Cpu className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              Agentflow<span className="text-indigo-400">AI</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-300 hover:text-white transition"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition"
            >
              <span>Get Started</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-20 px-6 max-w-7xl mx-auto text-center relative overflow-hidden">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-8 animate-pulse">
          <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
          Autonomous Multi-Agent Visual Automation
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-5xl mx-auto leading-tight sm:leading-none">
          Transform Natural Language into <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-400 bg-clip-text text-transparent">
            Executable Agentic Workflows
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
          Describe any enterprise process in plain English. Agentflow_AI automatically synthesizes 
          visual graph topologies, executes them through a chain of 5 cooperating specialized agents, 
          and coordinates real-time third-party integrations with encrypted security.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/register"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-base shadow-xl shadow-indigo-500/30 flex items-center justify-center gap-2 transition"
          >
            <span>Launch Operator Console</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 font-semibold text-base transition flex items-center justify-center gap-2"
          >
            <Lock className="h-4 w-4 text-slate-400" />
            <span>Sign In Demo Account</span>
          </Link>
        </div>
      </section>

      {/* 5-Agent Architecture Showcase */}
      <section className="py-20 px-6 max-w-7xl mx-auto border-t border-slate-800">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">5-Stage Agentic Pipeline</h2>
          <p className="mt-3 text-slate-400 text-sm sm:text-base">
            Every visual workflow executes through a deterministic chain of autonomous agents ensuring resilience, validation, and zero silent failures.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {agentPillars.map((agent, i) => {
            const Icon = agent.icon;
            return (
              <div
                key={i}
                className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 shadow-xl flex flex-col justify-between group hover:border-indigo-500/50 transition duration-300"
              >
                <div>
                  <div className={`h-10 w-10 rounded-xl bg-gradient-to-tr ${agent.color} flex items-center justify-center shadow-lg mb-4`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{agent.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{agent.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-8 px-6 text-center text-xs text-slate-500">
        <p>&copy; {new Date().getFullYear()} Agentflow_AI — Enterprise Agentic Automation Platform. MIT License.</p>
      </footer>
    </div>
  );
}
