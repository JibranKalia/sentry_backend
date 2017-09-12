const AWS = require("aws-sdk");
AWS.config.loadFromPath('./config.json');
AWS.config.update({
    region: "us-west-2",
    endpoint: "http://localhost:8000"
});

const dynamodb = new AWS.DynamoDB();
const docClient = new AWS.DynamoDB.DocumentClient();


module.exports = {
    createTable: function (param, body) {
        const tableName = param.name;
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
                            { AttributeName: "startTime", KeyType: "HASH" },  //Partition key
                            { AttributeName: "endTime", KeyType: "RANGE" }  //Sort key
                        ],
                        AttributeDefinitions: [
                            { AttributeName: "startTime", AttributeType: "N" },
                            { AttributeName: "endTime", AttributeType: "N" },
                            { AttributeName: "data", AtrributeType: "M" }
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
    addentry: function (param, body) {
        body = JSON.parse(body);
        console.log("Body Start Time", param.startTime);
        console.log("End Time", param.endTime);
        const params = {
            TableName: param.name,
            Item: {
                "startTime": param.startTime,
                "endTime": param.endTime,
                "data": body
            }
        };
        docClient.put(params, function (err, data) {
            if (err) {
                console.error("Unable to add movie", param.startTime, ". Error JSON:", JSON.stringify(err, null, 2));
            } else {
                console.log("PutItem succeeded:", param.startTime);
            }
        });
    },
    scan: function (param) {
        const params = {
            TableName: param.name,
        };

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
    }
};