const ExecutionLog = require('../models/ExecutionLog');
const { getIO } = require('../config/socket');

/**
 * Monitoring Agent
 * Emits timeline events and telemetry logs to MongoDB and Socket.IO
 */
class MonitoringAgent {
  constructor() {
    this.name = 'monitoring';
  }

  /**
   * Log an agent timeline event
   * @param {object} params - { executionId, workflowId, nodeId, agent, level, message, metadata }
   */
  async logEvent({ executionId, workflowId, nodeId = null, agent, level = 'info', message, metadata = {} }) {
    try {
      const logEntry = await ExecutionLog.create({
        executionId,
        workflowId,
        nodeId,
        agent,
        level,
        message,
        metadata,
        timestamp: new Date(),
      });

      // Broadcast event in real-time to subscribed WebSocket clients
      const io = getIO();
      io.to(`execution:${executionId}`).emit('execution:event', {
        id: logEntry._id,
        executionId,
        workflowId,
        nodeId,
        agent,
        level,
        message,
        metadata,
        timestamp: logEntry.timestamp,
      });

      return logEntry;
    } catch (err) {
      console.error('[MonitoringAgent] Failed to write timeline log:', err.message);
      return null;
    }
  }

  /**
   * Broadcast execution status change
   */
  broadcastStatus(executionId, status, extra = {}) {
    const io = getIO();
    io.to(`execution:${executionId}`).emit('execution:status', {
      executionId,
      status,
      ...extra,
      timestamp: new Date(),
    });
  }
}

module.exports = new MonitoringAgent();
