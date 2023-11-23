
const AWSXRay = require('aws-xray-sdk');
const XRayExpress = AWSXRay.express;
AWSXRay.captureAWS(require('aws-sdk'));
const { tracedLogger, enableLogTraceCorrelation } = require('./observability_stack/logger');

const express = require('express');
const router = require('./routes');

const app = express();

app.use(XRayExpress.openSegment('express'));
// app.use(enableLogTraceCorrelation);

app.use('/', router);

app.get('/', (req, res) => {
  res.status(404).json({ 'message': 'Not Found' });
});

app.use(XRayExpress.closeSegment());

app.use((err, req, res, next) => {
  // Check if the error is an Express validation error
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(80, () => {
  tracedLogger.info('Microservice listening on port 80');
});