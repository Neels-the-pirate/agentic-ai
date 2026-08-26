const mongoose = require('mongoose');

const executionSchema = new mongoose.Schema(
  {
    workflowId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workflow',
      required: true,
      index: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Immutable snapshot of workflow topology at the instant execution was triggered
    snapshot: {
      name: String,
      nodes: [mongoose.Schema.Types.Mixed],
      edges: [mongoose.Schema.Types.Mixed],
      triggerConfig: mongoose.Schema.Types.Mixed,
      version: Number,
    },
    status: {
      type: String,
      enum: ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'RETRYING', 'PAUSED', 'CANCELLED'],
      default: 'PENDING',
      index: true,
    },
    currentNode: {
      type: String,
      default: null,
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: {
      type: Date,
      default: null,
    },
    duration: {
      type: Number, // milliseconds
      default: 0,
    },
    inputs: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    outputs: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    nodeOutputs: {
      type: mongoose.Schema.Types.Mixed,
      default: {}, // Record output payload per node ID: { [nodeId]: { output, status, duration } }
    },
    error: {
      code: String,
      message: String,
      details: mongoose.Schema.Types.Mixed,
      failedNodeId: String,
    },
    retryCount: {
      type: Number,
      default: 0,
    },
    orchestrationMeta: {
      langGraph: {
        type: String,
        enum: ['available', 'not-installed'],
        default: 'not-installed',
      },
      plannerConfidence: {
        type: Number,
        default: 1.0,
      },
      executionPlan: [String],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Execution', executionSchema);
