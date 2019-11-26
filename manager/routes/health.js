var mongo = require('../dao/readings');

var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function (req, res, next) {

    if (!mongo.check()) {
        res.sendStatus(500);
        return;
    }

    res.sendStatus(200);
});

module.exports = router;
