const BaseIntegration = require('./baseIntegration');
const axios = require('axios');

class GmailIntegration extends BaseIntegration {
  constructor() {
    super('gmail');
  }

  async testConnection(credentials) {
    if (!credentials || (!credentials.accessToken && !credentials.isSandbox)) {
      return { connected: false, error: 'MISSING_CREDENTIALS', message: 'No access token provided' };
    }
    if (credentials.isSandbox) {
      return { connected: true, email: credentials.accountEmail || 'operator@gmail.com', mode: 'sandbox' };
    }
    try {
      const res = await axios.get('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
        headers: { Authorization: `Bearer ${credentials.accessToken}` },
        timeout: 5000,
      });
      return { connected: true, email: res.data.emailAddress, messagesTotal: res.data.messagesTotal };
    } catch (err) {
      return { connected: false, error: 'AUTH_EXPIRED', message: err.message };
    }
  }

  async execute(action, params, credentials) {
    if (!credentials || (!credentials.accessToken && !credentials.isSandbox)) {
      const err = new Error('Gmail integration is not connected or authorization has expired.');
      err.code = 'INTEGRATION_NOT_CONNECTED';
      throw err;
    }

    if (action === 'send_email') {
      const { to, subject, body } = params;
      if (!to || !subject) {
        const err = new Error('Missing required fields: to and subject are mandatory');
        err.code = 'MISSING_FIELDS';
        throw err;
      }

      if (credentials.isSandbox) {
        return {
          status: 'success',
          action: 'send_email',
          messageId: `msg_${Date.now()}_sandbox`,
          to,
          subject,
          deliveredAt: new Date().toISOString(),
          mode: 'sandbox',
        };
      }

      // Real Gmail API send
      const rawMessage = Buffer.from(
        `To: ${to}\r\nSubject: ${subject}\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n${body || ''}`
      ).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

      const res = await axios.post(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
        { raw: rawMessage },
        {
          headers: {
            Authorization: `Bearer ${credentials.accessToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 8000,
        }
      );
      return { status: 'success', messageId: res.data.id, threadId: res.data.threadId, to, subject };
    }

    if (action === 'read_inbox') {
      if (credentials.isSandbox) {
        return {
          status: 'success',
          action: 'read_inbox',
          messages: [
            { id: 'm_1', subject: 'Invoice #8492 Processed', from: 'billing@vendor.com', snippet: 'Invoice for $450 attached.' },
            { id: 'm_2', subject: 'System Alert: High CPU', from: 'alerts@ops.internal', snippet: 'Spike detected in cluster 3.' },
          ],
          count: 2,
          mode: 'sandbox',
        };
      }
      const res = await axios.get('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=5', {
        headers: { Authorization: `Bearer ${credentials.accessToken}` },
      });
      return { status: 'success', messages: res.data.messages || [], count: (res.data.messages || []).length };
    }

    throw new Error(`Unsupported Gmail action: ${action}`);
  }

  getMetadata() {
    return {
      provider: 'gmail',
      name: 'Gmail',
      description: 'Send automated transactional emails and trigger workflows from incoming mail.',
      icon: 'Mail',
      actions: [
        { id: 'send_email', label: 'Send Email', params: ['to', 'subject', 'body'] },
        { id: 'read_inbox', label: 'Read Recent Messages', params: ['query', 'maxResults'] },
      ],
    };
  }
}

module.exports = new GmailIntegration();
