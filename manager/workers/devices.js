var ewelink = require('ewelink-api')

const connection = new ewelink({
    email: process.env.EWELINK_EMAIL,
    password: process.env.EWELINK_PASS,
    region: 'us',
});

var searchDevice = async (deviceName) => {
    let devices = await connection.getDevices()

    for (let i = 0; i < devices.length; i++) {
        if (devices[i].name.toUpperCase() === deviceName.toUpperCase()) {
            console.log(`Device ${deviceName} found. ID=${devices[i].deviceid}`)
            return devices[i]
        }
    }

    console.error(`Device ${deviceName} not found`)
    return null
}

var getDeviceState = async (deviceName) => {

    let device = await searchDevice(deviceName)

    if (!device) {
        return null
    }

    let stateObject = await connection.getDevicePowerState(device.deviceid)

    return (stateObject.state === 'on')
};

var setDeviceState = async (deviceName, newState) => {

    let device = await searchDevice(deviceName)
    const newStateString = Boolean(newState) ? 'on' : 'off'

    if (!device) {
        return null
    }

    let stateObject = await connection.setDevicePowerState(device.deviceid, newStateString)

    return (stateObject.status === 'ok' && stateObject.state === newStateString)
}

module.exports = { getDeviceState, setDeviceState };
