const winston = require('winston');
const AWSXRay = require('aws-xray-sdk');
const logger = winston.createLogger({
  format: winston.format.simple(),
  transports: [
    new winston.transports.Console(),
  ],
});

//Added code to add winston as the logger for AWS-Xray
AWSXRay.setLogger(logger);
// Function to add X-Ray trace information to logs
// const addXRayTraceInfo = () => {
//   const segment = AWSXRay.getSegment();
//   if (segment) {
//     const traceId = segment.trace_id;
//     const parentId = segment.id;
//     logger.defaultMeta = { traceId, parentId };
//   }
// };

const addRequestToTraceInfo = (req, res, next) => {
  AWSXRay.captureHTTP({ req, res });
}

// Middleware to add X-Ray trace information to logs
const xrayMiddleware = (req, res, next) => {
  // addXRayTraceInfo();
  next();
};

module.exports = {
  logger
}