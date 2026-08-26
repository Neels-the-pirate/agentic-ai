import React from 'react';
import {
  Mail,
  Slack,
  MessageSquare,
  FileSpreadsheet,
  Brain,
  Webhook,
  Clock,
  Shuffle,
  Filter,
  Plus,
} from 'lucide-react';
import { useWorkflowStore } from '../../store/workflowStore';

const availableNodes = [
  // Triggers
  {
    category: 'Triggers',
    items: [
      { type: 'trigger_gmail', label: 'Gmail Inbound', icon: Mail, description: 'Triggers when new email arrives' },
      { type: 'trigger_webhook', label: 'Webhook', icon: Webhook, description: 'Triggers on incoming HTTP request' },
      { type: 'trigger_schedule', label: 'Schedule / Cron', icon: Clock, description: 'Runs periodically' },
    ],
  },
  // AI Agents
  {
    category: 'AI Agents',
    items: [
      { type: 'ai_sentiment', label: 'AI Sentiment', icon: Brain, description: 'Detects emotion & urgency' },
      { type: 'ai_summarize', label: 'AI Summarizer', icon: Brain, description: 'Distills long messages' },
      { type: 'ai_classify', label: 'AI Classifier', icon: Brain, description: 'Categorizes intent' },
    ],
  },
  // Actions
  {
    category: 'Actions & Integrations',
    items: [
      { type: 'action_gmail', label: 'Gmail Send', icon: Mail, description: 'Sends automated email' },
      { type: 'action_slack', label: 'Slack Alert', icon: Slack, description: 'Broadcasts to channel' },
      { type: 'action_discord', label: 'Discord Message', icon: MessageSquare, description: 'Posts to Discord server' },
      { type: 'action_sheets', label: 'Google Sheets', icon: FileSpreadsheet, description: 'Appends rows to spreadsheet' },
    ],
  },
];

export default function NodePalette() {
  const { addNode } = useWorkflowStore();

  const handleAdd = (item) => {
    addNode({
      type: item.type,
      label: item.label,
      position: { x: 200 + Math.random() * 100, y: 150 + Math.random() * 100 },
      config: {},
    });
  };

  return (
    <div className="w-72 border-r border-slate-800 bg-[#0f172a] flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-slate-800">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Node Palette</h3>
        <p className="text-[11px] text-slate-400 mt-0.5">Click to append node to canvas</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {availableNodes.map((section, idx) => (
          <div key={idx} className="space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1">
              {section.category}
            </span>
            <div className="space-y-1.5">
              {section.items.map((nodeItem) => {
                const Icon = nodeItem.icon;
                return (
                  <button
                    key={nodeItem.type}
                    onClick={() => handleAdd(nodeItem)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800/80 hover:border-indigo-500/40 text-left transition group shadow-sm"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1.5 rounded-lg bg-slate-800 group-hover:bg-indigo-600/20 text-slate-300 group-hover:text-indigo-400 transition">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{nodeItem.label}</p>
                        <p className="text-[10px] text-slate-400 truncate">{nodeItem.description}</p>
                      </div>
                    </div>
                    <Plus className="h-3.5 w-3.5 text-slate-400 group-hover:text-indigo-400 transition" />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
