const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = 8200;

app.use(bodyParser.json());
app.use(require('./api/routes.js'));

app.listen(port, () => {
  console.log(`We are live on ${port}`);
});
