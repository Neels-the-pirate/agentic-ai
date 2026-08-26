const express = require('express');
const { body } = require('express-validator');
const workflowController = require('../controllers/workflowController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// All workflow routes require JWT authentication
router.use(requireAuth);

// GET /api/workflows/dashboard - Aggregated stats
router.get('/dashboard', workflowController.getDashboard);

// POST /api/workflows/generate - AI prompt to workflow graph
router.post('/generate', workflowController.generateWorkflow);

// GET /api/workflows - List workflows
router.get('/', workflowController.listWorkflows);

// POST /api/workflows - Create workflow manually
router.post(
  '/',
  [body('name').trim().notEmpty().withMessage('Workflow name is required')],
  workflowController.createWorkflow
);

// GET /api/workflows/:id - Fetch single workflow
router.get('/:id', workflowController.getWorkflow);

// PUT /api/workflows/:id - Update workflow
router.put('/:id', workflowController.updateWorkflow);

// POST /api/workflows/:id/duplicate - Duplicate workflow
router.post('/:id/duplicate', workflowController.duplicateWorkflow);

// POST /api/workflows/:id/execute - Trigger execution
router.post('/:id/execute', workflowController.executeWorkflow);

// DELETE /api/workflows/:id - Delete workflow
router.delete('/:id', workflowController.deleteWorkflow);

module.exports = router;
