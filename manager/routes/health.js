const ewelink = require('../repository/ewelink')

const express = require('express')
const router = express.Router()

/* GET users listing. */
router.get('/', function (req, res, next) {

    if (!ewelink.check()) {
        res.sendStatus(500)
        return
    }

    res.sendStatus(200)
})

module.exports = router
