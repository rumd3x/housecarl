const ewelink = require('ewelink-api')

const connection = new ewelink({
    email: process.env.EWELINK_EMAIL,
    password: process.env.EWELINK_PASS,
    region: 'us',
})

const searchDevice = async (deviceName) => {
    const devices = await connection.getDevices()

    for (let i = 0; i < devices.length; i++) {
        if (devices[i].name.toUpperCase() === deviceName.toUpperCase()) {
            return devices[i]
        }
    }

    console.error(`Device ${deviceName} not found`)
    return null
}

const getDeviceState = async (deviceName) => {

    const device = await searchDevice(deviceName)

    if (!device) {
        return null
    }

    let stateObject = await connection.getDevicePowerState(device.deviceid)

    return (stateObject.state === 'on')
}

const setDeviceState = async (deviceName, newState) => {

    const device = await searchDevice(deviceName)
    const newStateString = Boolean(newState) ? 'on' : 'off'

    if (!device) {
        return null
    }

    let stateObject = await connection.setDevicePowerState(device.deviceid, newStateString)

    return (stateObject.status === 'ok' && stateObject.state === newStateString)
}

const check = () => {

    return connection.getCredentials().then(
        (auth) => {
            return (auth.user.email === process.env.EWELINK_EMAIL)
        }, () => {
            return false
        }
    )
}

module.exports = { getDeviceState, setDeviceState, check }
