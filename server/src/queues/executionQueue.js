const { Queue, Worker } = require('bullmq');
const Redis = require('ioredis');
const env = require('../config/env');
const orchestrator = require('../agents/orchestrator');

let bullQueue = null;
let bullWorker = null;
let isRedisActive = false;

// Initialize BullMQ / Redis or Fallback
try {
  const redisConnection = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy: () => null, // Don't crash or hang if Redis is offline
    connectTimeout: 2000,
    lazyConnect: true,
  });

  redisConnection
    .connect()
    .then(() => {
      isRedisActive = true;
      bullQueue = new Queue('workflow-executions', { connection: redisConnection });
      bullWorker = new Worker(
        'workflow-executions',
        async (job) => {
          console.log(`[BullMQ Worker] Processing execution job: ${job.data.executionId}`);
          await orchestrator.runWorkflow(job.data.executionId);
        },
        { connection: redisConnection }
      );
      console.log('[Queue] BullMQ connected to Redis successfully.');
    })
    .catch((err) => {
      console.log(`[Queue] Redis not reachable (${err.message}). Using high-performance Async In-Memory Execution Queue.`);
      isRedisActive = false;
    });
} catch (e) {
  console.log('[Queue] Initializing In-Memory Async Queue for local development.');
}

// In-Memory Async Queue
const asyncInMemoryQueue = {
  enqueue(executionId) {
    // Process asynchronously on the next tick
    setImmediate(async () => {
      try {
        console.log(`[In-Memory Queue] Dispatching execution: ${executionId}`);
        await orchestrator.runWorkflow(executionId);
      } catch (err) {
        console.error(`[In-Memory Queue] Error processing execution ${executionId}:`, err);
      }
    });
  },
};

const addExecutionToQueue = async (executionId) => {
  if (isRedisActive && bullQueue) {
    try {
      await bullQueue.add('execute-workflow', { executionId }, { removeOnComplete: true });
      return { queued: true, type: 'BullMQ (Redis)' };
    } catch (e) {
      console.warn('[Queue] BullMQ add failed, falling back to in-memory dispatch.');
    }
  }

  asyncInMemoryQueue.enqueue(executionId);
  return { queued: true, type: 'In-Memory Async Queue' };
};

module.exports = {
  addExecutionToQueue,
  getQueueStatus: () => ({
    isRedisActive,
    type: isRedisActive ? 'BullMQ (Redis)' : 'In-Memory Async Queue',
  }),
};
