const mongoose = require('mongoose')

const mongoIP = process.env.MONGODB_IP
const mongoPort = process.env.MONGODB_PORT

const connString = `mongodb://${mongoIP ? mongoIP : '172.17.0.1'}:${mongoPort ? mongoPort : '27017'}/housecarl-manager`
console.log("connString", connString)

mongoose.connect(connString)

const sensorSchema = new mongoose.Schema({
    sensor: String,
    value: Object,
}, { collection: "sensors" })

const logSchema = new mongoose.Schema({
    meta: [{ key: String, value: String }],
    date: { type: Date, default: Date.now },
    level: Number,
}, { collection: "logs" })

const sensors = mongoose.model('sensors', sensorSchema, 'sensors')
const logs = mongoose.model('logs', logSchema, 'logs')

const saveSensorReading = async (key, value) => {

    sensors.findOne({ sensor: key }, (err, reading) => {

        if (err) {
            console.error(err)
            return false
        }

        if (!reading) {
            let reading = new dao.sensors({ sensor: key, value: value })

            reading.save((err) => {
                if (err) {
                    console.error(err)
                    return false
                }

                console.log(`Sensor ${key} was inserted for the first time with value ${value}`)
                return true
            })

        } else {

            reading.updateOne({ value: value }, (err) => {
                if (err) {
                    console.error(err)
                    return false
                }

                console.log(`Sensor ${key} updated to ${value}`)
                return true
            })
        }
    })
}

const getSensorReading = async (sensor) => {
    return await sensors.findOne({ sensor: sensor }).then(
        (reading) => {
            return reading.value
        },
        (err) => {
            console.warn(`Sensor reading ${sensor} not found`)
            return null
        }
    )
}

const insertLogObject = async (logObject) => {
    let log = new logs()

    log.save((err) => {
        if (err) {
            console.error(`Failed to save log`, err)
            return false
        }

        console.error(`Log inserted succesfully ${JSON.stringify(logObject)}`, err)
        return true
    })
}

const check = () => {
    return mongoose.connection.db.databaseName === 'housecarl-manager'
}

module.exports = { sensors, logs, check, saveSensorReading, insertLogObject, getSensorReading }
