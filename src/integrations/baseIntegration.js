/**
 * Base Integration Class
 * Standard interface across Gmail, Slack, Discord, Google Sheets, etc.
 */
class BaseIntegration {
  constructor(providerName) {
    this.provider = providerName;
  }

  /**
   * Check whether this integration requires OAuth
   */
  isOAuth() {
    return true;
  }

  /**
   * Test whether the supplied decrypted credentials are valid
   */
  async testConnection(credentials) {
    throw new Error(`testConnection not implemented for ${this.provider}`);
  }

  /**
   * Execute a specific action for this integration
   * @param {string} action - action identifier e.g., 'send_email', 'post_message'
   * @param {object} payload - action payload
   * @param {object} credentials - decrypted credentials
   */
  async execute(action, payload, credentials) {
    throw new Error(`execute not implemented for ${this.provider}`);
  }
}

module.exports = BaseIntegration;
