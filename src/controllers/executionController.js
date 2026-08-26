const executionService = require('../services/executionService');

class ExecutionController {
  async listExecutions(req, res, next) {
    try {
      const { page, limit, workflowId, status } = req.query;
      const result = await executionService.listExecutions(req.user._id, { page, limit, workflowId, status });
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async getExecution(req, res, next) {
    try {
      const execution = await executionService.getExecutionById(req.user._id, req.params.id);
      res.json({ success: true, execution });
    } catch (err) {
      next(err);
    }
  }

  async getTimeline(req, res, next) {
    try {
      const timeline = await executionService.getExecutionTimeline(req.user._id, req.params.id);
      res.json({ success: true, timeline });
    } catch (err) {
      next(err);
    }
  }

  async pauseExecution(req, res, next) {
    try {
      const execution = await executionService.pauseExecution(req.user._id, req.params.id);
      res.json({ success: true, execution });
    } catch (err) {
      next(err);
    }
  }

  async resumeExecution(req, res, next) {
    try {
      const execution = await executionService.resumeExecution(req.user._id, req.params.id);
      res.json({ success: true, execution });
    } catch (err) {
      next(err);
    }
  }

  async cancelExecution(req, res, next) {
    try {
      const execution = await executionService.cancelExecution(req.user._id, req.params.id);
      res.json({ success: true, execution });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ExecutionController();
