const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = 8200;

//TODO: Better cors settings

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.use(bodyParser.json());
app.use(require('./api/routes.js'));

app.listen(port, () => {
  console.log(`We are live on ${port}`);
});
