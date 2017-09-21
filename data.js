const aws4 = require('aws4');
const http = require('http');
const db = require('./db.js')

function callBucket(param, startTime) {
  return new Promise((resolve, reject) => {
    // Input AWS access key, secret key, and session token.
    const token = "";
    const accessKey = param.accessKey;
    const secretAccessKey = param.secretAccessKey;
	const endTime = startTime + param.interval - 1;
    console.log(startTime);
	/*
    console.log(endTime);
	console.log(accessKey);
	console.log(secretAccessKey);
	*/
    // Get the start and end times for a range of one month.
    const requestBody = JSON.stringify({
      buckets: [param.name],
      timeRange: [startTime, endTime]
    });
    const header = {
      host: "192.168.99.100",
      port: 8100,
      method: "POST",
      service: "s3",
      path: "/buckets?Action=ListMetrics",
      signQuery: false,
      body: requestBody
    };
    const credentials = { accessKey, secretAccessKey, token };
    const options = aws4.sign(header, credentials);
    const request = http.request(options, response => {
      const body = [];
      response.on("data", chunk => body.push(chunk));
      response.on("end", () => resolve(body.join("")));
	});
	request.on('error', (err) => reject(err))	
    request.write(requestBody);
    request.end();
  });
}

function callApi(param) {
    let callLimit = 10;
    let startTimes = [];
    const initStartTime = param.startTime;
    const finalEndTime = param.endTime;
    param.startTime = undefined;
    param.endTime = undefined;

    /** Check if current interval is too small **/
    if (
      Math.floor((finalEndTime - initStartTime) / param.interval) > callLimit
    ) {
      param.interval = Math.ceil((finalEndTime - initStartTime) / callLimit);
    }
    param.interval = Math.ceil(param.interval / 900000.0) * 900000;
    for (let i = initStartTime; i < finalEndTime; i += param.interval) {
      startTimes.push(i);
	}
	var arrayOfPromises = startTimes.map((startTime) => callBucket(param, startTime));
	  //.then((body) => db.addentry(body));


	return Promise.all(arrayOfPromises)
	.then(data => {
		return data.map((body) => db.addentry(body))
	});

	/*
	Promise.all(promises)
  .then(data => {
    console.log("First handler", data);
    return data.map(entry => entry * 10);
  })
  .then(data => {
    console.log("Second handler", data);
  });
	//.then(() => console.log("test"));
	.then((results) => {
		results.forEach(function(element) {
			console.log(element);
			db.addentry(element);
		});
	})
	.then(() => console.log("test"));
	*/
  };


function miliseconds(hrs,min)
{
    return((hrs*60*60+min*60)*1000);
}

module.exports.getData = function(obj) {
	var param = new Object();

	param.name = obj.name;
	param.accessKey = obj.accessKey;
	param.secretAccessKey = obj.secretKey;
	param.startTime = obj.startTime;
	param.endTime = obj.endTime;
	param.option = (obj.level == 'Service Level') ? 0 : 1;

	if (obj.interval == '15 min')
		param.interval = miliseconds(0, 15);
	else if (obj.interval == '30 min')
		param.interval = miliseconds(0, 30);
	else if (obj.interval == '01 hr')
		param.interval = miliseconds(1, 0);
	else if (obj.interval == '06 hrs')
		param.interval = miliseconds(6, 0);
	else if (obj.interval == '12 hrs')
		param.interval = miliseconds(12, 0);
	else if (obj.interval == '01 day')
		param.interval = miliseconds(24, 0);
	else if (obj.interval == '15 days')
		param.interval = miliseconds(360, 0);
	else if (obj.interval == '01 month')
		param.interval = miliseconds(720, 15);
	else
		param.interval = miliseconds(0, 30);
	return callApi(param);
}