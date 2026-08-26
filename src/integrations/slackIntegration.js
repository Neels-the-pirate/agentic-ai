const axios = require('axios');
const BaseIntegration = require('./baseIntegration');

class SlackIntegration extends BaseIntegration {
  constructor() {
    super('slack');
  }

  async testConnection(credentials) {
    if (!credentials || (!credentials.accessToken && !credentials.webhookUrl)) {
      return { ok: false, message: 'Missing Slack credentials or webhook' };
    }
    try {
      if (credentials.mockMode || !credentials.accessToken) {
        return { ok: true, team: 'Agentflow Workspace' };
      }
      const response = await axios.post(
        'https://slack.com/api/auth.test',
        {},
        { headers: { Authorization: `Bearer ${credentials.accessToken}` } }
      );
      if (!response.data.ok) {
        return { ok: false, message: response.data.error };
      }
      return { ok: true, team: response.data.team, user: response.data.user };
    } catch (err) {
      return { ok: false, message: err.message };
    }
  }

  async execute(action, payload, credentials) {
    switch (action) {
      case 'post_message':
      case 'send_message':
        return this.postMessage(payload, credentials);
      default:
        throw new Error(`Unsupported Slack action: ${action}`);
    }
  }

  async postMessage(payload, credentials) {
    const { channel = '#general', text, blocks } = payload;
    if (!text && !blocks) {
      throw new Error('Slack post_message requires "text" or "blocks" content');
    }

    if (credentials?.webhookUrl) {
      await axios.post(credentials.webhookUrl, { text, blocks });
      return { success: true, channel, delivery: 'webhook' };
    }

    if (credentials?.accessToken && !credentials.mockMode) {
      const res = await axios.post(
        'https://slack.com/api/chat.postMessage',
        { channel, text, blocks },
        { headers: { Authorization: `Bearer ${credentials.accessToken}` } }
      );
      if (!res.data.ok) {
        throw new Error(`Slack API error: ${res.data.error}`);
      }
      return { success: true, channel, messageTs: res.data.ts };
    }

    // Emulated execution mode
    return {
      success: true,
      simulated: true,
      channel,
      messageTs: `${Date.now()}.000100`,
      text,
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = new SlackIntegration();
