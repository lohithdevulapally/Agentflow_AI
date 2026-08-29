const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { inMemoryStore, getDBStatus } = require('../config/db');

const workflowSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    owner: { type: String, required: true },
    status: { type: String, enum: ['draft', 'active', 'paused', 'archived'], default: 'draft' },
    triggerConfig: {
      type: { type: String, default: 'manual' },
      scheduleCron: { type: String, default: '' },
      webhookPath: { type: String, default: '' },
      eventSource: { type: String, default: '' },
    },
    nodes: { type: Array, default: [] },
    edges: { type: Array, default: [] },
    version: { type: Number, default: 1 },
    tags: { type: [String], default: [] },
  },
  { timestamps: true }
);

let MongooseWorkflowModel;
try {
  MongooseWorkflowModel = mongoose.model('Workflow', workflowSchema);
} catch (e) {
  MongooseWorkflowModel = mongoose.model('Workflow');
}

const Workflow = {
  async create(data) {
    if (!getDBStatus().isInMemoryFallback) {
      const doc = await MongooseWorkflowModel.create(data);
      return doc.toObject();
    }
    const id = uuidv4();
    const now = new Date();
    const workflow = {
      _id: id,
      id,
      name: data.name,
      description: data.description || '',
      owner: data.owner,
      status: data.status || 'draft',
      triggerConfig: data.triggerConfig || { type: 'manual' },
      nodes: data.nodes || [],
      edges: data.edges || [],
      version: data.version || 1,
      tags: data.tags || [],
      createdAt: now,
      updatedAt: now,
    };
    inMemoryStore.workflows.set(id, workflow);
    return workflow;
  },

  async find(filter = {}, options = {}) {
    if (!getDBStatus().isInMemoryFallback) {
      let query = MongooseWorkflowModel.find(filter);
      if (options.sort) query = query.sort(options.sort);
      if (options.limit) query = query.limit(options.limit);
      if (options.skip) query = query.skip(options.skip);
      const docs = await query.exec();
      return docs.map((d) => d.toObject());
    }
    let items = Array.from(inMemoryStore.workflows.values());
    if (filter.owner) items = items.filter((w) => w.owner === filter.owner);
    if (filter.status) items = items.filter((w) => w.status === filter.status);
    if (filter.search) {
      const q = filter.search.toLowerCase();
      items = items.filter((w) => w.name.toLowerCase().includes(q) || w.description.toLowerCase().includes(q));
    }
    items.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    if (options.skip) items = items.slice(options.skip);
    if (options.limit) items = items.slice(0, options.limit);
    return items;
  },

  async countDocuments(filter = {}) {
    if (!getDBStatus().isInMemoryFallback) {
      return MongooseWorkflowModel.countDocuments(filter);
    }
    let items = Array.from(inMemoryStore.workflows.values());
    if (filter.owner) items = items.filter((w) => w.owner === filter.owner);
    if (filter.status) items = items.filter((w) => w.status === filter.status);
    return items.length;
  },

  async findById(id) {
    if (!getDBStatus().isInMemoryFallback) {
      const doc = await MongooseWorkflowModel.findById(id);
      return doc ? doc.toObject() : null;
    }
    return inMemoryStore.workflows.get(id) || null;
  },

  async findByIdAndUpdate(id, updates, options = { new: true }) {
    if (!getDBStatus().isInMemoryFallback) {
      const doc = await MongooseWorkflowModel.findByIdAndUpdate(id, updates, options);
      return doc ? doc.toObject() : null;
    }
    const existing = inMemoryStore.workflows.get(id);
    if (!existing) return null;
    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    inMemoryStore.workflows.set(id, updated);
    return updated;
  },

  async findByIdAndDelete(id) {
    if (!getDBStatus().isInMemoryFallback) {
      const doc = await MongooseWorkflowModel.findByIdAndDelete(id);
      return doc ? doc.toObject() : null;
    }
    const existing = inMemoryStore.workflows.get(id);
    if (!existing) return null;
    inMemoryStore.workflows.delete(id);
    return existing;
  },
};

module.exports = Workflow;
