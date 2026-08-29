const Notification = require('../models/Notification');

class NotificationService {
  async getNotifications(userId) {
    return Notification.findByOwner(userId, 50);
  }

  async markAsRead(notificationId, userId) {
    return Notification.markAsRead(notificationId, userId);
  }

  async markAllAsRead(userId) {
    return Notification.markAllAsRead(userId);
  }
}

module.exports = new NotificationService();
