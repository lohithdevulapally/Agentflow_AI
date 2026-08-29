const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { inMemoryStore, getDBStatus } = require('../config/db');

const executionLogSchema = new mongoose.Schema(
  {
    executionId: { type: String, required: true, index: true },
    workflowId: { type: String, required: true },
    nodeId: { type: String, default: null },
    agent: {
      type: String,
      enum: ['planner', 'execution', 'validation', 'recovery', 'monitoring', 'orchestrator'],
      required: true,
    },
    level: {
      type: String,
      enum: ['info', 'warning', 'error', 'success'],
      default: 'info',
    },
    message: { type: String, required: true },
    metadata: { type: Object, default: {} },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

let MongooseExecutionLogModel;
try {
  MongooseExecutionLogModel = mongoose.model('ExecutionLog', executionLogSchema);
} catch (e) {
  MongooseExecutionLogModel = mongoose.model('ExecutionLog');
}

const ExecutionLog = {
  async create(data) {
    if (!getDBStatus().isInMemoryFallback) {
      const doc = await MongooseExecutionLogModel.create(data);
      return doc.toObject();
    }
    const id = uuidv4();
    const now = new Date();
    const log = {
      _id: id,
      id,
      executionId: data.executionId,
      workflowId: data.workflowId,
      nodeId: data.nodeId || null,
      agent: data.agent,
      level: data.level || 'info',
      message: data.message,
      metadata: data.metadata || {},
      timestamp: data.timestamp || now,
      createdAt: now,
      updatedAt: now,
    };
    inMemoryStore.executionLogs.set(id, log);
    return log;
  },

  async findByExecutionId(executionId) {
    if (!getDBStatus().isInMemoryFallback) {
      const docs = await MongooseExecutionLogModel.find({ executionId }).sort({ timestamp: 1 }).exec();
      return docs.map((d) => d.toObject());
    }
    const logs = Array.from(inMemoryStore.executionLogs.values())
      .filter((l) => l.executionId === executionId)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    return logs;
  },
};

module.exports = ExecutionLog;
