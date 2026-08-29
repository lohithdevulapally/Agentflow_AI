class RecoveryAgent {
  constructor() {
    this.name = 'recovery';
  }

  classifyFailure(error) {
    const code = error.code || '';
    const message = (error.message || '').toLowerCase();

    if (code === 'MISSING_FIELDS' || message.includes('missing required') || message.includes('mandatory')) {
      return {
        category: 'MISSING_FIELDS',
        recoverable: false,
        recommendedAction: 'escalate',
        rationale: 'Payload is missing mandatory schema fields. Human operator inspection required.',
      };
    }

    if (code === 'AUTH_EXPIRED' || code === 'INTEGRATION_NOT_CONNECTED' || message.includes('unauthorized') || message.includes('auth')) {
      return {
        category: 'AUTH_EXPIRED',
        recoverable: false,
        recommendedAction: 'escalate',
        rationale: 'Third-party integration is disconnected or credentials have expired. Operator re-authentication required.',
      };
    }

    if (code === 'RATE_LIMIT' || message.includes('rate limit') || message.includes('429') || message.includes('too many requests')) {
      return {
        category: 'RATE_LIMIT',
        recoverable: true,
        recommendedAction: 'retry_with_backoff',
        backoffDelayMs: 2500,
        rationale: 'Upstream rate limit reached. Retrying with exponential backoff delay.',
      };
    }

    if (message.includes('timeout') || message.includes('econnreset') || message.includes('etimedout') || message.includes('network')) {
      return {
        category: 'TRANSIENT',
        recoverable: true,
        recommendedAction: 'retry_with_backoff',
        backoffDelayMs: 1500,
        rationale: 'Transient network failure detected. Retrying node execution.',
      };
    }

    return {
      category: 'API_FAILURE',
      recoverable: true,
      recommendedAction: 'retry_with_backoff',
      backoffDelayMs: 1000,
      rationale: 'Third-party API failure. Attempting single retry before escalation.',
    };
  }

  async handleRecovery(error, retryCount, maxRetries = 2) {
    const classification = this.classifyFailure(error);

    if (classification.recoverable && retryCount < maxRetries) {
      return {
        shouldRetry: true,
        action: 'retry_with_backoff',
        delayMs: classification.backoffDelayMs * Math.pow(2, retryCount),
        classification,
        attempt: retryCount + 1,
      };
    }

    return {
      shouldRetry: false,
      action: 'escalate',
      classification,
      attempt: retryCount,
    };
  }
}

module.exports = new RecoveryAgent();
