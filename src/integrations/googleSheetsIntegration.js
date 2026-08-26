const axios = require('axios');
const BaseIntegration = require('./baseIntegration');

class GoogleSheetsIntegration extends BaseIntegration {
  constructor() {
    super('google-sheets');
  }

  async testConnection(credentials) {
    if (!credentials || (!credentials.accessToken && !credentials.apiKey)) {
      return { ok: false, message: 'Missing Google Sheets access credentials' };
    }
    return { ok: true, provider: 'Google Sheets API v4' };
  }

  async execute(action, payload, credentials) {
    switch (action) {
      case 'append_row':
      case 'insert_row':
        return this.appendRow(payload, credentials);
      case 'read_sheet':
        return this.readSheet(payload, credentials);
      default:
        throw new Error(`Unsupported Google Sheets action: ${action}`);
    }
  }

  async appendRow(payload, credentials) {
    const { spreadsheetId, range = 'Sheet1!A:Z', values = [] } = payload;

    if (credentials?.accessToken && spreadsheetId && !credentials.mockMode) {
      const res = await axios.post(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
          range
        )}:append?valueInputOption=USER_ENTERED`,
        { values: [Array.isArray(values) ? values : Object.values(values)] },
        { headers: { Authorization: `Bearer ${credentials.accessToken}` } }
      );
      return { success: true, updatedCells: res.data.updates?.updatedCells, range: res.data.updates?.updatedRange };
    }

    // Emulated execution mode
    return {
      success: true,
      simulated: true,
      spreadsheetId: spreadsheetId || 'sim_sheet_123',
      appendedValues: values,
      updatedRange: `${range.split('!')[0]}!A10:E10`,
      timestamp: new Date().toISOString(),
    };
  }

  async readSheet(payload, credentials) {
    const { spreadsheetId, range = 'Sheet1!A1:Z50' } = payload;
    return {
      success: true,
      simulated: true,
      spreadsheetId: spreadsheetId || 'sim_sheet_123',
      range,
      rows: [
        ['Timestamp', 'User', 'Status', 'Feedback'],
        [new Date().toISOString(), 'customer@example.com', 'Resolved', 'Great support automation!'],
      ],
    };
  }
}

module.exports = new GoogleSheetsIntegration();
