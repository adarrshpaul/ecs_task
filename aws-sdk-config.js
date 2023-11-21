const AWSXRay = require('aws-xray-sdk');
const AWS = AWSXRay.captureAWS(require('aws-sdk'));
AWS.config.update({ region: process.env.DEFAULT_AWS_REGION || 'us-west-2' });

module.exports = { AWS };