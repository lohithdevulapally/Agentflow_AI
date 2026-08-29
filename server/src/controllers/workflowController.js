const workflowService = require('../services/workflowService');
const aiService = require('../services/aiService');
const executionService = require('../services/executionService');

class WorkflowController {
  async getDashboard(req, res, next) {
    try {
      const stats = await workflowService.getDashboardMetrics(req.user.id);
      return res.status(200).json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  }

  async list(req, res, next) {
    try {
      const result = await workflowService.listWorkflows(req.user.id, req.query);
      return res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const workflow = await workflowService.getWorkflowById(req.params.id, req.user.id);
      return res.status(200).json({ success: true, data: workflow });
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const workflow = await workflowService.createWorkflow(req.user.id, req.body);
      return res.status(201).json({ success: true, data: workflow });
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const updated = await workflowService.updateWorkflow(req.params.id, req.user.id, req.body);
      return res.status(200).json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  async duplicate(req, res, next) {
    try {
      const cloned = await workflowService.duplicateWorkflow(req.params.id, req.user.id);
      return res.status(201).json({ success: true, data: cloned });
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const result = await workflowService.deleteWorkflow(req.params.id, req.user.id);
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async generateFromPrompt(req, res, next) {
    try {
      const { prompt } = req.body;
      const generated = await aiService.generateWorkflowFromPrompt(prompt);
      return res.status(200).json({ success: true, data: generated });
    } catch (err) {
      next(err);
    }
  }

  async execute(req, res, next) {
    try {
      const result = await executionService.triggerExecution(req.params.id, req.user.id, req.body.inputs);
      return res.status(202).json({
        success: true,
        message: 'Workflow execution queued and started',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new WorkflowController();
