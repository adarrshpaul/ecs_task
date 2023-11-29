
const AWSXRay = require('aws-xray-sdk');
const XRayExpress = AWSXRay.express;
AWSXRay.captureAWS(require('aws-sdk'));
const { logger, enableLogTraceCorrelation } = require('./observability/logger');
AWSXRay.setLogger(logger);
const express = require('express');
const weatherRoutes = require('./routes/weather_app');

const app = express();

app.use(XRayExpress.openSegment('express'));
app.use(enableLogTraceCorrelation);

app.use('/', weatherRoutes);

app.get('/', (req, res) => {
  res.status(404).json({ 'message': 'Not Found' });
});

app.use(XRayExpress.closeSegment());

app.use((err, req, res, next) => {
  AWSXRay.getLogger().error(err);
  // Check if the error is an Express validation error
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(80, () => {
  logger.info('Microservice listening on port 80');
});