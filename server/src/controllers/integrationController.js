const integrationService = require('../services/integrationService');

class IntegrationController {
  async list(req, res, next) {
    try {
      const integrations = await integrationService.getUserIntegrations(req.user.id);
      return res.status(200).json({ success: true, data: integrations });
    } catch (err) {
      next(err);
    }
  }

  async getStatus(req, res, next) {
    try {
      const status = await integrationService.checkStatus(req.user.id);
      return res.status(200).json({ success: true, data: status });
    } catch (err) {
      next(err);
    }
  }

  async startOAuth(req, res, next) {
    try {
      const { provider } = req.params;
      const redirectUrl = `/api/integrations/oauth/${provider}/callback?code=mock_oauth_code_sandbox&state=${req.user.id}`;
      return res.status(200).json({
        success: true,
        provider,
        authUrl: redirectUrl,
        mode: 'oauth_simulator',
      });
    } catch (err) {
      next(err);
    }
  }

  async handleOAuthCallback(req, res, next) {
    try {
      const { provider } = req.params;
      const { code, state } = req.query;
      const userId = state || req.user?.id;

      if (!userId) {
        return res.redirect(`${req.headers.referer || 'http://localhost:3000'}/integrations?error=missing_user`);
      }

      await integrationService.saveCredentials(userId, {
        provider,
        accessToken: `live_oauth_token_${code}_${Date.now()}`,
        refreshToken: `live_refresh_token_${Date.now()}`,
        accountEmail: `connected.${provider}@company.com`,
        accountName: `Active Account (${provider})`,
        isSandbox: false,
      });

      return res.redirect(`http://localhost:3000/integrations?connected=${provider}`);
    } catch (err) {
      next(err);
    }
  }

  async saveCredentialsManual(req, res, next) {
    try {
      const { provider, accessToken, refreshToken, webhookUrl, accountEmail, accountName, isSandbox } = req.body;
      const result = await integrationService.saveCredentials(req.user.id, {
        provider,
        accessToken,
        refreshToken,
        webhookUrl,
        accountEmail,
        accountName,
        isSandbox: isSandbox !== undefined ? isSandbox : true,
      });
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async disconnect(req, res, next) {
    try {
      const { provider } = req.params;
      const result = await integrationService.disconnectIntegration(req.user.id, provider);
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new IntegrationController();
