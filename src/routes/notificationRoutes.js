const express = require('express');
const notificationController = require('../controllers/notificationController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

// GET /api/notifications - List user notifications
router.get('/', notificationController.listNotifications);

// POST /api/notifications/read-all - Mark all as read
router.post('/read-all', notificationController.markAllAsRead);

// PUT /api/notifications/:id/read - Mark single notification as read
router.put('/:id/read', notificationController.markAsRead);

module.exports = router;
