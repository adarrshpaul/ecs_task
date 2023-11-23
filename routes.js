const express = require('express');
const router = express.Router();
const AWSXRay = require('aws-xray-sdk');
const { axios } = require('./httpclient');
const { param, body, query } = require('express-validator');
const validate = require('./middleware/validation');
const { tracedLogger } = require('./observability_stack/logger');

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
        tracedLogger.info('Successfully stored weather data for city:', city);
        res.send();
      } catch (error) {
        tracedLogger.error('Error storing weather data:', error);
        res.status(500).send('Error storing weather data');
      }

    } catch (err) {
      next(err);
    }
  });

let doAPICall2 = async () => {
  const testOptions = {
    method: 'GET',
    url: 'https://wft-geo-db.p.rapidapi.com/v1/geo/adminDivisions',
    headers: {
      'X-RapidAPI-Key': 'ec52c6496dmsh6229b267eb0ec41p1ba2f5jsndb80a8ee1ae9',
      'X-RapidAPI-Host': 'wft-geo-db.p.rapidapi.com'
    }
  };
  tracedLogger.debug(testOptions);
  await axios(testOptions);
}

let doAPICall1 = async (location, weatherSegment) => {
  const weatherstackURL = `http://api.weatherstack.com/current?access_key=3f0bb8b1e37bae8106f4f0a5f6bbffb7&query=${location}`;
  const options = {
    method: 'get',
    maxBodyLength: Infinity,
    url: weatherstackURL,
    headers: {},
  };
  const response = await axios(options);
  tracedLogger.info('iit');
  const weatherData = response.data;
  tracedLogger.debug(weatherData);
  const geoSubSegment = weatherSegment.addNewSubsegment('geo_api_call');
  await doAPICall2();
  geoSubSegment.close();
  return weatherData;

}



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
      const { location } = req.query;
      tracedLogger.warn(req.query);
      const weatherSegment = AWSXRay.getSegment().addNewSubsegment('weather_api');
      let weatherData = await doAPICall1(location, weatherSegment);
      weatherSegment.close();
      res.json(weatherData);
    } catch (err) {
      tracedLogger.error(err);
      next(err);
    }
  });

module.exports = router;

