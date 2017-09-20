const aws4 = require('aws4');
const http = require('http');
const db = require('./db.js')

function pushDB(param, body) {
//	console.log(body);
//	db.createTable(param, body);
	db.addentry(body);
}

function callBucket(param, startTime) {
	//console.log("start time ", param.startTime);
	//console.log("end time ", param.endTime);
    // Input AWS access key, secret key, and session token.
    const token = '';
    const accessKeyId = param.accessKeyId;
	const secretAccessKey = param.secretAccessKey;
	const endTime = startTime + param.interval - 1;
    // Get the start and end times for a range of one month.
    const requestBody = JSON.stringify({
        buckets: [param.name],
        timeRange: [startTime, endTime],
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
    let callLimit = 10;
	let startTimes = [];
	const initStartTime = param.startTime;
	const finalEndTime = param.endTime;
	param.startTime = undefined;
	param.endTime = undefined;
	
    /** Check if current interval is too small **/
    if (Math.floor((finalEndTime - initStartTime) / param.interval) > callLimit) {
        param.interval = Math.ceil((finalEndTime - initStartTime) / callLimit);
    }
    param.interval = Math.ceil(param.interval / 900000.0) * 900000;
	for (let i = initStartTime; i < finalEndTime ; i += param.interval)
	{
		startTimes.push(i);
	}
	/*
    for (let i = param.startTime; i < (param.endTime + param.interval); i += param.interval) {
		param.startTime = i;
		param.endTime = nextTimeStamp;
        callBucket(param);
        nextTimeStamp += param.interval;
    }

    for (let i = param.start; i < param.end; i += param.interval) {
		param.startTime = i;
		param.endTime = nextTimeStamp;
        callBucket(param);
        nextTimeStamp += param.interval;
    }
	*/

}

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
	/*
	param.start = new Date(obj.dateStart + 'T' + obj.timeStart).getTime();
	param.start = new Date(2017, 7, 1, 0, 0, 0, 0).getTime();;
param.end = new Date(obj.dateEnd + 'T' + obj.timeEnd).getTime();
	param.end = new Date(2017, 8, 1, 0, 0, 0, 0).getTime() - 1;
	*/

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
	callApi(param);
}

/*
function start() {
//	var end = Date.now() + 20000;
//	while (Date.now() < end) ;
	var obj = new Object();
	obj.accessKey = 'accessKey1';
	obj.secretKey = 'verySecretKey1';
	obj.level = 0;
	obj.interval = '01 month';
	obj.name = 'utapi-bucket';
	setparam(obj);
}
*/