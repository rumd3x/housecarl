var dao = require('../dao/readings');

var express = require('express');
var router = express.Router();

router.get('/sensors', (req, res, next) => {

  dao.sensors.find({}).lean().exec((e, docs) => {
    res.send(docs).status(200);
  });

});

router.post('/sensors', (req, res) => {

  if (typeof req.body !== 'object' || Object.entries(req.body).length === 0) {
    res.sendStatus(400);
    return;
  }

  Object.keys(req.body).forEach((key) => {

    dao.sensors.findOne({ sensor: key }, (e, doc) => {
      let value = req.body[key];

      if (err) {
        res.sendStatus(500);
        return;
      }

      if (doc) {
        doc.update({ value: value });
        return;
      }
    });

    // let input = new dao.sensors({ sensor: key, value: value });
    // input.save((err) => {
    //   if (err) {
    //     console.error(`Failed to set ${key} to ${value}`, err);
    //     res.sendStatus(500);
    //     return;
    //   }

    //   console.info(`Succesfully set ${key} to ${value}`);
    //   res.sendStatus(201);
    // });

  });

});

module.exports = router;
