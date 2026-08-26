import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
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
  CheckCircle2,
  AlertCircle,
  Activity,
} from 'lucide-react';

const iconMap = {
  trigger_gmail: Mail,
  trigger_webhook: Webhook,
  trigger_schedule: Clock,
  trigger_manual: Activity,
  ai_sentiment: Brain,
  ai_summarize: Brain,
  ai_classify: Brain,
  ai_generate: Brain,
  action_gmail: Mail,
  gmail_send: Mail,
  gmail_read: Mail,
  action_slack: Slack,
  slack_message: Slack,
  action_discord: MessageSquare,
  discord_message: MessageSquare,
  action_sheets: FileSpreadsheet,
  sheets_append: FileSpreadsheet,
  transform_json: Shuffle,
  condition_filter: Filter,
};

const categoryTheme = {
  trigger: {
    bg: 'bg-gradient-to-b from-indigo-950/80 to-slate-900',
    border: 'border-indigo-500/50 hover:border-indigo-400',
    badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    badgeText: 'TRIGGER',
  },
  ai: {
    bg: 'bg-gradient-to-b from-purple-950/80 to-slate-900',
    border: 'border-purple-500/50 hover:border-purple-400',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    badgeText: 'AI AGENT',
  },
  action: {
    bg: 'bg-gradient-to-b from-cyan-950/80 to-slate-900',
    border: 'border-cyan-500/50 hover:border-cyan-400',
    badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    badgeText: 'ACTION',
  },
  transform: {
    bg: 'bg-gradient-to-b from-amber-950/80 to-slate-900',
    border: 'border-amber-500/50 hover:border-amber-400',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    badgeText: 'TRANSFORM',
  },
};

const getCategory = (type = '') => {
  if (type.startsWith('trigger_')) return categoryTheme.trigger;
  if (type.startsWith('ai_')) return categoryTheme.ai;
  if (type.startsWith('action_') || type.includes('gmail') || type.includes('slack') || type.includes('discord') || type.includes('sheets'))
    return categoryTheme.action;
  return categoryTheme.transform;
};

const CustomNode = ({ data, selected }) => {
  const nodeType = data.type || 'generic';
  const Icon = iconMap[nodeType] || Activity;
  const theme = getCategory(nodeType);
  const isTrigger = nodeType.startsWith('trigger_');

  return (
    <div
      className={`relative min-w-[240px] max-w-[280px] rounded-2xl border p-4 shadow-xl backdrop-blur-md transition-all duration-200 ${
        theme.bg
      } ${theme.border} ${
        selected ? 'ring-2 ring-indigo-400 ring-offset-2 ring-offset-[#090d16] shadow-indigo-500/20' : ''
      }`}
    >
      {/* Target handle on top (unless trigger) */}
      {!isTrigger && (
        <Handle
          type="target"
          position={Position.Top}
          className="!h-3 !w-3 !bg-indigo-400 !border-2 !border-[#090d16] hover:!scale-125 transition-transform"
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60 shadow-inner">
            <Icon className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">{data.label || 'Workflow Node'}</p>
            <span className={`inline-block mt-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded border uppercase tracking-wider ${theme.badge}`}>
              {theme.badgeText}
            </span>
          </div>
        </div>
      </div>

      {/* Body description */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/60 text-[11px] text-slate-400">
        <p className="truncate">
          {data.config?.prompt
            ? `Prompt: "${data.config.prompt.slice(0, 30)}..."`
            : data.config?.to || data.config?.channel || data.config?.query || 'Configured and ready'}
        </p>
      </div>

      {/* Source handle on bottom */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-3 !w-3 !bg-indigo-400 !border-2 !border-[#090d16] hover:!scale-125 transition-transform"
      />
    </div>
  );
};

export default memo(CustomNode);
