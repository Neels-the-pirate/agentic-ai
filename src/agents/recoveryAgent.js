/**
 * Recovery Agent
 * Classifies failure types and determines mitigation strategies (retry_with_backoff vs escalate).
 */
class RecoveryAgent {
  constructor() {
    this.name = 'recovery';
  }

  /**
   * Classify an error and formulate recovery strategy
   * @param {Error|object} error - Occurred error or validation failure
   * @param {object} context - Execution context and current retry count
   * @returns {object} { classification, strategy, delayMs, canRetry, reason }
   */
  async handleFailure(error, context = {}) {
    const message = (error.message || String(error)).toLowerCase();
    const currentRetry = context.retryCount || 0;
    const maxRetries = context.maxRetries || 3;

    let classification = 'API_FAILURE';

    if (error.missingFields || message.includes('missing field') || message.includes('validation failed')) {
      classification = 'MISSING_FIELDS';
    } else if (
      message.includes('auth_expired') ||
      message.includes('integration_not_connected') ||
      message.includes('unauthorized') ||
      message.includes('invalid_grant') ||
      message.includes('token expired')
    ) {
      classification = 'AUTH_EXPIRED';
    } else if (
      message.includes('rate limit') ||
      message.includes('429') ||
      message.includes('too many requests')
    ) {
      classification = 'RATE_LIMIT';
    } else if (
      message.includes('timeout') ||
      message.includes('econnreset') ||
      message.includes('econnrefused') ||
      message.includes('503') ||
      message.includes('network')
    ) {
      classification = 'TRANSIENT';
    }

    // Determine strategy
    let strategy = 'escalate';
    let delayMs = 0;
    let canRetry = false;

    // Retryable classifications
    if (['TRANSIENT', 'RATE_LIMIT', 'API_FAILURE'].includes(classification)) {
      if (currentRetry < maxRetries) {
        canRetry = true;
        strategy = 'retry_with_backoff';
        // Exponential backoff: 1s, 2s, 4s...
        const baseDelay = classification === 'RATE_LIMIT' ? 3000 : 1000;
        delayMs = baseDelay * Math.pow(2, currentRetry);
      } else {
        strategy = 'escalate';
      }
    } else if (classification === 'AUTH_EXPIRED' || classification === 'MISSING_FIELDS') {
      // Non-transient errors must escalate immediately to alert operator
      strategy = 'escalate';
      canRetry = false;
    }

    return {
      classification,
      strategy, // 'retry_with_backoff' | 'escalate'
      canRetry,
      delayMs,
      retryCount: currentRetry + (canRetry ? 1 : 0),
      reason: `Classified as ${classification}. Strategy: ${strategy} (attempt ${currentRetry + 1}/${maxRetries})`,
    };
  }
}

module.exports = new RecoveryAgent();
