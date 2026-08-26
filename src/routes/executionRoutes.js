const express = require('express');
const executionController = require('../controllers/executionController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// All execution routes require JWT authentication
router.use(requireAuth);

// GET /api/executions - List all executions
router.get('/', executionController.listExecutions);

// GET /api/executions/:id - Get execution details and snapshot
router.get('/:id', executionController.getExecution);

// GET /api/executions/:id/timeline - Get detailed agent timeline logs
router.get('/:id/timeline', executionController.getTimeline);

// POST /api/executions/:id/pause - Pause running execution
router.post('/:id/pause', executionController.pauseExecution);

// POST /api/executions/:id/resume - Resume paused execution
router.post('/:id/resume', executionController.resumeExecution);

// POST /api/executions/:id/cancel - Cancel execution
router.post('/:id/cancel', executionController.cancelExecution);

module.exports = router;
