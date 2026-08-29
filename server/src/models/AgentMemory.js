const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { inMemoryStore, getDBStatus } = require('../config/db');

const agentMemorySchema = new mongoose.Schema(
  {
    workflowId: { type: String, required: true },
    executionId: { type: String, required: true },
    agentId: { type: String, required: true },
    key: { type: String, required: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
    confidenceScore: { type: Number, default: 1.0 },
  },
  { timestamps: true }
);

let MongooseAgentMemoryModel;
try {
  MongooseAgentMemoryModel = mongoose.model('AgentMemory', agentMemorySchema);
} catch (e) {
  MongooseAgentMemoryModel = mongoose.model('AgentMemory');
}

const AgentMemory = {
  async set({ workflowId, executionId, agentId, key, value, confidenceScore = 1.0 }) {
    if (!getDBStatus().isInMemoryFallback) {
      const doc = await MongooseAgentMemoryModel.findOneAndUpdate(
        { executionId, agentId, key },
        { workflowId, executionId, agentId, key, value, confidenceScore },
        { upsert: true, new: true }
      );
      return doc.toObject();
    }
    const memKey = `${executionId}:${agentId}:${key}`;
    const id = uuidv4();
    const memoryItem = {
      _id: id,
      workflowId,
      executionId,
      agentId,
      key,
      value,
      confidenceScore,
      updatedAt: new Date(),
    };
    inMemoryStore.agentMemories.set(memKey, memoryItem);
    return memoryItem;
  },

  async get({ executionId, agentId, key }) {
    if (!getDBStatus().isInMemoryFallback) {
      const doc = await MongooseAgentMemoryModel.findOne({ executionId, agentId, key }).exec();
      return doc ? doc.toObject() : null;
    }
    const memKey = `${executionId}:${agentId}:${key}`;
    return inMemoryStore.agentMemories.get(memKey) || null;
  },

  async getAllByExecution(executionId) {
    if (!getDBStatus().isInMemoryFallback) {
      const docs = await MongooseAgentMemoryModel.find({ executionId }).exec();
      return docs.map((d) => d.toObject());
    }
    return Array.from(inMemoryStore.agentMemories.values()).filter((m) => m.executionId === executionId);
  },
};

module.exports = AgentMemory;
