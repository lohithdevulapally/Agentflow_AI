const express = require('express');
const { body, query } = require('express-validator');
const workflowController = require('../controllers/workflowController');
const { authMiddleware } = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

// Apply auth to all workflow routes
router.use(authMiddleware);

router.get('/dashboard', workflowController.getDashboard);
router.get('/', workflowController.list);

router.post(
  '/',
  [body('name').trim().notEmpty().withMessage('Workflow name is required')],
  validateRequest,
  workflowController.create
);

router.post(
  '/generate',
  [body('prompt').trim().notEmpty().withMessage('Automation prompt is required')],
  validateRequest,
  workflowController.generateFromPrompt
);

router.get('/:id', workflowController.getById);
router.put('/:id', workflowController.update);
router.post('/:id/duplicate', workflowController.duplicate);
router.post('/:id/execute', workflowController.execute);
router.delete('/:id', workflowController.delete);

module.exports = router;
