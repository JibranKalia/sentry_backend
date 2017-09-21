const AWS = require('aws-sdk');

AWS.config.loadFromPath('./config.json');
AWS.config.update({
  region: 'us-west-2',
  endpoint: 'http://localhost:8300/',
});

const dynamodb = new AWS.DynamoDB();
const docClient = new AWS.DynamoDB.DocumentClient();


module.exports = {
  createTable (bucketName) {
    const tableName = bucketName;
    return dynamodb.listTables({})
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
          return dynamodb.createTable(params).promise();
        }
      });
  },
  addentry (body) {
    return new Promise((resolve, reject) => {
      //console.log(body);
      body = JSON.parse(body)[0];
      const params = {
        TableName: body.bucketName,
        Item: {
          "bucketName" : body.bucketName,
          "startTime": body.timeRange[0],
          "data": body
        }
      };
      docClient.put(params, function (err, data) {
        if (err) {
          reject(err);
        } else {
          console.log("PutItem succeeded:", body.timeRange[0]);
          resolve("done");
        }
      });
    });
  },
  query (param) {
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
  },
};
