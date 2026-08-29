class BaseIntegration {
  constructor(providerName) {
    this.providerName = providerName;
  }

  async testConnection(credentials) {
    throw new Error(`testConnection not implemented for ${this.providerName}`);
  }

  async execute(action, params, credentials) {
    throw new Error(`execute not implemented for ${this.providerName}`);
  }

  getMetadata() {
    return {
      provider: this.providerName,
      capabilities: [],
    };
  }
}

module.exports = BaseIntegration;
