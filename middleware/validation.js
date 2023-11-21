const { validationResult } = require('express-validator');

const validate = (req, res, next) => {
  console.log(req.query, req.param);
  const errors = validationResult(req);
  console.log(errors);
  if (!errors.isEmpty()) {
    return res.status(400).json({

      errors: errors.array()
    });
  }

  next();
};

module.exports = validate;