const express = require('express');

const router = express.Router();

const database = require('../config/database.js');
const sentry = require('./project.js');

router.post('/api', (req, res) => {
  const body = req.body;
  console.log(body);
  const bucket = body.name;
  database.createTable(bucket)
    .then(() => sentry.getData(body))
    .then(() => console.log('requestdone'))
    .then(() => res.send('done'))
    .catch((err) => {
      console.log(err);
      res.status(500).send(err);
    });
});

module.exports = router;