var dao = require('../dao/readings');

var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/sensors', function (req, res, next) {

  dao.sensors.find({}).lean().exec((e, docs) => {
    res.send(docs);
  });

});

module.exports = router;
