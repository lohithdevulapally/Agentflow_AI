const AgentMemory = require('../models/AgentMemory');

class PlannerAgent {
  constructor() {
    this.name = 'planner';
  }

  async planExecution(workflow, executionId) {
    const nodes = workflow.nodes || [];
    const edges = workflow.edges || [];

    if (nodes.length === 0) {
      throw new Error('Cannot execute empty workflow: No nodes present in graph');
    }

    // Identify In-degrees for topological sort
    const inDegree = new Map();
    const adj = new Map();

    nodes.forEach((n) => {
      inDegree.set(n.id, 0);
      adj.set(n.id, []);
    });

    edges.forEach((e) => {
      if (adj.has(e.source) && inDegree.has(e.target)) {
        adj.get(e.source).push(e.target);
        inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
      }
    });

    // Find trigger / root nodes (inDegree === 0)
    const queue = [];
    nodes.forEach((n) => {
      if (inDegree.get(n.id) === 0) {
        queue.push(n.id);
      }
    });

    const executionSequence = [];
    while (queue.length > 0) {
      const current = queue.shift();
      executionSequence.push(current);

      const neighbors = adj.get(current) || [];
      for (const nextNode of neighbors) {
        inDegree.set(nextNode, inDegree.get(nextNode) - 1);
        if (inDegree.get(nextNode) === 0) {
          queue.push(nextNode);
        }
      }
    }

    // If graph has disconnected items or cycles, append remaining nodes
    if (executionSequence.length < nodes.length) {
      nodes.forEach((n) => {
        if (!executionSequence.includes(n.id)) {
          executionSequence.push(n.id);
        }
      });
    }

    // Confidence scoring calculation based on graph completeness & connections
    const hasTrigger = nodes.some((n) => n.type === 'trigger' || n.data?.category === 'trigger');
    const hasEdges = edges.length >= nodes.length - 1;
    let confidenceScore = 0.95;
    if (!hasTrigger) confidenceScore -= 0.15;
    if (!hasEdges && nodes.length > 1) confidenceScore -= 0.10;
    confidenceScore = Math.max(0.65, Math.min(0.99, confidenceScore));

    const plan = {
      executionSequence,
      totalSteps: executionSequence.length,
      confidenceScore: parseFloat(confidenceScore.toFixed(2)),
      plannedAt: new Date().toISOString(),
    };

    await AgentMemory.set({
      workflowId: workflow.id || workflow._id,
      executionId,
      agentId: this.name,
      key: 'execution_plan',
      value: plan,
      confidenceScore: plan.confidenceScore,
    });

    return plan;
  }
}

module.exports = new PlannerAgent();
