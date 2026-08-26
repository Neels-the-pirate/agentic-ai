import React from 'react';
import { X, Trash2, Sliders, ShieldCheck } from 'lucide-react';
import { useWorkflowStore } from '../../store/workflowStore';

export default function NodeConfigPanel() {
  const { selectedNode, updateNodeData, deleteNode, clearSelection } = useWorkflowStore();

  if (!selectedNode) {
    return (
      <div className="w-80 border-l border-slate-800 bg-[#0f172a] p-6 flex flex-col items-center justify-center text-center text-slate-500">
        <Sliders className="h-8 w-8 mb-2 opacity-30 text-indigo-400" />
        <p className="text-xs font-medium text-slate-400">No node selected</p>
        <p className="text-[11px] text-slate-400 mt-1">Select a node on the canvas to configure parameters</p>
      </div>
    );
  }

  const { id, data = {} } = selectedNode;
  const config = data.config || {};
  const nodeType = data.type || selectedNode.type || '';

  const handleLabelChange = (e) => {
    updateNodeData(id, { label: e.target.value });
  };

  const handleConfigChange = (key, value) => {
    updateNodeData(id, {
      config: { ...config, [key]: value },
    });
  };

  return (
    <div className="w-80 border-l border-slate-800 bg-[#0f172a] flex flex-col h-full overflow-hidden text-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Sliders className="h-4 w-4 text-indigo-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">Node Properties</h3>
        </div>
        <button
          onClick={clearSelection}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body Form */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* Node Label */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">Node Title</label>
          <input
            type="text"
            value={data.label || ''}
            onChange={handleLabelChange}
            className="w-full rounded-xl bg-slate-900 border border-slate-700/80 px-3 py-2 text-white focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        {/* Node Type Identifier */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">Type Signature</label>
          <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-800 text-[10px] font-mono text-indigo-300 border border-slate-700">
            {nodeType}
          </span>
        </div>

        {/* Dynamic Fields based on nodeType */}
        {nodeType.startsWith('ai_') && (
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">AI Prompt Instruction</label>
            <textarea
              rows={3}
              value={config.prompt || ''}
              onChange={(e) => handleConfigChange('prompt', e.target.value)}
              placeholder="e.g. Classify sentiment as positive, neutral, or negative..."
              className="w-full rounded-xl bg-slate-900 border border-slate-700/80 p-2.5 text-white focus:outline-none focus:border-indigo-500 transition"
            />
          </div>
        )}

        {(nodeType.includes('gmail') || nodeType.includes('email')) && (
          <>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Recipient Email</label>
              <input
                type="email"
                value={config.to || ''}
                onChange={(e) => handleConfigChange('to', e.target.value)}
                placeholder="operator@company.com"
                className="w-full rounded-xl bg-slate-900 border border-slate-700/80 px-3 py-2 text-white focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Subject Line</label>
              <input
                type="text"
                value={config.subject || ''}
                onChange={(e) => handleConfigChange('subject', e.target.value)}
                placeholder="Alert: Operations Notification"
                className="w-full rounded-xl bg-slate-900 border border-slate-700/80 px-3 py-2 text-white focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </>
        )}

        {nodeType.includes('slack') && (
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Slack Channel</label>
            <input
              type="text"
              value={config.channel || ''}
              onChange={(e) => handleConfigChange('channel', e.target.value)}
              placeholder="#alerts"
              className="w-full rounded-xl bg-slate-900 border border-slate-700/80 px-3 py-2 text-white focus:outline-none focus:border-indigo-500 transition"
            />
          </div>
        )}

        {nodeType.includes('discord') && (
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Discord Channel ID</label>
            <input
              type="text"
              value={config.channelId || ''}
              onChange={(e) => handleConfigChange('channelId', e.target.value)}
              placeholder="123456789012345678"
              className="w-full rounded-xl bg-slate-900 border border-slate-700/80 px-3 py-2 text-white focus:outline-none focus:border-indigo-500 transition"
            />
          </div>
        )}

        {nodeType.includes('sheets') && (
          <>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Spreadsheet ID</label>
              <input
                type="text"
                value={config.spreadsheetId || ''}
                onChange={(e) => handleConfigChange('spreadsheetId', e.target.value)}
                placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                className="w-full rounded-xl bg-slate-900 border border-slate-700/80 px-3 py-2 text-white focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Sheet Range</label>
              <input
                type="text"
                value={config.range || ''}
                onChange={(e) => handleConfigChange('range', e.target.value)}
                placeholder="Sheet1!A:D"
                className="w-full rounded-xl bg-slate-900 border border-slate-700/80 px-3 py-2 text-white focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
        <button
          onClick={() => deleteNode(id)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-semibold text-xs transition"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Delete Node</span>
        </button>
      </div>
    </div>
  );
}
