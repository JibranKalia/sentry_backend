const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = 8200;
const db = require('./db.js');
const data = require('./data.js');

app.use(bodyParser.json());

app.listen(port, () => {
  console.log(`We are live on ${port}`);
});

app.put('/api', (req, res) => {
  const body = req.body;
  const bucket = body.name;
  db.createTable(bucket)
    .then(() => data.getData(body))
    .then(() => console.log('hi'))
    .then(() => res.send('done'))
    .catch((err) => {
      console.log(err);
      res.status(500).send(err);
    });
});
