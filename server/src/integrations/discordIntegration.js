const BaseIntegration = require('./baseIntegration');
const axios = require('axios');

class DiscordIntegration extends BaseIntegration {
  constructor() {
    super('discord');
  }

  async testConnection(credentials) {
    if (!credentials || (!credentials.webhookUrl && !credentials.accessToken && !credentials.isSandbox)) {
      return { connected: false, error: 'MISSING_CREDENTIALS', message: 'No Discord webhook URL or token provided' };
    }
    return { connected: true, botName: 'Agentflow Bot', mode: credentials.isSandbox ? 'sandbox' : 'live' };
  }

  async execute(action, params, credentials) {
    if (!credentials || (!credentials.webhookUrl && !credentials.accessToken && !credentials.isSandbox)) {
      const err = new Error('Discord integration is not connected.');
      err.code = 'INTEGRATION_NOT_CONNECTED';
      throw err;
    }

    if (action === 'send_message') {
      const { content, username, embeds } = params;
      if (!content && (!embeds || embeds.length === 0)) {
        const err = new Error('Missing required fields: content or embeds');
        err.code = 'MISSING_FIELDS';
        throw err;
      }

      if (credentials.isSandbox || !credentials.webhookUrl) {
        return {
          status: 'success',
          action: 'send_message',
          content,
          deliveredAt: new Date().toISOString(),
          mode: 'sandbox',
        };
      }

      const res = await axios.post(
        credentials.webhookUrl,
        {
          content,
          username: username || 'Agentflow Automation Bot',
          embeds,
        },
        { timeout: 8000 }
      );

      return { status: 'success', statusCode: res.status };
    }

    throw new Error(`Unsupported Discord action: ${action}`);
  }

  getMetadata() {
    return {
      provider: 'discord',
      name: 'Discord',
      description: 'Stream execution alerts, escalation warnings, and status bots to Discord channels.',
      icon: 'Send',
      actions: [
        { id: 'send_message', label: 'Send Webhook Message', params: ['content', 'username'] },
      ],
    };
  }
}

module.exports = new DiscordIntegration();
