import { create } from 'zustand';
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';
import api from '../services/api';
import { joinExecutionRoom, getSocket } from '../services/socket';

export const useWorkflowStore = create((set, get) => ({
  workflow: null,
  nodes: [],
  edges: [],
  selectedNode: null,
  isLoading: false,
  isSaving: false,
  isExecuting: false,
  activeExecution: null,
  executionLogs: [],
  error: null,

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },

  onConnect: (connection) => {
    set({
      edges: addEdge({ ...connection, animated: true, type: 'smoothstep' }, get().edges),
    });
  },

  setSelectedNode: (node) => set({ selectedNode: node }),

  addNodeFromPalette: (template, position = { x: 250, y: 250 }) => {
    const id = `node_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const newNode = {
      id,
      type: template.type || 'action',
      position,
      data: {
        label: template.label,
        category: template.category,
        provider: template.provider,
        action: template.action,
        icon: template.icon,
        config: { ...template.defaultConfig },
        requiredOutputs: template.requiredOutputs || [],
      },
    };

    set({
      nodes: [...get().nodes, newNode],
      selectedNode: newNode,
    });
  },

  updateNodeData: (nodeId, updatedData) => {
    const updatedNodes = get().nodes.map((n) => {
      if (n.id === nodeId) {
        return { ...n, data: { ...n.data, ...updatedData } };
      }
      return n;
    });

    const updatedSelected = get().selectedNode?.id === nodeId
      ? { ...get().selectedNode, data: { ...get().selectedNode.data, ...updatedData } }
      : get().selectedNode;

    set({ nodes: updatedNodes, selectedNode: updatedSelected });
  },

  deleteNode: (nodeId) => {
    const updatedNodes = get().nodes.filter((n) => n.id !== nodeId);
    const updatedEdges = get().edges.filter((e) => e.source !== nodeId && e.target !== nodeId);
    set({
      nodes: updatedNodes,
      edges: updatedEdges,
      selectedNode: get().selectedNode?.id === nodeId ? null : get().selectedNode,
    });
  },

  loadWorkflow: async (id) => {
    set({ isLoading: true, error: null, executionLogs: [], activeExecution: null });
    try {
      const res = await api.get(`/workflows/${id}`);
      const wf = res.data.data;
      set({
        workflow: wf,
        nodes: wf.nodes || [],
        edges: wf.edges || [],
        isLoading: false,
      });
      return wf;
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to load workflow';
      set({ error: msg, isLoading: false });
      return null;
    }
  },

  saveWorkflow: async (additionalUpdates = {}) => {
    const { workflow, nodes, edges } = get();
    if (!workflow) return null;

    set({ isSaving: true, error: null });
    try {
      const payload = {
        name: additionalUpdates.name || workflow.name,
        description: additionalUpdates.description !== undefined ? additionalUpdates.description : workflow.description,
        status: additionalUpdates.status || workflow.status,
        nodes,
        edges,
        triggerConfig: additionalUpdates.triggerConfig || workflow.triggerConfig,
        tags: additionalUpdates.tags || workflow.tags,
      };

      const res = await api.put(`/workflows/${workflow.id || workflow._id}`, payload);
      const updated = res.data.data;
      set({ workflow: updated, isSaving: false });
      return updated;
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to save workflow';
      set({ error: msg, isSaving: false });
      return null;
    }
  },

  triggerExecution: async (inputs = {}) => {
    const { workflow } = get();
    if (!workflow) return null;

    set({ isExecuting: true, executionLogs: [], activeExecution: null });
    try {
      // First save latest canvas state
      await get().saveWorkflow();

      const res = await api.post(`/workflows/${workflow.id || workflow._id}/execute`, { inputs });
      const { execution } = res.data.data;
      const executionId = execution.id || execution._id;

      set({ activeExecution: execution });
      joinExecutionRoom(executionId);

      // Listen for live events
      const socket = getSocket();
      if (socket) {
        socket.off('agent_event');
        socket.off('execution_update');

        socket.on('agent_event', (event) => {
          set((state) => ({
            executionLogs: [...state.executionLogs, event],
          }));
        });

        socket.on('execution_update', (update) => {
          set((state) => {
            const isFinished = ['COMPLETED', 'FAILED', 'CANCELLED'].includes(update.status);
            return {
              activeExecution: { ...state.activeExecution, ...update },
              isExecuting: !isFinished,
            };
          });
        });
      }

      return execution;
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to trigger execution';
      set({ error: msg, isExecuting: false });
      return null;
    }
  },

  appendExecutionLog: (log) => {
    set((state) => ({ executionLogs: [...state.executionLogs, log] }));
  },

  resetExecution: () => {
    set({ activeExecution: null, executionLogs: [], isExecuting: false });
  },
}));

export default useWorkflowStore;
