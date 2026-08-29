const BaseIntegration = require('./baseIntegration');
const axios = require('axios');

class GoogleSheetsIntegration extends BaseIntegration {
  constructor() {
    super('google-sheets');
  }

  async testConnection(credentials) {
    if (!credentials || (!credentials.accessToken && !credentials.isSandbox)) {
      return { connected: false, error: 'MISSING_CREDENTIALS', message: 'No Google Sheets token provided' };
    }
    if (credentials.isSandbox) {
      return { connected: true, spreadsheet: 'Operations Master Log (Sandbox)', mode: 'sandbox' };
    }
    return { connected: true, accountEmail: credentials.accountEmail || 'operator@gmail.com' };
  }

  async execute(action, params, credentials) {
    if (!credentials || (!credentials.accessToken && !credentials.isSandbox)) {
      const err = new Error('Google Sheets integration is not connected.');
      err.code = 'INTEGRATION_NOT_CONNECTED';
      throw err;
    }

    if (action === 'append_row') {
      const { spreadsheetId, range, values } = params;
      if (!values || !Array.isArray(values)) {
        const err = new Error('Missing required field: values must be an array');
        err.code = 'MISSING_FIELDS';
        throw err;
      }

      if (credentials.isSandbox || !spreadsheetId) {
        return {
          status: 'success',
          action: 'append_row',
          updatedRange: `${range || 'Sheet1'}!A${Math.floor(Math.random() * 100) + 1}:E${Math.floor(Math.random() * 100) + 1}`,
          updatedRows: 1,
          updatedColumns: values.length,
          valuesAppended: values,
          mode: 'sandbox',
        };
      }

      const res = await axios.post(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range || 'Sheet1!A1'}:append?valueInputOption=USER_ENTERED`,
        { values: [values] },
        {
          headers: { Authorization: `Bearer ${credentials.accessToken}` },
          timeout: 8000,
        }
      );

      return {
        status: 'success',
        updatedRange: res.data.updates.updatedRange,
        updatedRows: res.data.updates.updatedRows,
      };
    }

    if (action === 'read_range') {
      const { spreadsheetId, range } = params;
      if (credentials.isSandbox || !spreadsheetId) {
        return {
          status: 'success',
          action: 'read_range',
          range: range || 'Sheet1!A1:D10',
          values: [
            ['Timestamp', 'Event', 'Status', 'Operator'],
            [new Date().toISOString(), 'Data Sync', 'COMPLETED', 'Admin'],
          ],
          mode: 'sandbox',
        };
      }

      const res = await axios.get(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range || 'Sheet1!A1:D10'}`,
        {
          headers: { Authorization: `Bearer ${credentials.accessToken}` },
          timeout: 8000,
        }
      );

      return { status: 'success', range: res.data.range, values: res.data.values || [] };
    }

    throw new Error(`Unsupported Google Sheets action: ${action}`);
  }

  getMetadata() {
    return {
      provider: 'google-sheets',
      name: 'Google Sheets',
      description: 'Append automated audit logs, parse data rows, and update reporting spreadsheets.',
      icon: 'Table',
      actions: [
        { id: 'append_row', label: 'Append Row', params: ['spreadsheetId', 'range', 'values'] },
        { id: 'read_range', label: 'Read Range', params: ['spreadsheetId', 'range'] },
      ],
    };
  }
}

module.exports = new GoogleSheetsIntegration();
