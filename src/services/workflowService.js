const Workflow = require('../models/Workflow');
const Execution = require('../models/Execution');

class WorkflowService {
  /**
   * Fetch aggregated dashboard statistics
   */
  async getDashboardStats(userId) {
    const totalWorkflows = await Workflow.countDocuments({ owner: userId });
    const activeWorkflows = await Workflow.countDocuments({ owner: userId, status: 'active' });
    const totalExecutions = await Execution.countDocuments({ owner: userId });
    const successfulExecutions = await Execution.countDocuments({ owner: userId, status: 'COMPLETED' });
    const failedExecutions = await Execution.countDocuments({ owner: userId, status: 'FAILED' });
    const runningExecutions = await Execution.countDocuments({ owner: userId, status: { $in: ['RUNNING', 'RETRYING'] } });

    const successRate = totalExecutions > 0 ? Math.round((successfulExecutions / totalExecutions) * 100) : 100;

    const recentExecutions = await Execution.find({ owner: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('workflowId', 'name');

    const recentWorkflows = await Workflow.find({ owner: userId })
      .sort({ updatedAt: -1 })
      .limit(5);

    return {
      metrics: {
        totalWorkflows,
        activeWorkflows,
        totalExecutions,
        successfulExecutions,
        failedExecutions,
        runningExecutions,
        successRate,
      },
      recentExecutions,
      recentWorkflows,
    };
  }

  /**
   * List workflows with search, tag filtering, and pagination
   */
  async listWorkflows(userId, { page = 1, limit = 10, search = '', tag = '', status = '' }) {
    const query = { owner: userId };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (tag) {
      query.tags = tag;
    }

    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [workflows, total] = await Promise.all([
      Workflow.find(query).sort({ updatedAt: -1 }).skip(skip).limit(parseInt(limit, 10)),
      Workflow.countDocuments(query),
    ]);

    return {
      workflows,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(total / parseInt(limit, 10)),
      },
    };
  }

  /**
   * Create workflow
   */
  async createWorkflow(userId, data) {
    const workflow = await Workflow.create({
      ...data,
      owner: userId,
      version: 1,
    });
    return workflow;
  }

  /**
   * Get workflow by ID
   */
  async getWorkflowById(userId, workflowId) {
    const workflow = await Workflow.findOne({ _id: workflowId, owner: userId });
    if (!workflow) {
      const err = new Error('Workflow not found');
      err.statusCode = 404;
      throw err;
    }
    return workflow;
  }

  /**
   * Update workflow structure and bump version
   */
  async updateWorkflow(userId, workflowId, updates) {
    const workflow = await this.getWorkflowById(userId, workflowId);

    // If nodes or edges changed, bump version number
    if (updates.nodes || updates.edges) {
      updates.version = (workflow.version || 1) + 1;
    }

    Object.assign(workflow, updates);
    await workflow.save();
    return workflow;
  }

  /**
   * Duplicate existing workflow
   */
  async duplicateWorkflow(userId, workflowId) {
    const original = await this.getWorkflowById(userId, workflowId);
    const duplicated = await Workflow.create({
      name: `${original.name} (Copy)`,
      description: original.description,
      owner: userId,
      status: 'draft',
      triggerConfig: original.triggerConfig,
      nodes: original.nodes,
      edges: original.edges,
      version: 1,
      tags: original.tags,
    });
    return duplicated;
  }

  /**
   * Delete workflow
   */
  async deleteWorkflow(userId, workflowId) {
    const result = await Workflow.findOneAndDelete({ _id: workflowId, owner: userId });
    if (!result) {
      const err = new Error('Workflow not found');
      err.statusCode = 404;
      throw err;
    }
    return { success: true, message: 'Workflow deleted successfully' };
  }
}

module.exports = new WorkflowService();
