const notificationService = require('../services/notificationService');

class NotificationController {
  async list(req, res, next) {
    try {
      const notifications = await notificationService.getNotifications(req.user.id);
      return res.status(200).json({ success: true, data: notifications });
    } catch (err) {
      next(err);
    }
  }

  async markAsRead(req, res, next) {
    try {
      const result = await notificationService.markAsRead(req.params.id, req.user.id);
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async markAllAsRead(req, res, next) {
    try {
      await notificationService.markAllAsRead(req.user.id);
      return res.status(200).json({ success: true, message: 'All notifications marked as read' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new NotificationController();
