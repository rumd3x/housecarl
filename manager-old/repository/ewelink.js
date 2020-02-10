const ewelink = require('ewelink-api')

let devicesCache = null

let connection = new ewelink({
    email: process.env.EWELINK_EMAIL,
    password: process.env.EWELINK_PASS,
})

const reconnect = async () => {
    await connection.getCredentials()
    return check()
}

const searchDevice = async (deviceName) => {
    let devices = devicesCache

    if (devicesCache === null) {
        devicesCache = await connection.getDevices()
    }

    for (let i = 0; i < devicesCache.length; i++) {
        if (devicesCache[i].name.toUpperCase() === deviceName.toUpperCase()) {
            return devices[i]
        }
    }

    devicesCache = null
    console.error(`Device ${deviceName} not found.`)
    return null
}

const getDeviceState = async (deviceName) => {

    const device = await searchDevice(deviceName)

    if (!device) {
        throw new Error(`Get Device State Failed: Device ${deviceName} not found.`)
    }

    let stateObject = await connection.getDevicePowerState(device.deviceid)

    if (stateObject.status !== 'ok') {
        throw new Error(`Device ${deviceName} is not available.`)
    }

    return (stateObject.state === 'on')
}

const setDeviceState = async (deviceName, newState) => {

    const device = await searchDevice(deviceName)
    const newStateString = Boolean(newState) ? 'on' : 'off'

    if (!device) {
        throw new Error(`Set Device State Failed: ${deviceName} not found`)
    }

    let stateObject = await connection.setDevicePowerState(device.deviceid, newStateString)

    if (stateObject.status !== 'ok') {
        throw new Error(`Device ${deviceName} is not available.`)
    }

    return (stateObject.status === 'ok' && stateObject.state === newStateString)
}

const check = () => {
    return (typeof connection.at === 'string' && connection.at !== '')
}

module.exports = { reconnect, getDeviceState, setDeviceState, check }
