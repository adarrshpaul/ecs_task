const { validationResult } = require('express-validator');
const { logger } = require('../observability/logger');

const validate = (req, res, next) => {
  logger.info(req.query, req.param);
  const errors = validationResult(req);
  logger.info(errors);
  if (!errors.isEmpty()) {
    return res.status(400).json({

      errors: errors.array()
    });
  }

  next();
};

module.exports = validate;