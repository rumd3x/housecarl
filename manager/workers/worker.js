const devices = require('../repository/ewelink')
const db = require('../repository/mongo')

let roomMovement
let roomLit
let deskLamp
let roomLamp
let roomTV
let sysLastSetRoomLampState

const updateStates = async () => {

    let roomMovementReading = db.getSensorReading("room_movement").then((state) => {
        roomMovement = newMovementState
    })

    let roomLuminosityReading = db.getSensorReading("room_luminosity").then((state) => {
        roomLit = Boolean(state)
    })

    let lastSetRoomLampState = db.getHandlerDataWithDefault("sys_last_roomlamp_set_state", null).then((state) => {
        sysLastSetRoomLampState = state
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

    await Promise.all([roomMovementReading, roomLuminosityReading, deviceDeskLampState, deviceRoomLampState, deviceTVState, lastSetRoomLampState]).catch((e) => {
        console.error(e)
        throw new Error(e)
    })
}

const handleCeilingLamp = async () => {

    try {

        const currentDate = new Date()
        const sunset = (currentDate.getHours() >= 17 || currentDate.getHours() <= 6)
        const isDueMin = (currentDate.getHours() > 6 || (currentDate.getHours() === 6 && currentDate.getMinutes() >= 45))
        const isDueMax = (currentDate.getHours() <= 23 || (currentDate.getHours() === 0 && currentDate.getMinutes() >= 30))
        const isDue = (isDueMin && isDueMax)

        if (!isDue) {
            return
        }

        if (roomLit && !roomLamp) {
            return
        }

        if (sysLastSetRoomLampState != null && sysLastSetRoomLampState !== roomLamp) {
            console.log(`Room Light was toggled manually. Keeping Room Light -> ${roomLamp ? "On" : "Off"}`)
            return
        }

        if (!deskLamp && !roomLit && !roomLamp && roomMovement) {
            console.log("Toggling Room light -> On")
            db.putHandlerData("sys_last_roomlamp_set_state", true)
            await devices.setDeviceState("Room", true)
            return
        }

        if (roomLamp && (!roomMovement || deskLamp)) {
            console.log("Toggling Room light -> Off")
            db.putHandlerData("sys_last_roomlamp_set_state", false)
            await devices.setDeviceState("Room", false)
            return
        }

    } catch (e) {
        console.error(e)
        throw new Error(e)
    }
}

const turnOffDevicesAtDawn = async () => {

    try {
        const currentDate = new Date()
        const isDueHour = (currentDate.getHours() == 4)
        const isDueMinute = (currentDate.getMinutes() >= 30 && currentDate.getMinutes() <= 40)
        const isDue = (isDueHour && isDueMinute)

        if (isDue && roomTV) {
            console.log(`Turning OFF TV @ ${currentDate.getHours()}:${currentDate.getMinutes}:${currentDate.getSeconds()}`)
            await devices.setDeviceState("TV", false)
        }

        if (isDue) {
            console.log("Overriding manual Room Lamp control")
            db.putHandlerData("sys_last_roomlamp_set_state", roomLamp)
        }

    } catch (e) {
        console.error(e)
        throw new Error(e)
    }

}

const work = async () => {

    updateStates().then(async () => {

        await handleCeilingLamp()
        await turnOffDevicesAtDawn()

        work()

    }).catch((e) => {

        devices.reconnect()
        setTimeout(work, 5000)

    })

}

module.exports = { init: work }
