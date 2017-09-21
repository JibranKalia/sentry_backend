const express = require('express');

const router = express.Router();

const database = require('../config/database.js');
const sentry = require('./project.js');

router.put('/api', (req, res) => {
  const body = req.body;
  const bucket = body.name;
  database.createTable(bucket)
    .then(() => sentry.getData(body))
    .then(() => console.log('hi'))
    .then(() => res.send('done'))
    .catch((err) => {
      console.log(err);
      res.status(500).send(err);
    });
});

module.exports = router;