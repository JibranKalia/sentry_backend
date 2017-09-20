const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 8200;
const db = require('./db.js');
const data = require('./data.js');

app.use(bodyParser.json()); 

app.listen(port, () => {
  console.log('We are live on ' + port);
});

app.put('/api', (req, res) => {
  let body = req.body
  let bucket = body.name;
  db.createTable(bucket)
    .then(() => {
      data.getData(body);
      res.send("Done");
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send(err);
    });
});

/*
{
	"name":"testbucket",
	"accessKey":"accessKey1",
	"secretKey":"verySecretKey1",
  "level":"bucket",
  "startTime":1501545600000,
  "endTime":1506815999999,
	"interval":"01 month"
}
*/