const aws4 = require('aws4');
const http = require('http');
const db = require('./db.js')

function pushDB(param, body) {
	//console.log("body", body);
	db.createTable(param, body);
	//db.addentry(param, body);
	db.scan(param);
}

function callBucket(param) {
    // Input AWS access key, secret key, and session token.
    const token = '';
    const accessKeyId = param.accessKeyId;
	const secretAccessKey = param.secretAccessKey;
    // Get the start and end times for a range of one month.
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
    const request = http.request(options, response => {
        const body = [];
        response.on('data', chunk => body.push(chunk));
        response.on('end', () => pushDB(param, body.join('')));
    });
    request.on('error', e => process.stdout.write(`error: ${e.message}\n`));
    request.write(requestBody);
    request.end();
}


function callApi(param){
    var callLimit = 10;
    /** Check if current interval is too small **/
    if (Math.floor((param.end - param.start) / param.interval) > callLimit) {
        param.interval = Math.ceil((param.end - param.start) / callLimit);
    }
    param.interval = Math.ceil(param.interval / 900000.0) * 900000
    var nextTimeStamp = param.start + param.interval - 1;
    console.log("Name", param.name);
	console.log("Interval", param.interval);
	console.log("Start", param.start);
	console.log("End", param.end);
	console.log("Option", param.option);

    for (let i = param.start; i < param.end; i += param.interval) {
		param.startTime = i;
		param.endTime = nextTimeStamp;
        callBucket(param);
        nextTimeStamp += param.interval;
    }

}

function miliseconds(hrs,min)
{
    return((hrs*60*60+min*60)*1000);
}

function setparam(obj) {
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
	callApi(param, (objArray) => {
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
	setparam(obj);
}

start();