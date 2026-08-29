const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { inMemoryStore, getDBStatus } = require('../config/db');

const integrationSchema = new mongoose.Schema(
  {
    owner: { type: String, required: true },
    provider: {
      type: String,
      enum: ['gmail', 'slack', 'discord', 'google-sheets', 'openrouter', 'gemini'],
      required: true,
    },
    isConnected: { type: Boolean, default: false },
    scopes: { type: [String], default: [] },
    encryptedAccessToken: { type: String, default: null },
    encryptedRefreshToken: { type: String, default: null },
    accountEmail: { type: String, default: '' },
    accountName: { type: String, default: '' },
    metadata: { type: Object, default: {} },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

let MongooseIntegrationModel;
try {
  MongooseIntegrationModel = mongoose.model('Integration', integrationSchema);
} catch (e) {
  MongooseIntegrationModel = mongoose.model('Integration');
}

const Integration = {
  async upsert({ owner, provider, ...data }) {
    if (!getDBStatus().isInMemoryFallback) {
      const doc = await MongooseIntegrationModel.findOneAndUpdate(
        { owner, provider },
        { owner, provider, ...data },
        { upsert: true, new: true }
      );
      return doc.toObject();
    }
    let existingKey = null;
    for (const [key, item] of inMemoryStore.integrations.entries()) {
      if (item.owner === owner && item.provider === provider) {
        existingKey = key;
        break;
      }
    }
    const id = existingKey || uuidv4();
    const now = new Date();
    const existing = existingKey ? inMemoryStore.integrations.get(existingKey) : {};
    const updated = {
      _id: id,
      id,
      owner,
      provider,
      ...existing,
      ...data,
      updatedAt: now,
      createdAt: existing.createdAt || now,
    };
    inMemoryStore.integrations.set(id, updated);
    return updated;
  },

  async findByOwner(owner) {
    if (!getDBStatus().isInMemoryFallback) {
      const docs = await MongooseIntegrationModel.find({ owner }).exec();
      return docs.map((d) => d.toObject());
    }
    return Array.from(inMemoryStore.integrations.values()).filter((i) => i.owner === owner);
  },

  async findOne({ owner, provider }) {
    if (!getDBStatus().isInMemoryFallback) {
      const doc = await MongooseIntegrationModel.findOne({ owner, provider }).exec();
      return doc ? doc.toObject() : null;
    }
    for (const item of inMemoryStore.integrations.values()) {
      if (item.owner === owner && item.provider === provider) {
        return { ...item };
      }
    }
    return null;
  },

  async deleteOne({ owner, provider }) {
    if (!getDBStatus().isInMemoryFallback) {
      return MongooseIntegrationModel.findOneAndDelete({ owner, provider });
    }
    for (const [key, item] of inMemoryStore.integrations.entries()) {
      if (item.owner === owner && item.provider === provider) {
        inMemoryStore.integrations.delete(key);
        return item;
      }
    }
    return null;
  },
};

module.exports = Integration;
