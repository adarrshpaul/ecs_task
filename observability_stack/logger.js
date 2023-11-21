const winston = require('winston');
const AWSXRay = require('aws-xray-sdk');
const logger = winston.createLogger({
  format: winston.format.simple(),
  transports: [
    new winston.transports.Console(),
  ],
});

// Function to add X-Ray trace information to logs
const addXRayTraceInfo = () => {
  const segment = AWSXRay.getSegment();
  if (segment) {
    const traceId = segment.trace_id;
    const parentId = segment.id;
    logger.defaultMeta = { traceId, parentId };
  }
};

// Middleware to add X-Ray trace information to logs
const xrayMiddleware = (req, res, next) => {
  addXRayTraceInfo();
  next();
};

module.exports = {
  xrayMiddleware,
  logger
}