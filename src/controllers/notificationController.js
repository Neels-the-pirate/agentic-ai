const notificationService = require('../services/notificationService');

class NotificationController {
  async listNotifications(req, res, next) {
    try {
      const notifications = await notificationService.listUserNotifications(req.user._id);
      res.json({ success: true, notifications });
    } catch (err) {
      next(err);
    }
  }

  async markAsRead(req, res, next) {
    try {
      const notification = await notificationService.markAsRead(req.user._id, req.params.id);
      res.json({ success: true, notification });
    } catch (err) {
      next(err);
    }
  }

  async markAllAsRead(req, res, next) {
    try {
      await notificationService.markAllAsRead(req.user._id);
      res.json({ success: true, message: 'All notifications marked as read' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new NotificationController();
