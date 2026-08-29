const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { inMemoryStore, getDBStatus } = require('../config/db');

const notificationSchema = new mongoose.Schema(
  {
    owner: { type: String, required: true },
    workflowId: { type: String, default: null },
    executionId: { type: String, default: null },
    type: {
      type: String,
      enum: ['info', 'success', 'warning', 'error', 'escalation'],
      default: 'info',
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

let MongooseNotificationModel;
try {
  MongooseNotificationModel = mongoose.model('Notification', notificationSchema);
} catch (e) {
  MongooseNotificationModel = mongoose.model('Notification');
}

const Notification = {
  async create(data) {
    if (!getDBStatus().isInMemoryFallback) {
      const doc = await MongooseNotificationModel.create(data);
      return doc.toObject();
    }
    const id = uuidv4();
    const now = new Date();
    const notification = {
      _id: id,
      id,
      owner: data.owner,
      workflowId: data.workflowId || null,
      executionId: data.executionId || null,
      type: data.type || 'info',
      title: data.title,
      message: data.message,
      isRead: false,
      createdAt: now,
      updatedAt: now,
    };
    inMemoryStore.notifications.set(id, notification);
    return notification;
  },

  async findByOwner(owner, limit = 50) {
    if (!getDBStatus().isInMemoryFallback) {
      const docs = await MongooseNotificationModel.find({ owner }).sort({ createdAt: -1 }).limit(limit).exec();
      return docs.map((d) => d.toObject());
    }
    const items = Array.from(inMemoryStore.notifications.values())
      .filter((n) => n.owner === owner)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);
    return items;
  },

  async markAllAsRead(owner) {
    if (!getDBStatus().isInMemoryFallback) {
      await MongooseNotificationModel.updateMany({ owner, isRead: false }, { isRead: true });
      return true;
    }
    for (const [id, notif] of inMemoryStore.notifications.entries()) {
      if (notif.owner === owner) {
        notif.isRead = true;
        inMemoryStore.notifications.set(id, notif);
      }
    }
    return true;
  },

  async markAsRead(id, owner) {
    if (!getDBStatus().isInMemoryFallback) {
      const doc = await MongooseNotificationModel.findOneAndUpdate({ _id: id, owner }, { isRead: true }, { new: true });
      return doc ? doc.toObject() : null;
    }
    const notif = inMemoryStore.notifications.get(id);
    if (notif && notif.owner === owner) {
      notif.isRead = true;
      inMemoryStore.notifications.set(id, notif);
      return notif;
    }
    return null;
  },
};

module.exports = Notification;
