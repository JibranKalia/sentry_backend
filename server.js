const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 8200;
const db = require('./db.js');

app.use(bodyParser.json()); 

app.listen(port, () => {
  console.log('We are live on ' + port);
});

app.put('/api', (req, res) => {
  let body = req.body
  let bucket = body.name;
  db.createTable(bucket)
    .then(() => {
      console.log("Success");
      res.send(bucket + " created");
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send(err);
    });
});

