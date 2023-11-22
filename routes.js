const express = require('express');
const router = express.Router();
const AWSXRay = require('aws-xray-sdk');
const { axios } = require('./httpclient');
const { param, body, query } = require('express-validator');
const validate = require('./middleware/validation');
const { logger } = require('./observability_stack/logger');

router.post('/weather-data/',
  [body('name').isString().withMessage('locationKey is required'),
  body('weatherData').isObject().withMessage('locationValue is required')], validate,
  async (req, res, next) => {
    try {
      const { PutItemCommand } = require('@aws-sdk/client-dynamodb');

      const dynamoDBClient = new AWS.DynamoDB({ region: 'YOUR_REGION' });

      const tableName = 'weatherdata';
      const city = req.body.name.toLowerCase();
      const weatherData = req.body.weatherData;

      const putItemCommand = new PutItemCommand({
        TableName: tableName,
        Item: {
          city: { S: city },
          weatherData: { M: weatherData },
        },
      });

      try {
        await dynamoDBClient.send(putItemCommand);
        console.log('Successfully stored weather data for city:', city);
        res.send();
      } catch (error) {
        console.error('Error storing weather data:', error);
        res.status(500).send('Error storing weather data');
      }

    } catch (err) {
      next(err);
    }
  });

router.get('/weather_api/',
  [query('location').notEmpty().withMessage('Enter a valid location name !')], validate,
  /**
   * 
   * @param {import('express').Request} req 
   * @param {import('express').Response} res 
   * @param {*} next 
   */
  async (req, res, next) => {
    try {
      const { query } = req;
      const { location } = query;

      const weatherstackURL = `http://api.weatherstack.com/current?access_key=3f0bb8b1e37bae8106f4f0a5f6bbffb7&query=${location}`;

      const options = {
        method: 'get',
        maxBodyLength: Infinity,
        url: weatherstackURL,
        headers: {},
      };
      logger.info('query.location', location);

      try {
        const response = await axios(options);
        const weatherData = response.data;
        res.json(weatherData);
      } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching weather data');
      }

    } catch (err) {
      next(err);
    }
  });

module.exports = router;

