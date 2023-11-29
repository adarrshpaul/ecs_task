// Set global defaults for Axios requests
// axios.defaults.baseURL = 'https://api.example.com';
// axios.defaults.headers.common['Authorization'] = 'AUTH_TOKEN';
// axios.defaults.headers.post['Content-Type'] = 'application/json';
var AWSXRay = require('aws-xray-sdk');
AWSXRay.captureHTTPsGlobal(require('http'));
AWSXRay.captureHTTPsGlobal(require('https'));
AWSXRay.capturePromise();

const axios = require('axios');
const instance = axios.create();
const axiosRetry = require('axios-retry')
axiosRetry(axios, { retryDelay: axiosRetry.exponentialDelay });
module.exports = {
  axios
}