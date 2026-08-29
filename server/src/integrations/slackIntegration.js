const BaseIntegration = require('./baseIntegration');
const axios = require('axios');

class SlackIntegration extends BaseIntegration {
  constructor() {
    super('slack');
  }

  async testConnection(credentials) {
    if (!credentials || (!credentials.accessToken && !credentials.isSandbox)) {
      return { connected: false, error: 'MISSING_CREDENTIALS', message: 'No Slack access token found' };
    }
    if (credentials.isSandbox) {
      return { connected: true, teamName: 'Agentflow Ops Team', channel: '#general', mode: 'sandbox' };
    }
    try {
      const res = await axios.post('https://slack.com/api/auth.test', {}, {
        headers: { Authorization: `Bearer ${credentials.accessToken}` },
        timeout: 5000,
      });
      return { connected: res.data.ok, team: res.data.team, user: res.data.user };
    } catch (err) {
      return { connected: false, error: 'AUTH_EXPIRED', message: err.message };
    }
  }

  async execute(action, params, credentials) {
    if (!credentials || (!credentials.accessToken && !credentials.isSandbox)) {
      const err = new Error('Slack integration is not connected.');
      err.code = 'INTEGRATION_NOT_CONNECTED';
      throw err;
    }

    if (action === 'post_message') {
      const { channel, message, blocks } = params;
      if (!channel || !message) {
        const err = new Error('Missing required fields: channel and message');
        err.code = 'MISSING_FIELDS';
        throw err;
      }

      if (credentials.isSandbox) {
        return {
          status: 'success',
          action: 'post_message',
          channel,
          message,
          ts: `${Date.now() / 1000}`,
          mode: 'sandbox',
        };
      }

      const res = await axios.post(
        'https://slack.com/api/chat.postMessage',
        { channel, text: message, blocks },
        {
          headers: {
            Authorization: `Bearer ${credentials.accessToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 8000,
        }
      );

      if (!res.data.ok) {
        const err = new Error(res.data.error || 'Slack API error');
        err.code = 'API_FAILURE';
        throw err;
      }

      return { status: 'success', channel: res.data.channel, ts: res.data.ts };
    }

    throw new Error(`Unsupported Slack action: ${action}`);
  }

  getMetadata() {
    return {
      provider: 'slack',
      name: 'Slack',
      description: 'Post automated notifications, alerts, and incident summaries into Slack channels.',
      icon: 'MessageSquare',
      actions: [
        { id: 'post_message', label: 'Post Message', params: ['channel', 'message'] },
      ],
    };
  }
}

module.exports = new SlackIntegration();
