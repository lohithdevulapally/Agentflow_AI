import { useCallback, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import TriggerNode from './CustomNodes/TriggerNode';
import AINode from './CustomNodes/AINode';
import ActionNode from './CustomNodes/ActionNode';
import LogicNode from './CustomNodes/LogicNode';
import IntegrationNode from './CustomNodes/IntegrationNode';
import useWorkflowStore from '../../store/workflowStore';

const nodeTypes = {
  trigger: TriggerNode,
  ai: AINode,
  action: ActionNode,
  logic: LogicNode,
  integration: IntegrationNode,
};

export default function WorkflowCanvas() {
  const reactFlowWrapper = useRef(null);
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    setSelectedNode,
    addNodeFromPalette,
    activeExecution,
  } = useWorkflowStore();

  const onNodeClick = useCallback(
    (event, node) => {
      setSelectedNode(node);
    },
    [setSelectedNode]
  );

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, [setSelectedNode]);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const rawData = event.dataTransfer.getData('application/agentflow-node');
      if (!rawData) return;

      try {
        const template = JSON.parse(rawData);
        const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
        if (!reactFlowBounds) return;

        const position = {
          x: event.clientX - reactFlowBounds.left - 100,
          y: event.clientY - reactFlowBounds.top - 40,
        };

        addNodeFromPalette(template, position);
      } catch (e) {
        console.error('Failed to parse dropped node template:', e);
      }
    },
    [addNodeFromPalette]
  );

  // Enhance nodes with runtime execution highlighting
  const highlightedNodes = nodes.map((node) => {
    const isCurrent = activeExecution?.currentNode === node.id;
    return {
      ...node,
      className: isCurrent ? 'animate-bounce !ring-4 !ring-brand-400 rounded-2xl' : '',
    };
  });

  return (
    <div className="w-full h-full relative" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={highlightedNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid
        snapGrid={[15, 15]}
        defaultEdgeOptions={{
          animated: true,
          style: { stroke: '#6366f1', strokeWidth: 2 },
        }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1.5}
          color="rgba(255, 255, 255, 0.08)"
        />
        <Controls />
        <MiniMap
          nodeStrokeWidth={3}
          nodeColor={(node) => {
            if (node.type === 'trigger') return '#f59e0b';
            if (node.type === 'ai') return '#a855f7';
            if (node.type === 'logic') return '#14b8a6';
            if (node.type === 'integration') return '#6366f1';
            return '#64748b';
          }}
          maskColor="rgba(15, 23, 42, 0.75)"
          className="!bg-slate-900/90 !border !border-slate-800 rounded-xl overflow-hidden"
        />
      </ReactFlow>
    </div>
  );
}
