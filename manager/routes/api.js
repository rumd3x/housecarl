var dao = require('../dao/mongo');

var express = require('express');
var router = express.Router();

router.get('/sensors', (req, res, next) => {

  dao.logs.find({ 'meta.key': "f", 'meta.value': 'loop' }).lean().exec((e, docs) => {
    res.send(docs).status(200);
  });

});

router.post('/sensors', (req, res) => {

  // console.log("req.body", req.body);

  // if (typeof req.body !== 'object' || Object.entries(req.body).length === 0) {

  //   res.sendStatus(400);
  //   return;
  // }

  // Object.keys(req.body).forEach((key) => {

  //   dao.sensors.findOne({ sensor: key }, (err, doc) => {
  //     let value = req.body[key];

  //     if (err) {
  //       res.sendStatus(500);
  //       return;
  //     }

  //     if (doc) {
  //       doc.update({ value: value });
  //       return;
  //     }
  //   });

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

  console.log("chegou aki");
  res.sendStatus(200);

});

router.post("/logs", (req, res) => {

  let message = req.body["message"];
  let meta = [];

  message.split(";").forEach((m) => {
    let indexKey;

    m.split("=").forEach((value, key) => {
      if (key % 2 == 0) {
        indexKey = value
      }

      if (key % 2 == 1) {
        meta.push({ key: indexKey, value: value })
      }

    })
  })

  let log = new dao.logs({ meta: meta, level: req.body["level"] })

  log.save((err) => {
    if (err) {
      console.error(`Failed to save log`, err)
      res.sendStatus(500)
      return
    }

    res.sendStatus(201)
  })

})

module.exports = router;
