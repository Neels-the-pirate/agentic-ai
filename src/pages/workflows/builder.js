import { useState } from 'react';
import { useRouter } from 'next/router';
import { Sparkles, ArrowRight, Play, CheckCircle2, Bot, Layers, Save, RefreshCw } from 'lucide-react';
import ProtectedRoute from '../../components/ProtectedRoute/ProtectedRoute';
import AppShell from '../../components/AppShell/AppShell';
import WorkflowCanvas from '../../components/WorkflowCanvas/WorkflowCanvas';
import { useWorkflowStore } from '../../store/workflowStore';
import api from '../../services/api';

const promptTemplates = [
  {
    title: 'Customer Feedback Sentiment & Alert',
    prompt: 'When a new email arrives in Gmail, analyze tone and sentiment with AI, append a summary row to Google Sheets, and post an urgent alert to Slack if sentiment is negative.',
  },
  {
    title: 'Daily Schedule Invoicing Digest',
    prompt: 'Run every morning on cron schedule, read unpaid invoice rows from Google Sheets, summarize pending totals with AI, and send reminder email via Gmail.',
  },
  {
    title: 'Webhook Support Classifier & Discord Route',
    prompt: 'Receive support tickets via webhook, classify priority category with AI, and broadcast ticket details to Discord channel.',
  },
];

export default function WorkflowBuilderPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedWorkflow, setGeneratedWorkflow] = useState(null);
  const [providerUsed, setProviderUsed] = useState('');
  const [error, setError] = useState('');
  const { setWorkflow } = useWorkflowStore();

  const handleGenerate = async (targetPrompt) => {
    const textToUse = targetPrompt || prompt;
    if (!textToUse) {
      setError('Please provide an automation description prompt');
      return;
    }

    setError('');
    setIsGenerating(true);
    try {
      const res = await api.post('/workflows/generate', { prompt: textToUse });
      const { workflow, provider } = res.data;
      setGeneratedWorkflow(workflow);
      setProviderUsed(provider);
      // Load into canvas store
      setWorkflow(workflow);
    } catch (err) {
      setError(err.response?.data?.message || 'Workflow generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveAndOpenEditor = async () => {
    if (!generatedWorkflow) return;
    try {
      const res = await api.post('/workflows', {
        name: generatedWorkflow.name || 'AI Generated Workflow',
        description: generatedWorkflow.description || prompt,
        nodes: generatedWorkflow.nodes || [],
        edges: generatedWorkflow.edges || [],
        status: 'active',
        tags: generatedWorkflow.tags || ['ai-generated'],
      });
      router.push(`/workflows/${res.data.workflow._id}`);
    } catch (err) {
      setError('Failed to save workflow to database');
    }
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="h-[calc(100vh-4rem)] flex flex-col lg:flex-row overflow-hidden bg-[#090d16]">
          {/* Left: Prompt Input & Templates Panel */}
          <div className="w-full lg:w-96 border-r border-slate-800 bg-[#0f172a] p-6 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                  <Sparkles className="h-4 w-4" />
                </div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-white">Prompt to Workflow</h2>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Describe the desired operation in natural language. Our AI engine will synthesize graph nodes, position layouts, and data contracts.
              </p>

              {error && (
                <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                  {error}
                </div>
              )}

              {/* Prompt Textarea */}
              <div className="mt-5">
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Natural Language Prompt
                </label>
                <textarea
                  rows={5}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. Ingest customer emails from Gmail, classify intent with AI, and post high-priority requests to Slack..."
                  className="w-full rounded-2xl bg-slate-900 border border-slate-700/80 p-3.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition leading-relaxed"
                />
              </div>

              {/* Submit Generator Button */}
              <button
                onClick={() => handleGenerate()}
                disabled={isGenerating}
                className="w-full mt-3 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Synthesizing Graph...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Generate Graph with AI</span>
                  </>
                )}
              </button>

              {/* Suggested Templates */}
              <div className="mt-6">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Example Templates</span>
                <div className="mt-2 space-y-2">
                  {promptTemplates.map((tpl, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setPrompt(tpl.prompt);
                        handleGenerate(tpl.prompt);
                      }}
                      className="w-full text-left p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/30 transition group"
                    >
                      <p className="text-xs font-semibold text-slate-300 group-hover:text-indigo-400 transition">{tpl.title}</p>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">{tpl.prompt}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Engine Status Badge */}
            {providerUsed && (
              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Synthesized via:</span>
                <span className="font-mono text-indigo-400 uppercase font-semibold">{providerUsed}</span>
              </div>
            )}
          </div>

          {/* Right: Graph Preview & Canvas Action */}
          <div className="flex-1 flex flex-col min-w-0 h-full relative">
            {/* Top Toolbar */}
            <div className="h-14 px-6 border-b border-slate-800 bg-[#0f172a]/90 backdrop-blur-md flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-white tracking-wide">
                  {generatedWorkflow ? generatedWorkflow.name : 'Interactive Graph Preview'}
                </span>
                {generatedWorkflow && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {generatedWorkflow.nodes?.length || 0} nodes synthesized
                  </span>
                )}
              </div>

              {generatedWorkflow && (
                <button
                  onClick={handleSaveAndOpenEditor}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-semibold shadow-lg shadow-emerald-500/20 transition"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Save & Open Visual Canvas</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Canvas Viewport */}
            <div className="flex-1 relative">
              {generatedWorkflow ? (
                <WorkflowCanvas />
              ) : (
                <div className="h-full w-full flex flex-col items-center justify-center text-center p-8 text-slate-500">
                  <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 mb-3 shadow-inner">
                    <Sparkles className="h-10 w-10 text-indigo-500/40" />
                  </div>
                  <p className="text-sm font-semibold text-slate-400">Your AI-generated graph will render here</p>
                  <p className="text-xs text-slate-600 max-w-sm mt-1">
                    Select a template from the left or write a custom automation prompt to preview the visual canvas.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
