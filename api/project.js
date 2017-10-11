const aws4 = require('aws4');
const http = require('http');
const database = require('../config/database.js');

function callBucket(param, startTime) {
  return new Promise((resolve, reject) => {
    const token = '';
    const accessKey = param.accessKey;
    const secretAccessKey = param.secretAccessKey;
    const endTime = startTime + param.interval - 1;
    console.log(startTime);
    // Get the start and end times for a range of one month.
    const requestBody = JSON.stringify({
      buckets: [param.name],
      timeRange: [startTime, endTime],
    });
    const header = {
      host: 's3',
      port: 8100,
      method: 'POST',
      service: 's3',
      path: '/buckets?Action=ListMetrics',
      signQuery: false,
      body: requestBody,
    };
    const credentials = { accessKey, secretAccessKey, token };
    const options = aws4.sign(header, credentials);
    const request = http.request(options, (response) => {
      const body = [];
      response.on('data', chunk => body.push(chunk));
      response.on('end', () => resolve(body.join('')));
    });
    request.on('error', err => reject(err));
    request.write(requestBody);
    request.end();
  });
}

function callApi(param) {
  const callLimit = 10;
  const startTimes = [];
  const initStartTime = param.startTime;
  const finalEndTime = param.endTime;

  /** Check if current interval is too small * */
  if (
    Math.floor((finalEndTime - initStartTime) / param.interval) > callLimit
  ) {
    param.interval = Math.ceil((finalEndTime - initStartTime) / callLimit);
  }
  param.interval = Math.ceil(param.interval / 900000.0) * 900000;
  for (let i = initStartTime; i < finalEndTime; i += param.interval) {
    startTimes.push(i);
  }
  // TODO: Waiting to put every object in DB before returning JSON. Good or bad???
  const arrayOfPromises = startTimes.map(startTime => callBucket(param, startTime).then(out => database.addentry(out)));

  return Promise.all(arrayOfPromises);
}


function miliseconds(hrs, min) {
  return ((hrs * 60 * 60 + min * 60) * 1000);
}

function getData(obj) {
  const param = {};
  param.name = obj.name;
  param.accessKey = obj.accessKey;
  param.secretAccessKey = obj.secretAccessKey;
  param.startTime = obj.epochStart;
  param.endTime = obj.epochEnd;
  param.level = (obj.level === 'Service Level') ? 0 : 1;
  if (obj.interval === '15 min') { param.interval = miliseconds(0, 15); } else if (obj.interval === '30 min') { param.interval = miliseconds(0, 30); } else if (obj.interval === '01 hr') { param.interval = miliseconds(1, 0); } else if (obj.interval === '06 hrs') { param.interval = miliseconds(6, 0); } else if (obj.interval === '12 hrs') { param.interval = miliseconds(12, 0); } else if (obj.interval === '01 day') { param.interval = miliseconds(24, 0); } else if (obj.interval === '15 days') { param.interval = miliseconds(360, 0); } else if (obj.interval === '01 month') { param.interval = miliseconds(720, 15); } else { param.interval = miliseconds(0, 30); }
  return callApi(param);
}

// TODO: out.length needs better logic

module.exports.handleReq = function handleReq(param) {
  return database.query(param)
    .then((out) => {
      if (out.length < 5) {
        return getData(param);
      }
      return out;
    })
    .catch((err) => {
      if (err.message === 'Cannot do operations on a non-existent table') { 
        return database.createTable(param.name).then(() => getData(param));
      }
      return (err);
    });
};
