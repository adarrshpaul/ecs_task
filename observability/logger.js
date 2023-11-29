const winston = require('winston');
const AWSXRay = require('aws-xray-sdk');

const logger = winston.createLogger({
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
  ],
});
//Added code to add winston as the logger for AWS-Xray
// Function to add X-Ray trace information to logs
const addXRayTraceInfo = () => {
  const segment = AWSXRay.getSegment();
  if (segment) {
    const traceId = segment.trace_id;
    const parentId = segment.id;
    if (segment.subsegments)
      logger.defaultMeta = { traceId, parentId };
  }
};

// Middleware to add X-Ray trace information to logs
const enableLogTraceCorrelation = (req, res, next) => {
  addXRayTraceInfo();
  next();
};

const tracedLogger = AWSXRay.getLogger();
module.exports = {
  logger,
  enableLogTraceCorrelation
}