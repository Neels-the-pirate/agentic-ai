const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');
const config = require('../config/env');
const orchestrator = require('../agents/orchestrator');

let queueInstance = null;
let workerInstance = null;
let redisConnection = null;
let useInMemoryFallback = false;

// Simple in-memory asynchronous job runner fallback
class InMemoryQueue {
  constructor() {
    this.jobs = [];
    this.isProcessing = false;
  }

  async add(name, data) {
    const job = { id: `inmem_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, name, data };
    this.jobs.push(job);
    setImmediate(() => this.processNext());
    return job;
  }

  async processNext() {
    if (this.isProcessing || this.jobs.length === 0) return;
    this.isProcessing = true;
    const job = this.jobs.shift();

    try {
      // Execute orchestrator with injected services
      const integrationService = require('../services/integrationService');
      const aiService = require('../services/aiService');
      await orchestrator.run(job.data.executionId, { integrationService, aiService });
    } catch (err) {
      console.error('[InMemoryQueue] Job processing error:', err);
    } finally {
      this.isProcessing = false;
      if (this.jobs.length > 0) {
        setImmediate(() => this.processNext());
      }
    }
  }
}

const initExecutionQueue = () => {
  if (!config.redis.host) {
    console.log('[Queue] Redis not configured. Using in-memory execution queue fallback.');
    useInMemoryFallback = true;
    queueInstance = new InMemoryQueue();
    return queueInstance;
  }

  try {
    redisConnection = new IORedis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      retryStrategy: (times) => {
        if (times > 3) {
          console.warn('[Queue] Redis unreachable after 3 attempts. Switching to in-memory queue fallback.');
          useInMemoryFallback = true;
          queueInstance = new InMemoryQueue();
          return null; // stop retrying
        }
        return Math.min(times * 100, 2000);
      },
    });

    redisConnection.on('error', (err) => {
      if (!useInMemoryFallback) {
        console.warn(`[Queue] Redis connection error: ${err.message}. Enabling in-memory fallback.`);
        useInMemoryFallback = true;
        queueInstance = new InMemoryQueue();
      }
    });

    queueInstance = new Queue('workflow-executions', { connection: redisConnection });

    workerInstance = new Worker(
      'workflow-executions',
      async (job) => {
        const { executionId } = job.data;
        const integrationService = require('../services/integrationService');
        const aiService = require('../services/aiService');
        await orchestrator.run(executionId, { integrationService, aiService });
      },
      { connection: redisConnection, concurrency: 5 }
    );

    workerInstance.on('failed', (job, err) => {
      console.error(`[Queue] Job ${job?.id} failed with error:`, err.message);
    });

    console.log('[Queue] BullMQ Redis execution queue initialized.');
  } catch (err) {
    console.warn(`[Queue] Failed to initialize BullMQ (${err.message}). Using in-memory fallback.`);
    useInMemoryFallback = true;
    queueInstance = new InMemoryQueue();
  }

  return queueInstance;
};

const dispatchExecution = async (executionId) => {
  if (!queueInstance) {
    initExecutionQueue();
  }
  return queueInstance.add('run-execution', { executionId });
};

module.exports = { initExecutionQueue, dispatchExecution };
