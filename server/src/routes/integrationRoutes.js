const express = require('express');
const { body } = require('express-validator');
const integrationController = require('../controllers/integrationController');
const { authMiddleware } = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

// Public OAuth callback redirect endpoint
router.get('/oauth/:provider/callback', integrationController.handleOAuthCallback);

// Protected routes
router.use(authMiddleware);

router.get('/', integrationController.list);
router.get('/status', integrationController.getStatus);
router.get('/oauth/:provider/start', integrationController.startOAuth);

router.post(
  '/',
  [
    body('provider')
      .isIn(['gmail', 'slack', 'discord', 'google-sheets', 'openrouter', 'gemini'])
      .withMessage('Valid provider is required'),
  ],
  validateRequest,
  integrationController.saveCredentialsManual
);

router.delete('/:provider', integrationController.disconnect);

module.exports = router;
