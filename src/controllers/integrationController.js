const integrationService = require('../services/integrationService');

class IntegrationController {
  async listIntegrations(req, res, next) {
    try {
      const integrations = await integrationService.listUserIntegrations(req.user._id);
      res.json({ success: true, integrations });
    } catch (err) {
      next(err);
    }
  }

  async getStatus(req, res, next) {
    try {
      const status = await integrationService.getStatus(req.user._id);
      res.json({ success: true, ...status });
    } catch (err) {
      next(err);
    }
  }

  async startOAuth(req, res, next) {
    try {
      const { provider } = req.params;
      const state = req.user ? req.user._id.toString() : '';
      const redirectUrl = integrationService.getOAuthUrl(provider, state);
      res.json({ success: true, redirectUrl });
    } catch (err) {
      next(err);
    }
  }

  async handleOAuthCallback(req, res, next) {
    try {
      const { provider } = req.params;
      const { code, state } = req.query;

      // In sandbox / simulated dev, store an active connection record
      const userId = state || req.user?._id;
      if (userId) {
        await integrationService.saveCredentials(
          userId,
          provider,
          { accessToken: `oauth_tok_${provider}_${Date.now()}`, mockMode: true },
          `${provider}_user@company.com`
        );
      }

      // Redirect back to frontend integrations page
      res.redirect('http://localhost:3000/integrations?status=connected&provider=' + provider);
    } catch (err) {
      res.redirect('http://localhost:3000/integrations?status=error&message=' + encodeURIComponent(err.message));
    }
  }

  async oauthError(req, res, next) {
    res.status(400).json({ success: false, message: req.query.message || 'OAuth authorization failed' });
  }

  async saveManualCredentials(req, res, next) {
    try {
      const { provider, credentials, accountIdentifier } = req.body;
      if (!provider || !credentials) {
        return res.status(400).json({ success: false, message: 'Provider and credentials are required' });
      }

      const result = await integrationService.saveCredentials(req.user._id, provider, credentials, accountIdentifier);
      res.json({ success: true, integration: result });
    } catch (err) {
      next(err);
    }
  }

  async disconnectIntegration(req, res, next) {
    try {
      const { provider } = req.params;
      const result = await integrationService.disconnect(req.user._id, provider);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new IntegrationController();
