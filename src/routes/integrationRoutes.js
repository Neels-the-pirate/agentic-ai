const express = require('express');
const integrationController = require('../controllers/integrationController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Public OAuth callback & error routes
router.get('/oauth/:provider/callback', integrationController.handleOAuthCallback);
router.get('/oauth/error', integrationController.oauthError);

// Protected routes
router.use(requireAuth);
router.get('/', integrationController.listIntegrations);
router.get('/status', integrationController.getStatus);
router.get('/oauth/:provider/start', integrationController.startOAuth);
router.post('/', integrationController.saveManualCredentials);
router.delete('/:provider', integrationController.disconnectIntegration);

module.exports = router;
