const aws4 = require('aws4');
const http = require('http');

var totalData;

function callServiceApi(name, accessKeyId, secretAccessKey, startTime, endTime, cb) {
	console.log("Service Api called");
	const token = '';
	const requestBody = JSON.stringify({
		service: ['s3'],
		timeRange: [startTime, endTime],
	});
	const header = {
		host: '192.168.99.100',
		port: 8100,
		method: 'POST',
		service: 's3',
		path: '/service?Action=ListMetrics',
		signQuery: false,
		body: requestBody,
	};
	const credentials = { accessKeyId, secretAccessKey, token };
	const options = aws4.sign(header, credentials);
	const request = http.request(options, response => {
		const body = [];
		response.on('data', chunk => body.push(chunk));
		response.on('end', () => cb(null, `${body.join('')}`));
	});
	request.on('error', e => process.stdout.write(`error: ${e.message}\n`));
	request.write(requestBody);
	request.end();
}

/** call to bucket api, with authentication and parsing parameters from the form **/

function callBucketApi(param, cb) {
//	console.log("Bucket Api called");
	const token = '';
	const accessKeyId = param.accessKeyId;
	const secretAccessKey = param.secretAccessKey;

	const requestBody = JSON.stringify({
		buckets: [param.name],
		timeRange: [param.startTime, param.endTime],
	});
	const header = {
		host: '192.168.99.100',
		port: 8100,
		method: 'POST',
		service: 's3',
		path: '/buckets?Action=ListMetrics',
		signQuery: false,
		body: requestBody,
	};
	const credentials = { accessKeyId, secretAccessKey, token };
	const options = aws4.sign(header, credentials);
	const request = http.request(options, (response) => {
		const body = [];
		response.on('data', chunk => body.push(chunk));
			console.log("body", body);
		response.on('end', () => cb(null, `${body.join('')}`));
	});
	request.on('error', e => process.stdout.write(`error: ${e.message}\n`));
	request.write(requestBody);
	request.end();
}

function miliseconds(hrs,min)
{
    return((hrs*60*60+min*60)*1000);
}


/** range to caluclate the interval and make sure doesn't exceed the api call limit **/

function getRange(param, cb) {
	var objArray = []
	let callReturned = 0;
	let numOfCalls = 0;
	var callLimit = 10;
	var checkLimit = Math.floor((param.end - param.start) / param.interval);
	if (checkLimit > callLimit)
	{
		Interval = Math.ceil((param.end - param.start) / callLimit);
	}
	Interval = Math.ceil(param.interval / 900000.0) * 900000;
	var Next = param.start + param.interval - 1;

	console.log("Name", param.name);
	console.log("Interval", param.interval);
	console.log("Start", param.start);
	console.log("End", param.end);
	console.log("Option", param.option);

	if (param.option == 0)
	{
		for (var i = param.start; i < param.end; i += param.interval)
		{
			callServiceApi(param.name, param.accessKeyId, param.secretAccessKey, i, param.next, function(err, result) {
				console.log(result);
				objArray.push(result);
				callReturned += 1;
				if (numOfCalls == callReturned) {
					console.log("API Output", objArray.length)
					cb(null, objArray);
				} 
			});
			Next += Interval;
			Next += param.interval;
			numOfCalls += 1;
		}
	}
	else
	{
		for (var i = param.start; i < param.end; i += param.interval)
		{
			callBucketApi(param, (result) => {
				objArray.push(result);
				callReturned += 1;
				if (numOfCalls == callReturned) {
					console.log("API Output", objArray.length)
					cb(null, objArray);
				}
			});
			Next += param.interval;
			numOfCalls += 1;
		}
	}
	console.log("Num of Calls " + numOfCalls);
}

/** time conversions from the timeStamp parameter from form **/

function dateconvert(obj) {
	var param = new Object();
	param.accessKeyId = obj.accesskey;
	param.secretAccessKey = obj.secretkey;
	if (obj.type == 'Service Level')
		param.option = 0;
	else
		param.option = 1;
	//param.start = new Date(obj.dateStart + 'T' + obj.timeStart).getTime();
	param.start = new Date(2017, 7, 1, 0, 0, 0, 0).getTime();;
	//param.end = new Date(obj.dateEnd + 'T' + obj.timeEnd).getTime();
	param.end = new Date(2017, 8, 1, 0, 0, 0, 0).getTime() - 1;

	let Interval;
	if (obj.timeStamp == '15 min')
		Interval = miliseconds(0, 15);
	else if (obj.timeStamp == '30 min')
		Interval = miliseconds(0, 30);
	else if (obj.timeStamp == '01 hr')
		Interval = miliseconds(1, 0);
	else if (obj.timeStamp == '06 hrs')
		Interval = miliseconds(6, 0);
	else if (obj.timeStamp == '12 hrs')
		Interval = miliseconds(12, 0);
	else if (obj.timeStamp == '01 day')
		Interval = miliseconds(24, 0);
	else if (obj.timeStamp == '15 days')
		Interval = miliseconds(360, 0);
	else if (obj.timeStamp == '01 month')
		Interval = miliseconds(720, 15);
	else
		Interval = miliseconds(0, 30);
	param.interval = Interval;
	param.name = obj.name;

	getRange(param, (objArray) => {
		console.log(objArray);
	});
}

function start() {
	var obj = new Object();
	obj.accesskey = 'accessKey1';
	obj.secretkey = 'verySecretKey1';
	obj.type = 1;
	obj.interval = '01 month';
	obj.name = 'utapi-bucket';
	dateconvert(obj);
}
start();