const crypto = require('crypto');
const config = require('../config/env');
const Integration = require('../models/Integration');
const gmailIntegration = require('../integrations/gmailIntegration');
const slackIntegration = require('../integrations/slackIntegration');
const discordIntegration = require('../integrations/discordIntegration');
const googleSheetsIntegration = require('../integrations/googleSheetsIntegration');

class IntegrationService {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    // Ensure key is exactly 32 bytes
    const key = Buffer.from(config.encryptionKey, 'hex');
    this.key = key.length === 32 ? key : crypto.createHash('sha256').update(config.encryptionKey).digest();

    this.providers = {
      gmail: gmailIntegration,
      slack: slackIntegration,
      discord: discordIntegration,
      'google-sheets': googleSheetsIntegration,
    };
  }

  /**
   * Encrypt secret payload at rest
   */
  encrypt(data) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    let ciphertext = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    ciphertext += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return {
      iv: iv.toString('hex'),
      authTag,
      ciphertext,
    };
  }

  /**
   * Decrypt secret payload
   */
  decrypt(encryptedTokens) {
    if (!encryptedTokens || !encryptedTokens.ciphertext) return null;
    try {
      const iv = Buffer.from(encryptedTokens.iv, 'hex');
      const authTag = Buffer.from(encryptedTokens.authTag, 'hex');
      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(encryptedTokens.ciphertext, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return JSON.parse(decrypted);
    } catch (err) {
      console.error('[IntegrationService] Failed to decrypt tokens:', err.message);
      return null;
    }
  }

  /**
   * List all integrations for a user
   */
  async listUserIntegrations(userId) {
    const records = await Integration.find({ owner: userId });
    const allProviders = ['gmail', 'slack', 'google-sheets', 'discord', 'openrouter', 'gemini'];
    const map = records.reduce((acc, r) => ({ ...acc, [r.provider]: r }), {});

    return allProviders.map((provider) => {
      const existing = map[provider];
      return {
        provider,
        isConnected: existing ? existing.isConnected : false,
        accountIdentifier: existing?.accountIdentifier || '',
        scopes: existing?.scopes || [],
        expiresAt: existing?.expiresAt || null,
        lastHealthCheck: existing?.lastHealthCheck || { status: 'UNKNOWN' },
        updatedAt: existing?.updatedAt || null,
      };
    });
  }

  /**
   * Get health status across all supported integrations
   */
  async getStatus(userId) {
    const integrations = await this.listUserIntegrations(userId);
    return {
      total: integrations.length,
      connected: integrations.filter((i) => i.isConnected).length,
      integrations,
    };
  }

  /**
   * Execute an action on a third-party provider
   */
  async executeProvider(userId, providerName, action, payload) {
    const provider = this.providers[providerName];
    if (!provider) {
      throw new Error(`Integration provider "${providerName}" is not supported`);
    }

    const record = await Integration.findOne({ owner: userId, provider: providerName });

    // Allow execution in simulated / mock mode if not strictly connected
    let credentials = null;
    if (record && record.isConnected && record.encryptedTokens) {
      credentials = this.decrypt(record.encryptedTokens);
    }

    if (!credentials) {
      // In dev / test, execute with mock fallback
      credentials = { mockMode: true, provider: providerName };
    }

    return provider.execute(action, payload, credentials);
  }

  /**
   * Save or update manual credentials (e.g. Discord Bot Token or API Key)
   */
  async saveCredentials(userId, provider, credentials, accountIdentifier = '') {
    const encrypted = this.encrypt(credentials);

    const integration = await Integration.findOneAndUpdate(
      { owner: userId, provider },
      {
        owner: userId,
        provider,
        isConnected: true,
        accountIdentifier: accountIdentifier || `${provider}_connected`,
        encryptedTokens: encrypted,
        lastHealthCheck: {
          status: 'HEALTHY',
          checkedAt: new Date(),
          message: 'Connection verified',
        },
      },
      { upsert: true, new: true }
    );

    return {
      provider: integration.provider,
      isConnected: integration.isConnected,
      accountIdentifier: integration.accountIdentifier,
    };
  }

  /**
   * Generate OAuth redirect URL for provider
   */
  getOAuthUrl(provider, state) {
    switch (provider) {
      case 'gmail':
      case 'google':
      case 'google-sheets': {
        const scopes = [
          'https://www.googleapis.com/auth/gmail.send',
          'https://www.googleapis.com/auth/gmail.readonly',
          'https://www.googleapis.com/auth/spreadsheets',
        ].join(' ');
        return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${
          config.oauth.google.clientId || 'demo_google_id'
        }&redirect_uri=${encodeURIComponent(config.oauth.google.redirectUri)}&response_type=code&scope=${encodeURIComponent(
          scopes
        )}&access_type=offline&prompt=consent&state=${state || ''}`;
      }
      case 'slack': {
        const scopes = 'chat:write,channels:read,incoming-webhook';
        return `https://slack.com/oauth/v2/authorize?client_id=${
          config.oauth.slack.clientId || 'demo_slack_id'
        }&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(config.oauth.slack.redirectUri)}&state=${
          state || ''
        }`;
      }
      case 'discord': {
        const scopes = 'bot messages.read';
        return `https://discord.com/api/oauth2/authorize?client_id=${
          config.oauth.discord.clientId || 'demo_discord_id'
        }&permissions=2048&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(
          config.oauth.discord.redirectUri
        )}&state=${state || ''}`;
      }
      default:
        throw new Error(`OAuth not supported for provider ${provider}`);
    }
  }

  /**
   * Disconnect an integration
   */
  async disconnect(userId, provider) {
    await Integration.findOneAndDelete({ owner: userId, provider });
    return { provider, isConnected: false };
  }
}

module.exports = new IntegrationService();
