const ewelink = require('ewelink-api')

let requestsCount = 0;
let errorsCount = 0;

const connection = new ewelink({
    email: process.env.EWELINK_EMAIL,
    password: process.env.EWELINK_PASS,
    region: 'us',
})

const connect = () => {
    connection.login().then(() => {
        return true
    }).catch(() => {
        return false
    })
}

const searchDevice = async (deviceName) => {
    const devices = await connection.getDevices()
    requestsCount += 1

    for (let i = 0; i < devices.length; i++) {
        if (devices[i].name.toUpperCase() === deviceName.toUpperCase()) {
            return devices[i]
        }
    }

    errorsCount += 1
    console.error(`Device ${deviceName} not found. Error Rate = ${(errorsCount / requestsCount) * 100}%`)
    return null
}

const getDeviceState = async (deviceName) => {

    const device = await searchDevice(deviceName)

    if (!device) {
        throw new Error(`Get Device State Failed: Device ${deviceName} not found`)
    }

    let stateObject = await connection.getDevicePowerState(device.deviceid)

    return (stateObject.state === 'on')
}

const setDeviceState = async (deviceName, newState) => {

    const device = await searchDevice(deviceName)
    const newStateString = Boolean(newState) ? 'on' : 'off'

    if (!device) {
        throw new Error(`Set Device State Failed: ${deviceName} not found`)
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

module.exports = { connect, getDeviceState, setDeviceState, check }
