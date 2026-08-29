const { validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data provided',
        details: errors.array().map((err) => ({ field: err.path || err.param, message: err.msg })),
      },
    });
  }
  next();
};

module.exports = validateRequest;
