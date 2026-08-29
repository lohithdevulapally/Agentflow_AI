const Workflow = require('../models/Workflow');
const Execution = require('../models/Execution');

class WorkflowService {
  async getDashboardMetrics(userId) {
    const totalWorkflows = await Workflow.countDocuments({ owner: userId });
    const activeWorkflows = await Workflow.countDocuments({ owner: userId, status: 'active' });
    const totalExecutions = await Execution.countDocuments({ owner: userId });
    const completedExecutions = await Execution.countDocuments({ owner: userId, status: 'COMPLETED' });
    const failedExecutions = await Execution.countDocuments({ owner: userId, status: 'FAILED' });

    const successRate = totalExecutions > 0
      ? Math.round((completedExecutions / totalExecutions) * 100)
      : 100;

    const recentExecutions = await Execution.find({ owner: userId }, { limit: 5 });
    const activeWorkflowList = await Workflow.find({ owner: userId, status: 'active' }, { limit: 5 });

    return {
      metrics: {
        totalWorkflows,
        activeWorkflows,
        totalExecutions,
        completedExecutions,
        failedExecutions,
        successRate,
      },
      recentExecutions,
      activeWorkflows: activeWorkflowList,
    };
  }

  async listWorkflows(userId, query = {}) {
    const filter = { owner: userId };
    if (query.status) filter.status = query.status;
    if (query.search) filter.search = query.search;

    const limit = parseInt(query.limit, 10) || 20;
    const page = parseInt(query.page, 10) || 1;
    const skip = (page - 1) * limit;

    const total = await Workflow.countDocuments(filter);
    const workflows = await Workflow.find(filter, { limit, skip });

    return {
      workflows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getWorkflowById(id, userId) {
    const workflow = await Workflow.findById(id);
    if (!workflow) {
      const err = new Error('Workflow not found');
      err.statusCode = 404;
      err.code = 'WORKFLOW_NOT_FOUND';
      throw err;
    }
    if (workflow.owner !== userId) {
      const err = new Error('Unauthorized access to this workflow');
      err.statusCode = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }
    return workflow;
  }

  async createWorkflow(userId, data) {
    const defaultNodes = data.nodes && data.nodes.length > 0 ? data.nodes : [
      {
        id: 'node_trigger',
        type: 'trigger',
        position: { x: 150, y: 200 },
        data: {
          label: 'Manual / Webhook Trigger',
          category: 'trigger',
          provider: 'system',
          action: 'manual',
          config: {},
        },
      },
    ];

    const workflow = await Workflow.create({
      name: data.name || 'Untitled Workflow',
      description: data.description || '',
      owner: userId,
      status: data.status || 'draft',
      triggerConfig: data.triggerConfig || { type: 'manual' },
      nodes: defaultNodes,
      edges: data.edges || [],
      version: 1,
      tags: data.tags || ['automation'],
    });

    return workflow;
  }

  async updateWorkflow(id, userId, updates) {
    const existing = await this.getWorkflowById(id, userId);

    const newVersion = (existing.version || 1) + 1;
    const updated = await Workflow.findByIdAndUpdate(id, {
      ...updates,
      version: newVersion,
    });

    return updated;
  }

  async duplicateWorkflow(id, userId) {
    const original = await this.getWorkflowById(id, userId);

    const cloned = await Workflow.create({
      name: `${original.name} (Copy)`,
      description: original.description,
      owner: userId,
      status: 'draft',
      triggerConfig: original.triggerConfig,
      nodes: original.nodes,
      edges: original.edges,
      version: 1,
      tags: [...(original.tags || []), 'cloned'],
    });

    return cloned;
  }

  async deleteWorkflow(id, userId) {
    await this.getWorkflowById(id, userId);
    await Workflow.findByIdAndDelete(id);
    return { success: true, id };
  }
}

module.exports = new WorkflowService();
