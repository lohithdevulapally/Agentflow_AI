const crypto = require('crypto');
const env = require('../config/env');
const Integration = require('../models/Integration');

// Integration providers
const gmailIntegration = require('../integrations/gmailIntegration');
const slackIntegration = require('../integrations/slackIntegration');
const discordIntegration = require('../integrations/discordIntegration');
const googleSheetsIntegration = require('../integrations/googleSheetsIntegration');

class IntegrationService {
  constructor() {
    this.providers = {
      gmail: gmailIntegration,
      slack: slackIntegration,
      discord: discordIntegration,
      'google-sheets': googleSheetsIntegration,
    };
    // Ensure 32-byte key for AES-256-CBC
    this.encryptionKey = crypto.createHash('sha256').update(env.CREDENTIAL_ENCRYPTION_KEY).digest();
    this.algorithm = 'aes-256-cbc';
  }

  encrypt(text) {
    if (!text) return null;
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  }

  decrypt(encryptedText) {
    if (!encryptedText) return null;
    try {
      const parts = encryptedText.split(':');
      if (parts.length !== 2) return null;
      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];
      const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (e) {
      console.error('[IntegrationService] Failed to decrypt token:', e.message);
      return null;
    }
  }

  getProviderMetadata() {
    return Object.values(this.providers).map((p) => p.getMetadata());
  }

  async getUserIntegrations(userId) {
    const list = await Integration.findByOwner(userId);
    const allMetadata = this.getProviderMetadata();

    return allMetadata.map((meta) => {
      const connectedDoc = list.find((item) => item.provider === meta.provider);
      return {
        provider: meta.provider,
        name: meta.name,
        description: meta.description,
        icon: meta.icon,
        actions: meta.actions,
        isConnected: connectedDoc ? connectedDoc.isConnected : false,
        accountEmail: connectedDoc ? connectedDoc.accountEmail : null,
        accountName: connectedDoc ? connectedDoc.accountName : null,
        updatedAt: connectedDoc ? connectedDoc.updatedAt : null,
        isSandbox: connectedDoc?.metadata?.isSandbox || false,
      };
    });
  }

  async checkStatus(userId) {
    const list = await Integration.findByOwner(userId);
    const results = {};

    for (const [providerKey, providerImpl] of Object.entries(this.providers)) {
      const doc = list.find((item) => item.provider === providerKey);
      if (!doc || !doc.isConnected) {
        results[providerKey] = { isConnected: false, status: 'DISCONNECTED' };
      } else {
        const credentials = {
          accessToken: this.decrypt(doc.encryptedAccessToken),
          accountEmail: doc.accountEmail,
          webhookUrl: doc.metadata?.webhookUrl,
          isSandbox: doc.metadata?.isSandbox,
        };
        const health = await providerImpl.testConnection(credentials);
        results[providerKey] = {
          isConnected: health.connected,
          status: health.connected ? 'ACTIVE' : 'EXPIRED',
          details: health,
        };
      }
    }

    return results;
  }

  async saveCredentials(userId, { provider, accessToken, refreshToken, webhookUrl, accountEmail, accountName, isSandbox = false }) {
    const encryptedAccessToken = this.encrypt(accessToken || 'sandbox_token');
    const encryptedRefreshToken = this.encrypt(refreshToken || '');

    const record = await Integration.upsert({
      owner: userId,
      provider,
      isConnected: true,
      encryptedAccessToken,
      encryptedRefreshToken,
      accountEmail: accountEmail || (isSandbox ? `operator@sandbox.${provider}.com` : ''),
      accountName: accountName || (isSandbox ? `Sandbox (${provider})` : ''),
      metadata: { webhookUrl: webhookUrl || '', isSandbox: Boolean(isSandbox) },
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    return {
      success: true,
      provider: record.provider,
      isConnected: record.isConnected,
      accountEmail: record.accountEmail,
      isSandbox: Boolean(isSandbox),
    };
  }

  async disconnectIntegration(userId, provider) {
    await Integration.deleteOne({ owner: userId, provider });
    return { success: true, provider, isConnected: false };
  }

  async executeIntegrationAction(userId, provider, action, params = {}) {
    const providerImpl = this.providers[provider];
    if (!providerImpl) {
      const err = new Error(`Provider '${provider}' not found`);
      err.code = 'UNKNOWN_PROVIDER';
      throw err;
    }

    const doc = await Integration.findOne({ owner: userId, provider });
    if (!doc || !doc.isConnected) {
      const err = new Error(`Integration '${provider}' is not connected. Please connect it in Integrations.`);
      err.code = 'INTEGRATION_NOT_CONNECTED';
      throw err;
    }

    const credentials = {
      accessToken: this.decrypt(doc.encryptedAccessToken),
      webhookUrl: doc.metadata?.webhookUrl,
      accountEmail: doc.accountEmail,
      isSandbox: doc.metadata?.isSandbox || false,
    };

    return providerImpl.execute(action, params, credentials);
  }
}

module.exports = new IntegrationService();
