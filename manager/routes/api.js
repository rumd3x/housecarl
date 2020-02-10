const express = require('express')
const ewelink = require('../repository/ewelink')

const router = express.Router()

const mesaDevice = "Mesa"
const quartoDevice = "Quarto"

router.post('/lights/smart-toggle', (req, res, next) => {

  const input = req.body["secret"]
  const secret = process.env["SECRET_KEY"]

  if (typeof input == "undefined") {
    res.sendStatus(400)
    return
  }

  if (secret && input != secret) {
    res.sendStatus(401)
    return
  }

  const deviceStates = [
    ewelink.getDeviceState(quartoDevice),
    ewelink.getDeviceState(mesaDevice),
  ]

  Promise.all(deviceStates).then(data => {
    if (data.length < 2) {
      return
    }

    const quartoState = data[0]
    const mesaState = data[1]

    if (quartoState && mesaState) {
      ewelink.setDeviceState(mesaDevice, false)
      ewelink.setDeviceState(quartoDevice, false)
      return
    }

    if (mesaState && !quartoState) {
      ewelink.setDeviceState(mesaDevice, false)
      ewelink.setDeviceState(quartoDevice, true)
      return
    }

    if (quartoState) {
      ewelink.setDeviceState(mesaDevice, false)
      ewelink.setDeviceState(quartoDevice, false)
      return
    }

    ewelink.setDeviceState(mesaDevice, true)
  })

  res.sendStatus(200)
})

module.exports = router
