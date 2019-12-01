var dao = require('../dao/mongo');

var express = require('express');
var router = express.Router();

router.get('/sensors', (req, res, next) => {

  dao.sensors.find({}).lean().exec((e, docs) => {
    res.send(docs).status(200)
  })

})

router.get('/logs', (req, res, next) => {

  dao.logs.find({ 'level': { $gte: 2 } }).sort({ date: 'desc' }).lean().exec((e, docs) => {
    res.send(docs).status(200)
  })

})

router.post('/sensors', (req, res) => {

  if (typeof req.body !== 'object' || Object.entries(req.body).length === 0) {
    res.sendStatus(400)
    return
  }

  Object.keys(req.body).forEach((key) => {

    dao.sensors.findOne({ sensor: key }, (err, reading) => {

      if (err) console.error(err)

      if (reading) {

        reading.update({ value: req.body[key] }, (err) => {
          if (err) console.error(err)
        })

      } else {

        let input = new dao.sensors({ sensor: key, value: req.body[key] })
        input.save((err) => {
          if (err) console.error(err)
        })

      }

    })
  })

  res.sendStatus(200)
})

router.post("/logs", (req, res) => {

  let message = req.body["message"];
  let level = req.body["level"];
  let meta = [];

  message.split(";").forEach((m) => {
    let indexKey;

    m.split("=").forEach((value, key) => {
      if (key % 2 == 0) {
        indexKey = value
      }

      if (key % 2 == 1) {
        meta.push({ key: indexKey, value: value, level: level })
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
