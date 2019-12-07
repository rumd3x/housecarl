const devices = require('../repository/ewelink')
const sensors = require('../repository/mongo')

let sunset
let roomMovement
let continuoslyMoving = false
let roomLit
let deskLamp
let roomLamp
let roomTV

const updateStates = async () => {

    sunset = ((new Date()).getHours() >= 17 || (new Date()).getHours() <= 6)

    let roomMovementReading = sensors.getSensorReading("room_movement").then((state) => {
        const newMovementState = Boolean(state)
        continuoslyMoving = (roomMovement && newMovementState)
        roomMovement = newMovementState
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

        if (!sunset && roomLamp) {
            return
        }

        if (!deskLamp && !roomLit && !roomLamp && continuoslyMoving) {
            console.log("Toggling Room light -> On")
            await devices.setDeviceState("Room", true)
            return
        }

        if (roomLamp && (!roomMovement || deskLamp)) {
            console.log("Toggling Room light -> Off")
            await devices.setDeviceState("Room", false)
            return
        }

    } catch (e) {
        console.error(e)
        throw new Error(e)
    }
}

const work = async () => {

    updateStates().then(async () => {

        await handleCeilingLamp()
        setTimeout(work, 250)

    }).catch((e) => {

        devices.connect()
        setTimeout(work, 3500)

    })

}

module.exports = { init: work }
