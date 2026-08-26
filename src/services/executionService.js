const Execution = require('../models/Execution');
const ExecutionLog = require('../models/ExecutionLog');
const Workflow = require('../models/Workflow');
const { dispatchExecution } = require('../queues/executionQueue');
const monitoringAgent = require('../agents/monitoringAgent');

class ExecutionService {
  /**
   * Trigger a new execution run for a workflow
   */
  async triggerExecution(userId, workflowId, inputs = {}) {
    const workflow = await Workflow.findOne({ _id: workflowId, owner: userId });
    if (!workflow) {
      const err = new Error('Workflow not found');
      err.statusCode = 404;
      throw err;
    }

    if (!workflow.nodes || workflow.nodes.length === 0) {
      const err = new Error('Cannot execute empty workflow. Please add at least one node.');
      err.statusCode = 400;
      throw err;
    }

    // Freeze workflow snapshot at moment of trigger
    const snapshot = {
      name: workflow.name,
      nodes: workflow.nodes,
      edges: workflow.edges,
      triggerConfig: workflow.triggerConfig,
      version: workflow.version,
    };

    const execution = await Execution.create({
      workflowId: workflow._id,
      owner: userId,
      snapshot,
      status: 'PENDING',
      inputs,
      startTime: new Date(),
    });

    // Dispatch to background execution queue
    await dispatchExecution(execution._id.toString());

    return execution;
  }

  /**
   * List executions with pagination and status filters
   */
  async listExecutions(userId, { page = 1, limit = 15, workflowId = '', status = '' }) {
    const query = { owner: userId };
    if (workflowId) query.workflowId = workflowId;
    if (status) query.status = status;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [executions, total] = await Promise.all([
      Execution.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .populate('workflowId', 'name'),
      Execution.countDocuments(query),
    ]);

    return {
      executions,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(total / parseInt(limit, 10)),
      },
    };
  }

  /**
   * Get single execution details
   */
  async getExecutionById(userId, executionId) {
    const execution = await Execution.findOne({ _id: executionId, owner: userId }).populate('workflowId', 'name');
    if (!execution) {
      const err = new Error('Execution run not found');
      err.statusCode = 404;
      throw err;
    }
    return execution;
  }

  /**
   * Get timeline logs for an execution
   */
  async getExecutionTimeline(userId, executionId) {
    await this.getExecutionById(userId, executionId); // Verify ownership
    const logs = await ExecutionLog.find({ executionId }).sort({ timestamp: 1 });
    return logs;
  }

  /**
   * Pause a running execution
   */
  async pauseExecution(userId, executionId) {
    const execution = await this.getExecutionById(userId, executionId);
    if (execution.status !== 'RUNNING' && execution.status !== 'RETRYING') {
      const err = new Error(`Cannot pause execution with status ${execution.status}`);
      err.statusCode = 400;
      throw err;
    }

    execution.status = 'PAUSED';
    await execution.save();
    monitoringAgent.broadcastStatus(executionId, 'PAUSED');

    return execution;
  }

  /**
   * Resume a paused execution
   */
  async resumeExecution(userId, executionId) {
    const execution = await this.getExecutionById(userId, executionId);
    if (execution.status !== 'PAUSED') {
      const err = new Error(`Cannot resume execution with status ${execution.status}`);
      err.statusCode = 400;
      throw err;
    }

    execution.status = 'RUNNING';
    await execution.save();
    monitoringAgent.broadcastStatus(executionId, 'RUNNING');

    // Re-dispatch to execution queue
    await dispatchExecution(execution._id.toString());

    return execution;
  }

  /**
   * Cancel an active execution
   */
  async cancelExecution(userId, executionId) {
    const execution = await this.getExecutionById(userId, executionId);
    if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(execution.status)) {
      const err = new Error(`Execution already finished with status ${execution.status}`);
      err.statusCode = 400;
      throw err;
    }

    execution.status = 'CANCELLED';
    execution.endTime = new Date();
    execution.duration = Date.now() - new Date(execution.startTime).getTime();
    await execution.save();

    monitoringAgent.broadcastStatus(executionId, 'CANCELLED');

    return execution;
  }
}

module.exports = new ExecutionService();
