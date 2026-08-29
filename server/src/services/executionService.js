const Execution = require('../models/Execution');
const ExecutionLog = require('../models/ExecutionLog');
const Workflow = require('../models/Workflow');
const { addExecutionToQueue } = require('../queues/executionQueue');
const orchestrator = require('../agents/orchestrator');

class ExecutionService {
  async triggerExecution(workflowId, userId, inputs = {}) {
    const workflow = await Workflow.findById(workflowId);
    if (!workflow) {
      const err = new Error('Workflow not found');
      err.statusCode = 404;
      err.code = 'WORKFLOW_NOT_FOUND';
      throw err;
    }

    if (workflow.owner !== userId) {
      const err = new Error('Unauthorized');
      err.statusCode = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }

    // Capture immutable snapshot of workflow at runtime
    const execution = await Execution.create({
      workflowId: workflow.id || workflow._id,
      workflowName: workflow.name,
      owner: userId,
      workflowSnapshot: {
        id: workflow.id || workflow._id,
        name: workflow.name,
        nodes: workflow.nodes,
        edges: workflow.edges,
        version: workflow.version,
        triggerConfig: workflow.triggerConfig,
      },
      status: 'PENDING',
      inputs,
      startTime: new Date(),
    });

    const executionId = execution.id || execution._id;

    // Dispatch to background queue
    const queueInfo = await addExecutionToQueue(executionId);

    return {
      execution,
      queueInfo,
    };
  }

  async listExecutions(userId, query = {}) {
    const filter = { owner: userId };
    if (query.workflowId) filter.workflowId = query.workflowId;
    if (query.status) filter.status = query.status;

    const limit = parseInt(query.limit, 10) || 20;
    const page = parseInt(query.page, 10) || 1;
    const skip = (page - 1) * limit;

    const total = await Execution.countDocuments(filter);
    const executions = await Execution.find(filter, { limit, skip });

    return {
      executions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getExecutionById(executionId, userId) {
    const execution = await Execution.findById(executionId);
    if (!execution) {
      const err = new Error('Execution run not found');
      err.statusCode = 404;
      err.code = 'EXECUTION_NOT_FOUND';
      throw err;
    }
    if (execution.owner !== userId) {
      const err = new Error('Unauthorized');
      err.statusCode = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }
    return execution;
  }

  async getTimeline(executionId, userId) {
    await this.getExecutionById(executionId, userId);
    const logs = await ExecutionLog.findByExecutionId(executionId);
    return logs;
  }

  async pauseExecution(executionId, userId) {
    await this.getExecutionById(executionId, userId);
    orchestrator.setExecutionControl(executionId, 'pause');
    return { success: true, executionId, action: 'PAUSED' };
  }

  async resumeExecution(executionId, userId) {
    await this.getExecutionById(executionId, userId);
    orchestrator.setExecutionControl(executionId, 'run');
    // Re-dispatch
    addExecutionToQueue(executionId);
    return { success: true, executionId, action: 'RESUMED' };
  }

  async cancelExecution(executionId, userId) {
    await this.getExecutionById(executionId, userId);
    orchestrator.setExecutionControl(executionId, 'cancel');
    return { success: true, executionId, action: 'CANCELLED' };
  }
}

module.exports = new ExecutionService();
