import React, { useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import CustomNode from './CustomNode';
import { useWorkflowStore } from '../../store/workflowStore';

export default function WorkflowCanvas({ readonly = false }) {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, selectNode, clearSelection } = useWorkflowStore();

  const nodeTypes = useMemo(
    () => ({
      custom: CustomNode,
      trigger_gmail: CustomNode,
      trigger_webhook: CustomNode,
      trigger_schedule: CustomNode,
      trigger_manual: CustomNode,
      ai_sentiment: CustomNode,
      ai_summarize: CustomNode,
      ai_classify: CustomNode,
      ai_generate: CustomNode,
      action_gmail: CustomNode,
      action_slack: CustomNode,
      action_discord: CustomNode,
      action_sheets: CustomNode,
      transform_json: CustomNode,
      condition_filter: CustomNode,
    }),
    []
  );

  const onNodeClick = useCallback(
    (event, node) => {
      selectNode(node);
    },
    [selectNode]
  );

  const onPaneClick = useCallback(() => {
    clearSelection();
  }, [clearSelection]);

  return (
    <div className="h-full w-full bg-[#090d16] relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={readonly ? undefined : onNodesChange}
        onEdgesChange={readonly ? undefined : onEdgesChange}
        onConnect={readonly ? undefined : onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid
        snapGrid={[15, 15]}
        nodesDraggable={!readonly}
        nodesConnectable={!readonly}
        elementsSelectable={!readonly}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#1e293b" />
        <Controls position="bottom-left" />
        <MiniMap
          nodeColor={(n) => (n.type?.startsWith('ai_') ? '#8b5cf6' : n.type?.startsWith('trigger_') ? '#6366f1' : '#06b6d4')}
          maskColor="rgba(9, 13, 22, 0.7)"
          position="bottom-right"
        />
      </ReactFlow>
    </div>
  );
}
