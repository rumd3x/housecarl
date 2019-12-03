const devices = require('../repository/ewelink')
const sensors = require('../repository/mongo')


const handleCeilingLamp = async () => {

    try {
        const roomMovement = Boolean(await sensors.getSensorReading("room_movement"))
        const roomLit = Boolean(await sensors.getSensorReading("room_luminosity"))
        const deskLamp = await devices.getDeviceState("Desk")
        const roomLamp = await devices.getDeviceState("Room")
        const sunset = ((new Date()).getHours() >= 17 || (new Date()).getHours() <= 6)

        if (roomLit && !roomLamp) {
            return
        }

        if (!deskLamp && !roomLit && !roomLamp && roomMovement) {
            devices.setDeviceState("Room", true)
        }

        if (roomLit && sunset && roomLamp && !roomMovement) {
            devices.setDeviceState("Room", false)
        }

    } catch (e) {
        console.error(e)
    }
}

const work = async () => {
    handleCeilingLamp()

    setTimeout(work, 1000)
}

module.exports = { init: work }
