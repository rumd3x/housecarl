const devices = require('../repository/ewelink')
const sensors = require('../repository/mongo')

let sunset
let roomMovement
let roomLit
let deskLamp
let roomLamp
let roomTV

const updateStates = async () => {
    sunset = ((new Date()).getHours() >= 17 || (new Date()).getHours() <= 6)

    let roomMovementReading = sensors.getSensorReading("room_movement").then((state) => {
        roomMovement = Boolean(state)
    })

    let roomLuminosityReading = sensors.getSensorReading("room_luminosity").then((state) => {
        roomLit = Boolean(state)
    })

    let deviceDeskLampState = devices.getDeviceState("Desk").then((state) => {
        deskLamp = state
    })

    let deviceRoomLampState = devices.getDeviceState("Room").then((state) => {
        roomLamp = state
    })

    let deviceTVState = devices.getDeviceState("TV").then((state) => {
        roomTV = state
    })

    await Promise.all([roomMovementReading, roomLuminosityReading, deviceDeskLampState, deviceRoomLampState, deviceTVState]).catch((e) => {
        console.error(e)
        throw new Error(e)
    })
}

const handleCeilingLamp = async () => {

    try {

        if (roomLit && !roomLamp) {
            return
        }

        if (!deskLamp && !roomLit && !roomLamp && roomMovement) {
            devices.setDeviceState("Room", true)
        }

        if (roomLamp && (!roomMovement || deskLamp)) {
            devices.setDeviceState("Room", false)
        }

    } catch (e) {
        console.error(e)
    }
}

const work = async () => {

    updateStates().then(() => {

        handleCeilingLamp()
        work()

    }).catch((e) => {

        devices.connect()
        setTimeout(work, 5000)

    })

}

module.exports = { init: work }
