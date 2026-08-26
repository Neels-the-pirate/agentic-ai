const axios = require('axios');
const BaseIntegration = require('./baseIntegration');

class DiscordIntegration extends BaseIntegration {
  constructor() {
    super('discord');
  }

  async testConnection(credentials) {
    if (!credentials || (!credentials.botToken && !credentials.webhookUrl)) {
      return { ok: false, message: 'Missing Discord Bot Token or Webhook URL' };
    }
    try {
      if (credentials.mockMode || !credentials.botToken) {
        return { ok: true, bot: 'AgentflowBot#0001' };
      }
      const token = credentials.botToken.startsWith('Bot ') ? credentials.botToken : `Bot ${credentials.botToken}`;
      const response = await axios.get('https://discord.com/api/v10/users/@me', {
        headers: { Authorization: token },
      });
      return { ok: true, username: `${response.data.username}#${response.data.discriminator}` };
    } catch (err) {
      return { ok: false, message: err.response?.data?.message || err.message };
    }
  }

  async execute(action, payload, credentials) {
    switch (action) {
      case 'post_message':
      case 'send_message':
        return this.postMessage(payload, credentials);
      default:
        throw new Error(`Unsupported Discord action: ${action}`);
    }
  }

  async postMessage(payload, credentials) {
    const { channelId, content, embeds } = payload;
    if (!content && !embeds) {
      throw new Error('Discord message requires "content" or "embeds"');
    }

    if (credentials?.webhookUrl) {
      await axios.post(credentials.webhookUrl, { content, embeds });
      return { success: true, delivery: 'webhook' };
    }

    if (credentials?.botToken && channelId && !credentials.mockMode) {
      const token = credentials.botToken.startsWith('Bot ') ? credentials.botToken : `Bot ${credentials.botToken}`;
      const res = await axios.post(
        `https://discord.com/api/v10/channels/${channelId}/messages`,
        { content, embeds },
        { headers: { Authorization: token } }
      );
      return { success: true, messageId: res.data.id, channelId };
    }

    // Emulated execution mode
    return {
      success: true,
      simulated: true,
      channelId: channelId || 'default-alerts',
      messageId: `disc_${Date.now()}`,
      content,
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = new DiscordIntegration();
