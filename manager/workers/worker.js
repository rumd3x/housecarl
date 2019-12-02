const devices = require('../repository/ewelink')

const toggleLight = async () => {
    try {
        let toggledRoomLight = await devices.setDeviceState("Room", !await devices.getDeviceState('Room'))
        console.log('toggledRoomLight', toggledRoomLight)
    } catch (e) {
        console.error(e)
    }
}

const work = async () => {
    console.log("Worker working...")
    // toggleLight()

    setTimeout(work, 10000)
}

module.exports = { init: work }
