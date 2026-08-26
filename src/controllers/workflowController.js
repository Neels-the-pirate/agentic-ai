const workflowService = require('../services/workflowService');
const executionService = require('../services/executionService');
const aiService = require('../services/aiService');
const { validationResult } = require('express-validator');

class WorkflowController {
  async getDashboard(req, res, next) {
    try {
      const stats = await workflowService.getDashboardStats(req.user._id);
      res.json({ success: true, ...stats });
    } catch (err) {
      next(err);
    }
  }

  async listWorkflows(req, res, next) {
    try {
      const { page, limit, search, tag, status } = req.query;
      const result = await workflowService.listWorkflows(req.user._id, { page, limit, search, tag, status });
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async createWorkflow(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const workflow = await workflowService.createWorkflow(req.user._id, req.body);
      res.status(201).json({ success: true, workflow });
    } catch (err) {
      next(err);
    }
  }

  async generateWorkflow(req, res, next) {
    try {
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ success: false, message: 'Prompt is required' });
      }

      const generated = await aiService.generateWorkflowFromPrompt(prompt);
      res.json({ success: true, ...generated });
    } catch (err) {
      next(err);
    }
  }

  async getWorkflow(req, res, next) {
    try {
      const workflow = await workflowService.getWorkflowById(req.user._id, req.params.id);
      res.json({ success: true, workflow });
    } catch (err) {
      next(err);
    }
  }

  async updateWorkflow(req, res, next) {
    try {
      const workflow = await workflowService.updateWorkflow(req.user._id, req.params.id, req.body);
      res.json({ success: true, workflow });
    } catch (err) {
      next(err);
    }
  }

  async duplicateWorkflow(req, res, next) {
    try {
      const workflow = await workflowService.duplicateWorkflow(req.user._id, req.params.id);
      res.status(201).json({ success: true, workflow });
    } catch (err) {
      next(err);
    }
  }

  async executeWorkflow(req, res, next) {
    try {
      const { inputs } = req.body;
      const execution = await executionService.triggerExecution(req.user._id, req.params.id, inputs);
      res.status(202).json({ success: true, execution });
    } catch (err) {
      next(err);
    }
  }

  async deleteWorkflow(req, res, next) {
    try {
      const result = await workflowService.deleteWorkflow(req.user._id, req.params.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new WorkflowController();
