const AWS = require("aws-sdk");
AWS.config.loadFromPath('./config.json');
AWS.config.update({
    region: "us-west-2",
    endpoint: "http://localhost:8300/"
});

const dynamodb = new AWS.DynamoDB();
const docClient = new AWS.DynamoDB.DocumentClient();

module.exports = {
    createTable: function (bucketName) {
        const tableName = bucketName;
        const tablePromise = dynamodb.listTables({})
            .promise()
            .then((data) => {
                const exists = data.TableNames
                    .filter(name => {
                        return name === tableName;
                    })
                    .length > 0;
                if (exists) {
                    return Promise.resolve();
                }
                else {
                    console.log('Creating Table');
                    const params = {
                        TableName: tableName,
                        KeySchema: [
                            { AttributeName: "bucketName", KeyType: "HASH" },  //Partition key
                            { AttributeName: "startTime", KeyType: "RANGE" }  //Sort key
                        ],
                        AttributeDefinitions: [
                            { AttributeName: "bucketName", AttributeType: "S" },
                            { AttributeName: "startTime", AttributeType: "N" },
                        ],
                        ProvisionedThroughput: {
                            ReadCapacityUnits: 10,
                            WriteCapacityUnits: 10
                        }
                    };
                    return dynamodb.createTable(params).promise().then();
                }
            });
    },
    addentry: function (body) {
        body = JSON.parse(body)[0];
        const params = {
            TableName: dbName,
            Item: {
                "bucketName" : body.bucketName,
                "startTime": body.timeRange[0],
                "data": body
            }
        };
        docClient.put(params, function (err, data) {
            if (err) {
                console.error("Unable to add movie");
            } else {
                console.log("PutItem succeeded:", body.timeRange[0]);
            }
        });
    },
    scan: function (param) {
        const params = {
            TableName: dbName,
        };
        console.log("Getting data for " + param.name);

        docClient.scan(params, onScan);
        var count = 0;

        function onScan(err, data) {
            if (err) {
                console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
            } else {
                console.log("Scan succeeded.", data);
                data.Items.forEach(function (itemdata) {
                    console.log("Item :", ++count, JSON.stringify(itemdata));
            });

                // continue scanning if we have more items
                if (typeof data.LastEvaluatedKey != "undefined") {
                    console.log("Scanning for more...");
                    params.ExclusiveStartKey = data.LastEvaluatedKey;
                    docClient.scan(params, onScan);
                }
            }
        }
    },
    queryv1: function (param, callback) {
        console.log("query");
        console.log("Primary Hash", param.name);
        console.log("start Time ", param.start);
        console.log("End Time ", param.end)
        var params = {
            TableName: dbName,
            KeyConditionExpression: "#bucketName = :bucketValue and #startTime BETWEEN :from AND :to",
            ExpressionAttributeNames: {
                "#bucketName" : "bucketName",
                "#startTime": "startTime"
            },
            ExpressionAttributeValues: {
                ":bucketValue": param.name,
                ":from": param.start,
                ":to": param.end
            }
        };
        var items = []
        var queryExecute = function (callback) {
            docClient.query(params, function (err, result) {
                if (err) {
                callback(err);
                } else {
                    console.log(result)
                    items = items.concat(result.Items);
                    if (result.LastEvaluatedKey) {
                        params.ExclusiveStartKey = result.LastEvaluatedKey;
                        queryExecute(callback);
                    } else {
                        callback(err, items);
                    }
                }
            });
        }
        queryExecute(callback);
    },
    queryv2: function (param, callback) {
        var params = {
            TableName: dbName,
            KeyConditionExpression: "#bucketName = :bucketValue and #startTime BETWEEN :from AND :to",
            ExpressionAttributeNames: {
                "#bucketName" : "bucketName",
                "#startTime": "startTime"
            },
            ExpressionAttributeValues: {
                ":bucketValue": param.name,
                ":from": param.start,
                ":to": param.end
            }
        };
        var result = []
        docClient.query(params, function (err, data) {
            if (err) {
                console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
                callback(err);
            } else {
                data.Items.forEach(function (item) {
                    result.push(item);
                });
                callback(err, result);
            }
        });
    },
    query: function (param) {
        return new Promise((resolve, reject) => {
            var params = {
                TableName: dbName,
                KeyConditionExpression: "#bucketName = :bucketValue and #startTime BETWEEN :from AND :to",
                ExpressionAttributeNames: {
                    "#bucketName": "bucketName",
                    "#startTime": "startTime"
                },
                ExpressionAttributeValues: {
                    ":bucketValue": param.name,
                    ":from": param.start,
                    ":to": param.end
                }
            };
            var result = []
            docClient.query(params, function (err, data) {
                if (err) {
                    console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
                    reject(err);
                } else {
                    data.Items.forEach(function (item) {
                        result.push(item);
                    });
                    resolve(result);
                }
            });
        });
    }
};
