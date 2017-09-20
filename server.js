const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 8200;
const db = require('./db.js');
require('./app/routes')(app, {});

app.listen(port, () => {
  console.log('We are live on ' + port);
});

app.put(port, (req, res) => {
  console.log("test" + req);
  let bucket = req.name;
  db.createTable(bucket).then(
    console.log("Bucket Created")
  );
});

