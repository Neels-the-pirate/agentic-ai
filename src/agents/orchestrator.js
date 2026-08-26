const plannerAgent = require('./plannerAgent');
const executionAgent = require('./executionAgent');
const validationAgent = require('./validationAgent');
const recoveryAgent = require('./recoveryAgent');
const monitoringAgent = require('./monitoringAgent');
const Execution = require('../models/Execution');
const AgentMemory = require('../models/AgentMemory');
const Notification = require('../models/Notification');
const { getIO } = require('../config/socket');

// Detect whether optional LangGraph package is installed
let langGraphStatus = 'not-installed';
try {
  require.resolve('@langchain/langgraph');
  langGraphStatus = 'available';
} catch (e) {
  langGraphStatus = 'not-installed';
}

/**
 * Orchestrator Engine
 * Coordinates the 5-agent execution pipeline:
 * Planner -> Execution -> Validation -> Recovery -> Monitoring
 */
class Orchestrator {
  constructor() {
    this.langGraphStatus = langGraphStatus;
  }

  /**
   * Execute an entire workflow run
   * @param {string} executionId - Execution document ID
   * @param {object} services - { integrationService, aiService }
   */
  async run(executionId, { integrationService, aiService }) {
    const execution = await Execution.findById(executionId);
    if (!execution) {
      throw new Error(`Execution record ${executionId} not found`);
    }

    const { workflowId, owner, snapshot, inputs = {} } = execution;
    const startTime = Date.now();

    try {
      // 1. Update status to RUNNING
      execution.status = 'RUNNING';
      execution.startTime = new Date();
      execution.orchestrationMeta.langGraph = this.langGraphStatus;
      await execution.save();

      monitoringAgent.broadcastStatus(executionId, 'RUNNING');
      await monitoringAgent.logEvent({
        executionId,
        workflowId,
        agent: 'orchestrator',
        level: 'info',
        message: `Execution initiated. Orchestration substrate: ${this.langGraphStatus}`,
        metadata: { langGraph: this.langGraphStatus },
      });

      // 2. Stage 1: Planner Agent
      await monitoringAgent.logEvent({
        executionId,
        workflowId,
        agent: 'planner',
        level: 'info',
        message: 'Planner Agent analyzing graph topology and dependencies...',
      });

      const planResult = await plannerAgent.plan({
        nodes: snapshot.nodes || [],
        edges: snapshot.edges || [],
      });

      if (!planResult.success) {
        throw new Error(`Planning failed: ${planResult.error}`);
      }

      execution.orchestrationMeta.plannerConfidence = planResult.confidence;
      execution.orchestrationMeta.executionPlan = planResult.plan;
      await execution.save();

      await monitoringAgent.logEvent({
        executionId,
        workflowId,
        agent: 'planner',
        level: 'success',
        message: `Plan computed: ${planResult.plan.length} nodes ordered with confidence ${(
          planResult.confidence * 100
        ).toFixed(1)}%`,
        metadata: { plan: planResult.plan, confidence: planResult.confidence, warnings: planResult.warnings },
      });

      // 3. Stage 2-5: Step through planned nodes
      const nodeOutputs = {};
      let lastOutput = inputs;
      const nodesMap = (snapshot.nodes || []).reduce((acc, n) => ({ ...acc, [String(n.id)]: n }), {});

      for (let i = 0; i < planResult.plan.length; i++) {
        const nodeId = planResult.plan[i];
        const node = nodesMap[nodeId];

        // Check if execution was paused or cancelled by user in MongoDB
        const freshExecution = await Execution.findById(executionId);
        if (freshExecution.status === 'CANCELLED') {
          await monitoringAgent.logEvent({
            executionId,
            workflowId,
            nodeId,
            agent: 'orchestrator',
            level: 'warning',
            message: 'Execution was cancelled by operator.',
          });
          return;
        }

        if (freshExecution.status === 'PAUSED') {
          await monitoringAgent.logEvent({
            executionId,
            workflowId,
            nodeId,
            agent: 'orchestrator',
            level: 'warning',
            message: `Execution paused at node: ${node?.data?.label || nodeId}`,
          });
          return;
        }

        execution.currentNode = nodeId;
        await execution.save();

        if (!node) {
          await monitoringAgent.logEvent({
            executionId,
            workflowId,
            nodeId,
            agent: 'orchestrator',
            level: 'warning',
            message: `Node definition for ID ${nodeId} not found, skipping...`,
          });
          continue;
        }

        // --- Execution Step with Recovery Retry Loop ---
        let stepSuccess = false;
        let retryAttempt = 0;
        const maxRetries = 3;
        let stepResult = null;

        while (!stepSuccess && retryAttempt <= maxRetries) {
          try {
            await monitoringAgent.logEvent({
              executionId,
              workflowId,
              nodeId,
              agent: 'execution',
              level: 'info',
              message: `Executing node: "${node.data?.label || nodeId}" (${node.type || 'standard'})`,
              metadata: { attempt: retryAttempt + 1 },
            });

            // Run Node via Execution Agent
            stepResult = await executionAgent.executeNode(
              node,
              { inputs, lastOutput, nodeOutputs },
              integrationService,
              aiService,
              owner.toString()
            );

            // Run Validation Agent
            const validation = await validationAgent.validate(node, stepResult);

            if (!validation.isValid) {
              throw new Error(validation.message);
            }

            await monitoringAgent.logEvent({
              executionId,
              workflowId,
              nodeId,
              agent: 'validation',
              level: 'success',
              message: validation.message,
              metadata: { isValid: true },
            });

            stepSuccess = true;
          } catch (stepError) {
            // Run Recovery Agent
            const recoveryDecision = await recoveryAgent.handleFailure(stepError, {
              retryCount: retryAttempt,
              maxRetries,
            });

            await monitoringAgent.logEvent({
              executionId,
              workflowId,
              nodeId,
              agent: 'recovery',
              level: recoveryDecision.strategy === 'retry_with_backoff' ? 'warning' : 'error',
              message: `Recovery Agent: ${recoveryDecision.reason}`,
              metadata: recoveryDecision,
            });

            if (recoveryDecision.strategy === 'retry_with_backoff' && recoveryDecision.canRetry) {
              retryAttempt += 1;
              execution.retryCount += 1;
              execution.status = 'RETRYING';
              await execution.save();
              monitoringAgent.broadcastStatus(executionId, 'RETRYING', { delayMs: recoveryDecision.delayMs });

              // Sleep for exponential backoff duration
              await new Promise((resolve) => setTimeout(resolve, recoveryDecision.delayMs));
              execution.status = 'RUNNING';
              await execution.save();
            } else {
              // Escalate failure
              execution.status = 'FAILED';
              execution.endTime = new Date();
              execution.duration = Date.now() - startTime;
              execution.error = {
                code: recoveryDecision.classification,
                message: stepError.message,
                failedNodeId: nodeId,
              };
              await execution.save();

              monitoringAgent.broadcastStatus(executionId, 'FAILED', { error: execution.error });

              // Persist notification for operator
              const alert = await Notification.create({
                owner,
                workflowId,
                executionId,
                type: 'error',
                title: `Workflow Execution Failed: ${snapshot.name}`,
                message: `Failed at node "${node.data?.label || nodeId}": ${stepError.message} (${recoveryDecision.classification})`,
              });

              const io = getIO();
              io.to(`user:${owner}`).emit('notification:new', alert);

              return;
            }
          }
        }

        // Record node outputs & context memory
        nodeOutputs[nodeId] = stepResult.output;
        lastOutput = stepResult.output;

        await AgentMemory.create({
          workflowId,
          executionId,
          agentId: 'execution',
          key: `output:${nodeId}`,
          value: stepResult.output,
          confidenceScore: 1.0,
        });

        // Monitoring log for node completion
        await monitoringAgent.logEvent({
          executionId,
          workflowId,
          nodeId,
          agent: 'monitoring',
          level: 'info',
          message: `Node "${node.data?.label || nodeId}" completed in ${stepResult.duration}ms. Progress: ${Math.round(
            ((i + 1) / planResult.plan.length) * 100
          )}%`,
          metadata: { durationMs: stepResult.duration },
        });
      }

      // 4. Execution Completed Successfully
      execution.status = 'COMPLETED';
      execution.currentNode = null;
      execution.endTime = new Date();
      execution.duration = Date.now() - startTime;
      execution.nodeOutputs = nodeOutputs;
      execution.outputs = lastOutput;
      await execution.save();

      monitoringAgent.broadcastStatus(executionId, 'COMPLETED', {
        duration: execution.duration,
        outputs: execution.outputs,
      });

      await monitoringAgent.logEvent({
        executionId,
        workflowId,
        agent: 'orchestrator',
        level: 'success',
        message: `Workflow completed successfully in ${execution.duration}ms across ${planResult.plan.length} nodes.`,
        metadata: { duration: execution.duration, totalNodes: planResult.plan.length },
      });

      // Create Success Notification
      const successAlert = await Notification.create({
        owner,
        workflowId,
        executionId,
        type: 'success',
        title: `Workflow Succeeded: ${snapshot.name}`,
        message: `All ${planResult.plan.length} steps executed successfully in ${(execution.duration / 1000).toFixed(2)}s.`,
      });

      const io = getIO();
      io.to(`user:${owner}`).emit('notification:new', successAlert);
    } catch (fatalError) {
      console.error('[Orchestrator] Fatal execution error:', fatalError);
      execution.status = 'FAILED';
      execution.endTime = new Date();
      execution.duration = Date.now() - startTime;
      execution.error = {
        code: 'API_FAILURE',
        message: fatalError.message,
      };
      await execution.save();

      monitoringAgent.broadcastStatus(executionId, 'FAILED', { error: execution.error });
      await monitoringAgent.logEvent({
        executionId,
        workflowId,
        agent: 'orchestrator',
        level: 'error',
        message: `Fatal execution error: ${fatalError.message}`,
        metadata: { stack: fatalError.stack },
      });
    }
  }
}

module.exports = new Orchestrator();
