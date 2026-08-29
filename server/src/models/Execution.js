const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { inMemoryStore, getDBStatus } = require('../config/db');

const executionSchema = new mongoose.Schema(
  {
    workflowId: { type: String, required: true },
    workflowName: { type: String, default: '' },
    owner: { type: String, required: true },
    workflowSnapshot: { type: Object, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'RETRYING', 'PAUSED', 'CANCELLED'],
      default: 'PENDING',
    },
    currentNode: { type: String, default: null },
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date, default: null },
    duration: { type: Number, default: 0 },
    inputs: { type: Object, default: {} },
    outputs: { type: Object, default: {} },
    error: { type: Object, default: null },
    retryCount: { type: Number, default: 0 },
    recoveryAction: { type: String, default: null },
    orchestrationStats: { type: Object, default: {} },
  },
  { timestamps: true }
);

let MongooseExecutionModel;
try {
  MongooseExecutionModel = mongoose.model('Execution', executionSchema);
} catch (e) {
  MongooseExecutionModel = mongoose.model('Execution');
}

const Execution = {
  async create(data) {
    if (!getDBStatus().isInMemoryFallback) {
      const doc = await MongooseExecutionModel.create(data);
      return doc.toObject();
    }
    const id = uuidv4();
    const now = new Date();
    const execution = {
      _id: id,
      id,
      workflowId: data.workflowId,
      workflowName: data.workflowName || '',
      owner: data.owner,
      workflowSnapshot: data.workflowSnapshot,
      status: data.status || 'PENDING',
      currentNode: data.currentNode || null,
      startTime: data.startTime || now,
      endTime: data.endTime || null,
      duration: data.duration || 0,
      inputs: data.inputs || {},
      outputs: data.outputs || {},
      error: data.error || null,
      retryCount: data.retryCount || 0,
      recoveryAction: data.recoveryAction || null,
      orchestrationStats: data.orchestrationStats || {},
      createdAt: now,
      updatedAt: now,
    };
    inMemoryStore.executions.set(id, execution);
    return execution;
  },

  async find(filter = {}, options = {}) {
    if (!getDBStatus().isInMemoryFallback) {
      let query = MongooseExecutionModel.find(filter);
      if (options.sort) query = query.sort(options.sort);
      if (options.limit) query = query.limit(options.limit);
      if (options.skip) query = query.skip(options.skip);
      const docs = await query.exec();
      return docs.map((d) => d.toObject());
    }
    let items = Array.from(inMemoryStore.executions.values());
    if (filter.owner) items = items.filter((e) => e.owner === filter.owner);
    if (filter.workflowId) items = items.filter((e) => e.workflowId === filter.workflowId);
    if (filter.status) items = items.filter((e) => e.status === filter.status);
    items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (options.skip) items = items.slice(options.skip);
    if (options.limit) items = items.slice(0, options.limit);
    return items;
  },

  async countDocuments(filter = {}) {
    if (!getDBStatus().isInMemoryFallback) {
      return MongooseExecutionModel.countDocuments(filter);
    }
    let items = Array.from(inMemoryStore.executions.values());
    if (filter.owner) items = items.filter((e) => e.owner === filter.owner);
    if (filter.workflowId) items = items.filter((e) => e.workflowId === filter.workflowId);
    if (filter.status) items = items.filter((e) => e.status === filter.status);
    return items.length;
  },

  async findById(id) {
    if (!getDBStatus().isInMemoryFallback) {
      const doc = await MongooseExecutionModel.findById(id);
      return doc ? doc.toObject() : null;
    }
    return inMemoryStore.executions.get(id) || null;
  },

  async findByIdAndUpdate(id, updates, options = { new: true }) {
    if (!getDBStatus().isInMemoryFallback) {
      const doc = await MongooseExecutionModel.findByIdAndUpdate(id, updates, options);
      return doc ? doc.toObject() : null;
    }
    const existing = inMemoryStore.executions.get(id);
    if (!existing) return null;
    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    inMemoryStore.executions.set(id, updated);
    return updated;
  },
};

module.exports = Execution;
