var mongo = require('../dao/readings');

var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function (req, res, next) {
    let status = 200;
    let response = { status: 'ok' };

    if (!mongo.check()) {
        status = 500;
        response.status = 'error';
    }

    res.status(status).send(response);
});

module.exports = router;
