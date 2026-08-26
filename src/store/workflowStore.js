import { create } from 'zustand';
import { applyNodeChanges, applyEdgeChanges } from '@xyflow/react';

export const useWorkflowStore = create((set, get) => ({
  workflow: null,
  nodes: [],
  edges: [],
  selectedNode: null,
  isDirty: false,

  setWorkflow: (workflow) => {
    set({
      workflow,
      nodes: workflow?.nodes || [],
      edges: workflow?.edges || [],
      selectedNode: null,
      isDirty: false,
    });
  },

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
      isDirty: true,
    });
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
      isDirty: true,
    });
  },

  onConnect: (connection) => {
    const newEdge = {
      ...connection,
      id: `e-${connection.source}-${connection.target}-${Date.now()}`,
      animated: true,
      style: { stroke: '#6366f1', strokeWidth: 2 },
    };
    set({
      edges: [...get().edges, newEdge],
      isDirty: true,
    });
  },

  addNode: (nodeData) => {
    const id = `node-${Date.now()}`;
    const newNode = {
      id,
      type: nodeData.type || 'custom',
      position: nodeData.position || { x: 250, y: 150 },
      data: {
        label: nodeData.label || 'New Node',
        type: nodeData.type,
        config: nodeData.config || {},
      },
    };
    set({
      nodes: [...get().nodes, newNode],
      selectedNode: newNode,
      isDirty: true,
    });
    return newNode;
  },

  updateNodeData: (nodeId, dataUpdates) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === nodeId) {
          const updated = {
            ...node,
            data: { ...node.data, ...dataUpdates },
          };
          if (get().selectedNode?.id === nodeId) {
            set({ selectedNode: updated });
          }
          return updated;
        }
        return node;
      }),
      isDirty: true,
    });
  },

  deleteNode: (nodeId) => {
    set({
      nodes: get().nodes.filter((n) => n.id !== nodeId),
      edges: get().edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
      selectedNode: get().selectedNode?.id === nodeId ? null : get().selectedNode,
      isDirty: true,
    });
  },

  selectNode: (node) => {
    set({ selectedNode: node });
  },

  clearSelection: () => {
    set({ selectedNode: null });
  },

  reset: () => {
    set({ workflow: null, nodes: [], edges: [], selectedNode: null, isDirty: false });
  },
}));
