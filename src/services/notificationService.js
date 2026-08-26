const Notification = require('../models/Notification');
const { getIO } = require('../config/socket');

class NotificationService {
  /**
   * Get all notifications for user
   */
  async listUserNotifications(userId, limit = 30) {
    return Notification.find({ owner: userId }).sort({ createdAt: -1 }).limit(limit);
  }

  /**
   * Mark notification as read
   */
  async markAsRead(userId, notificationId) {
    return Notification.findOneAndUpdate(
      { _id: notificationId, owner: userId },
      { isRead: true },
      { new: true }
    );
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId) {
    await Notification.updateMany({ owner: userId, isRead: false }, { isRead: true });
    return { success: true };
  }

  /**
   * Create and emit notification
   */
  async createNotification({ owner, workflowId, executionId, type, title, message }) {
    const notification = await Notification.create({
      owner,
      workflowId,
      executionId,
      type,
      title,
      message,
    });

    const io = getIO();
    io.to(`user:${owner}`).emit('notification:new', notification);

    return notification;
  }
}

module.exports = new NotificationService();
